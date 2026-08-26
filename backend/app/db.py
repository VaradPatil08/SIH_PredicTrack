"""
Database setup for RailPulse's dynamic/user-generated data.

Design decision: static reference data (trains, stations, schedules)
stays in data/mock_trains.json — it doesn't change per-request and is
easiest to seed/expand from public datasets as flat files.

This SQLite DB is only for data that's created at runtime by users:
accounts, saved preferences, and crowdsourced disruption reports.
SQLite is enough for a hackathon; swap SQLALCHEMY_DATABASE_URL for a
Postgres URL later with no code changes elsewhere if needed.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./railpulse.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session per request, closes after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
