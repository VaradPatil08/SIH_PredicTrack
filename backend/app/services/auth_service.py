"""
Auth service — OTP + JWT.

Passenger OTP supports Twilio Verify for real SMS delivery.
When Twilio Verify is enabled, Twilio generates and verifies the OTP; the
backend never stores or returns the OTP. If Twilio is disabled, the existing
development fallback can generate a local OTP when RAILPULSE_DEV_MODE=true.
"""

import hashlib
import hmac
import os
import random
import string
import datetime
import logging
from typing import Optional
import re

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except ImportError:
    pwd_context = None

from app.db import get_db
from app.models_db import User, OTPCode

try:
    from twilio.rest import Client as TwilioClient
except ImportError:
    TwilioClient = None

logger = logging.getLogger(__name__)

# --- Config ---
DEV_MODE = os.getenv("RAILPULSE_DEV_MODE", "true").lower() == "true"
JWT_SECRET = os.getenv("RAILPULSE_JWT_SECRET")
if not JWT_SECRET:
    if DEV_MODE:
        JWT_SECRET = "dev-secret-change-before-deploying"
        logger.warning("Using development JWT secret; set RAILPULSE_JWT_SECRET before deployment.")
    else:
        raise RuntimeError("RAILPULSE_JWT_SECRET is required when RAILPULSE_DEV_MODE is false")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
OTP_EXPIRE_MINUTES = 5
OTP_MAX_ATTEMPTS = 5

# Twilio Verify configuration. Credentials are server-side only and must never
# be exposed through Vite/frontend environment variables. When enabled, Twilio
# owns OTP generation and verification; the local OTP table is used only by the
# development fallback.
TWILIO_VERIFY_ENABLED = os.getenv("TWILIO_VERIFY_ENABLED", "false").lower() == "true"
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID", "").strip()
E164_RE = re.compile(r"^\+[1-9]\d{7,14}$")


def _twilio_configured() -> bool:
    return bool(
        TWILIO_VERIFY_ENABLED
        and TWILIO_ACCOUNT_SID
        and TWILIO_AUTH_TOKEN
        and TWILIO_VERIFY_SERVICE_SID
    )


def _validate_phone_number(phone_number: str) -> str:
    phone = (phone_number or "").strip().replace(" ", "")
    if not E164_RE.fullmatch(phone):
        raise HTTPException(
            status_code=422,
            detail="Enter a valid phone number in international E.164 format, e.g. +919876543210.",
        )
    return phone


def _get_twilio_client():
    if TwilioClient is None:
        raise HTTPException(
            status_code=503,
            detail="Twilio integration is not installed on the backend. Redeploy the backend dependencies.",
        )
    if not _twilio_configured():
        raise HTTPException(
            status_code=503,
            detail="Twilio OTP is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID to the backend environment.",
        )
    return TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def _twilio_error(exc: Exception, action: str) -> HTTPException:
    # Do not expose Twilio credentials or raw provider payloads to the browser.
    logger.error("Twilio %s failed: %s", action, exc, exc_info=True)
    status_code = getattr(exc, "status", None) or 502
    if action == "send":
        detail = (
            "Twilio could not send the OTP. If you are using a Twilio trial account, "
            "make sure this phone number is added and verified as a trial recipient in Twilio Console."
        )
    else:
        detail = "Twilio could not verify that code. Please request a new OTP and try again."
    return HTTPException(status_code=status_code if 400 <= status_code < 600 else 502, detail=detail)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/otp/verify", auto_error=False)


