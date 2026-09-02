import datetime
import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Float, Text, UniqueConstraint, Index, text
from sqlalchemy.orm import relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    phone_number = Column(String, unique=True, nullable=True, index=True)
    name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="passenger")
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    preferences = relationship("Preference", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")


class Preference(Base):
    """A user's saved/favorited train, for the personalized dashboard."""
    __tablename__ = "preferences"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    train_number = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="preferences")


class Report(Base):
    """A crowdsourced report representing a user's current disruption experience."""
    __tablename__ = "reports"
    __table_args__ = (
        # Keep one active report per user/train while allowing historical/inactive rows.
        # Both SQLite and PostgreSQL use a partial unique index.
        Index(
            "uq_active_report_user_train",
            "user_id",
            "train_number",
            unique=True,
            sqlite_where=text("is_active = 1"),
            postgresql_where=text("is_active = true"),
        ),
    )

    id = Column(String, primary_key=True, default=_uuid)
    train_number = Column(String, nullable=False, index=True)
    station_code = Column(String, nullable=True)
    issue_type = Column(String, nullable=False, default="other")
    delay_bucket = Column(String, nullable=False, default="on_time")
    description = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)  # retained for backward compatibility/display
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    resolved_at = Column(DateTime, nullable=True)
    plausibility_score = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="reports")


class OTPCode(Base):
    """
    Short-lived OTP codes for phone verification.
    """
    __tablename__ = "otp_codes"

    id = Column(String, primary_key=True, default=_uuid)
    phone_number = Column(String, nullable=False, index=True)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)


class TrainLiveCache(Base):
    """
    Server-side shared live position cache for trains synced with RailRadar or Simulator.
    Shared across every visitor to conserve API quotas and provide synchronized telemetry.
    """
    __tablename__ = "train_live_cache"

    train_number = Column(String, primary_key=True, index=True)
    source = Column(String, nullable=False, default="simulated")  # "railradar" | "simulated"
    synced_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed_kmh = Column(Float, nullable=False, default=0.0)
    bearing_degrees = Column(Float, nullable=True)
    next_station_code = Column(String, nullable=True)
    next_station_name = Column(String, nullable=True)
    distance_to_next_km = Column(Float, nullable=True)
    raw_response = Column(Text, nullable=True)


class ApiQuotaUsage(Base):
    """
    Tracks external API provider quota usage per month (e.g. RailRadar 1000 req/month limit).
    """
    __tablename__ = "api_quota_usage"
    __table_args__ = (
        UniqueConstraint("provider", "month_key", name="uq_provider_month"),
    )

    id = Column(String, primary_key=True, default=_uuid)
    provider = Column(String, nullable=False, index=True)
    month_key = Column(String, nullable=False, index=True)  # Format: "YYYY-MM"
    request_count = Column(Integer, nullable=False, default=0)
