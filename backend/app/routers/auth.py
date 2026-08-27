from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.auth_schemas import OTPRequestIn, OTPRequestOut, OTPVerifyIn, TokenOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp/request", response_model=OTPRequestOut)
def request_otp(payload: OTPRequestIn, db: Session = Depends(get_db)):
    """
    Sends (or in dev mode, returns) a 6-digit OTP for the given phone
    number. Used for both login and to lightly gate crowdsourced report
    submission against spam/bots.
    """
    code = auth_service.request_otp(payload.phone_number, db)
    return OTPRequestOut(
        message="OTP sent." if code is None else "DEV_MODE: OTP generated (see dev_otp field).",
        dev_otp=code,
    )


@router.post("/otp/verify", response_model=TokenOut)
def verify_otp(payload: OTPVerifyIn, db: Session = Depends(get_db)):
    """Verifies an OTP, creating the user on first login, and returns a JWT."""
    user = auth_service.verify_otp(payload.phone_number, payload.code, db)

    if payload.name and not user.name:
        user.name = payload.name
        db.commit()

    token = auth_service.create_access_token(user.id)
    return TokenOut(access_token=token, user_id=user.id)