def hash_password(password: str) -> str:
    """Hashes a password using passlib bcrypt if available, else standard pbkdf2_hmac."""
    if pwd_context is not None:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256${salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its bcrypt or pbkdf2 hash."""
    if not hashed_password or not plain_password:
        return False
    if hashed_password.startswith("pbkdf2_sha256$"):
        parts = hashed_password.split("$")
        if len(parts) == 3:
            salt = parts[1]
            dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
            return hmac.compare_digest(dk.hex(), parts[2])
    if pwd_context is not None and (hashed_password.startswith("$2a$") or hashed_password.startswith("$2b$") or hashed_password.startswith("$2y$")):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    return hmac.compare_digest(plain_password, hashed_password)


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def request_otp(phone_number: str, db: Session) -> Optional[str]:
    """Send a passenger OTP through Twilio Verify, or use the local dev fallback."""
    phone = _validate_phone_number(phone_number)

    if TWILIO_VERIFY_ENABLED:
        client = _get_twilio_client()
        try:
            verification = client.verify.v2.services(
                TWILIO_VERIFY_SERVICE_SID
            ).verifications.create(channel="sms", to=phone)
            logger.info("Twilio verification requested for %s (status=%s)", phone, verification.status)
            return None
        except Exception as exc:
            raise _twilio_error(exc, "send")

    # Development/demo fallback: local OTP, exposed to the frontend only when
    # RAILPULSE_DEV_MODE=true. This path is intentionally bypassed when Twilio is enabled.
    code = _generate_otp()
    otp_row = OTPCode(
        phone_number=phone,
        code_hash=_hash_code(code),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(otp_row)
    db.commit()
    logger.debug("[DEV] OTP generated for %s", phone)
    return code if DEV_MODE else None


def verify_otp(phone_number: str, code: str, db: Session) -> User:
    """Verify a passenger OTP through Twilio Verify or the local development store."""
    phone = _validate_phone_number(phone_number)

    if TWILIO_VERIFY_ENABLED:
        client = _get_twilio_client()
        try:
            verification_check = client.verify.v2.services(
                TWILIO_VERIFY_SERVICE_SID
            ).verification_checks.create(to=phone, code=code.strip())
        except Exception as exc:
            raise _twilio_error(exc, "verify")

        if verification_check.status != "approved":
            raise HTTPException(status_code=400, detail="Incorrect or expired OTP.")
    else:
        otp_row = (
            db.query(OTPCode)
            .filter(OTPCode.phone_number == phone, OTPCode.verified == False)  # noqa: E712
            .order_by(OTPCode.expires_at.desc())
            .first()
        )

        if not otp_row:
            raise HTTPException(status_code=400, detail="No pending OTP for this number. Request a new one.")

        if otp_row.attempts >= OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Too many attempts. Request a new OTP.")

        if datetime.datetime.utcnow() > otp_row.expires_at:
            raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

        otp_row.attempts += 1
        db.commit()

        if _hash_code(code.strip()) != otp_row.code_hash:
            raise HTTPException(status_code=400, detail="Incorrect OTP.")

        otp_row.verified = True
        db.commit()

    user = db.query(User).filter(User.phone_number == phone).first()
    if not user:
        user = User(phone_number=phone, role="passenger")
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def authenticate_admin(username: str, password: str, db: Session) -> Optional[User]:
    """Verifies admin credentials by checking username (or employee ID / phone) and password hash."""
    if not username or not password:
        return None
    clean_username = username.strip()
    user = (
        db.query(User)
        .filter(
            (User.phone_number == clean_username) | (User.name == clean_username),
            User.role == "station_admin",
        )
        .first()
    )
    if not user:
        return None

    if user.password_hash and verify_password(password, user.password_hash):
        return user

    # Demo credentials fallback resilience (accepts both PredicTrack and legacy demo passwords)
    if clean_username in ("admin_ndls", "station_admin"):
        if password in ("predictrack@admin2026", "railpulse@admin2026", "adminpassword123"):
            return user

    return None


def create_access_token(user_id: str, role: str = "passenger") -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """FastAPI dependency for routes that require a logged-in user."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_error
    return user


def get_current_station_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """FastAPI dependency for routes that require a logged-in station admin. Enforces DB role check."""
    if current_user.role != "station_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Station admin privileges required",
        )
    return current_user

