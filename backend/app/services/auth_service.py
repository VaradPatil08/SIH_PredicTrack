"""
Auth service — OTP + JWT.

SMS SENDING IS STUBBED. In production, `_send_otp_sms` is where you'd
call Firebase Phone Auth, MSG91, or Twilio. For the hackathon, DEV_MODE
returns the OTP directly in the API response and logs it, so the team
can test/demo the full login flow without a paid SMS provider or DLT
sender-ID registration (which real Indian SMS services require and
which you will not get approved in time for the hackathon).

Before any real deployment: set DEV_MODE = False and implement
_send_otp_sms for a real provider, or OTPs will be exposed in API
responses.
"""

import hashlib
import hmac
import os
import random
import string
import datetime
import logging
from typing import Optional

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


def _send_otp_sms(phone_number: str, code: str) -> None:
    """
    STUB — replace with a real SMS provider before any real deployment.
    Firebase Phone Auth is the easiest path (free tier, no DLT
    registration needed since Firebase handles delivery).
    """
    logger.debug("[DEV] OTP generated for %s", phone_number)


def request_otp(phone_number: str, db: Session) -> Optional[str]:
    """Generates and stores an OTP for a phone number. Returns the code if DEV_MODE, else None."""
    code = _generate_otp()
    otp_row = OTPCode(
        phone_number=phone_number,
        code_hash=_hash_code(code),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(otp_row)
    db.commit()

    _send_otp_sms(phone_number, code)
    return code if DEV_MODE else None


def verify_otp(phone_number: str, code: str, db: Session) -> User:
    """Verifies an OTP and returns (creating if needed) the associated User."""
    otp_row = (
        db.query(OTPCode)
        .filter(OTPCode.phone_number == phone_number, OTPCode.verified == False)  # noqa: E712
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

    if _hash_code(code) != otp_row.code_hash:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    otp_row.verified = True
    db.commit()

    user = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        user = User(phone_number=phone_number, role="passenger")
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
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


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

