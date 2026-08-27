from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ---- Auth ----

class OTPRequestIn(BaseModel):
    phone_number: str = Field(..., description="E.164 format, e.g. +919876543210")


class OTPRequestOut(BaseModel):
    message: str
    # Only populated when DEV_MODE is on (see auth_service.py). Never set
    # this in a real deployment — it exists purely so the team can test
    # the flow without a working SMS provider during the hackathon.
    dev_otp: Optional[str] = None


class OTPVerifyIn(BaseModel):
    phone_number: str
    code: str
    name: Optional[str] = None  # optional display name on first verify


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


class UserOut(BaseModel):
    id: str
    phone_number: str
    name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Preferences ----

class PreferenceIn(BaseModel):
    train_number: str


class PreferenceOut(BaseModel):
    id: str
    train_number: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Reports ----

class ReportIn(BaseModel):
    station_code: Optional[str] = None
    description: str = Field(..., min_length=3, max_length=500)
    phone_number: Optional[str] = None  # if provided, must be OTP-verified first


class ReportOut(BaseModel):
    id: str
    train_number: str
    station_code: Optional[str]
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportSummaryOut(BaseModel):
    train_number: str
    window_hours: int
    report_count: int
    flagged: bool  # true if report_count >= threshold within window
    recent_reports: List[ReportOut]


# ---- PNR lookup (ticket upload -> train number) ----

class PNRLookupIn(BaseModel):
    pnr_number: str = Field(..., min_length=10, max_length=10)


class PNRLookupOut(BaseModel):
    found: bool
    train_number: Optional[str] = None
    message: str
