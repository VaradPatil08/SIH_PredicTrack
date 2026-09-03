"""
Database setup for PredicTrack's dynamic/user-generated data.

Design decision: static reference data (trains, stations, schedules)
stays in data/mock_trains.json — it doesn't change per-request and is
easiest to seed/expand from public datasets as flat files.

The runtime database is selected by DATABASE_URL. Local development falls
back to SQLite; production should use PostgreSQL so user accounts, preferences,
and crowdsourced reports survive Render restarts/redeploys.
"""

import logging
import os
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

# Render provides DATABASE_URL for PostgreSQL; local development keeps the
# existing SQLite fallback. Deterministically locate railpulse.db regardless
# of whether uvicorn is launched from project root or inside backend/.
_env_db_url = os.getenv("DATABASE_URL")
if not _env_db_url:
    _backend_dir = Path(__file__).resolve().parent.parent
    _root_dir = _backend_dir.parent
    _backend_db = _backend_dir / "railpulse.db"
    _root_db = _root_dir / "railpulse.db"

    if _backend_db.exists() and _backend_db.stat().st_size > 0:
        _chosen_db = _backend_db
    elif _root_db.exists() and _root_db.stat().st_size > 0:
        _chosen_db = _root_db
    else:
        _chosen_db = _backend_db

    SQLALCHEMY_DATABASE_URL = f"sqlite:///{_chosen_db.as_posix()}"
else:
    SQLALCHEMY_DATABASE_URL = _env_db_url

_is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine_kwargs = {}
if _is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _rebuild_reports_table_for_nullable_description(conn):
    """Rebuild an old SQLite reports table whose description is still NOT NULL.

    SQLite does not support ALTER COLUMN, so changing the SQLAlchemy model from
    nullable=False to nullable=True is not enough for an already-created DB.
    This migration preserves existing rows while replacing the old table with
    the current reports schema. It is intentionally local to SQLite so the
    runtime database remains self-contained and requires no new dependency.
    """
    table_info = conn.execute(text("PRAGMA table_info(reports)")).fetchall()
    if not table_info:
        return

    description = next((row for row in table_info if row[1] == "description"), None)
    if description is None or int(description[3]) == 0:
        return

    existing = {row[1] for row in table_info}
    logger.info("Migrating reports.description from NOT NULL to nullable")

    # Avoid foreign-key checks while SQLite replaces the table. The reports
    # table is recreated with the same FK afterwards.
    conn.execute(text("PRAGMA foreign_keys=OFF"))
    try:
        conn.execute(text("DROP INDEX IF EXISTS uq_active_report_user_train"))
        conn.execute(text("DROP TABLE IF EXISTS reports__new"))
        conn.execute(text("""
            CREATE TABLE reports__new (
                id VARCHAR PRIMARY KEY,
                train_number VARCHAR NOT NULL,
                station_code VARCHAR,
                issue_type VARCHAR NOT NULL DEFAULT 'other',
                delay_bucket VARCHAR NOT NULL DEFAULT 'on_time',
                description VARCHAR,
                phone_number VARCHAR,
                user_id VARCHAR REFERENCES users(id),
                is_active BOOLEAN NOT NULL DEFAULT 1,
                resolved_at DATETIME,
                plausibility_score FLOAT NOT NULL DEFAULT 1.0,
                created_at DATETIME
            )
        """))

        def expr(column, default_sql):
            return column if column in existing else default_sql

        conn.execute(text(f"""
            INSERT INTO reports__new (
                id, train_number, station_code, issue_type, delay_bucket,
                description, phone_number, user_id, is_active, resolved_at,
                plausibility_score, created_at
            )
            SELECT
                {expr('id', "NULL")},
                {expr('train_number', "''")},
                {expr('station_code', "NULL")},
                COALESCE({expr('issue_type', "'other'")}, 'other'),
                COALESCE({expr('delay_bucket', "'on_time'")}, 'on_time'),
                {expr('description', "NULL")},
                {expr('phone_number', "NULL")},
                {expr('user_id', "NULL")},
                COALESCE({expr('is_active', "1")}, 1),
                {expr('resolved_at', "NULL")},
                COALESCE({expr('plausibility_score', "1.0")}, 1.0),
                {expr('created_at', "NULL")}
            FROM reports
        """))

        conn.execute(text("DROP TABLE reports"))
        conn.execute(text("ALTER TABLE reports__new RENAME TO reports"))

        # Restore the indexes that SQLAlchemy expects for the Report model.
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_reports_train_number "
            "ON reports(train_number)"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_reports_user_id "
            "ON reports(user_id)"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_reports_is_active "
            "ON reports(is_active)"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_reports_created_at "
            "ON reports(created_at)"
        ))
    finally:
        conn.execute(text("PRAGMA foreign_keys=ON"))


def _deduplicate_active_reports(conn):
    """Keep only the newest active report for each user/train pair."""
    conn.execute(text("""
        UPDATE reports
        SET is_active = 0,
            resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP)
        WHERE id IN (
            SELECT older.id
            FROM reports AS older
            JOIN reports AS newer
              ON older.user_id = newer.user_id
             AND older.train_number = newer.train_number
             AND older.is_active = 1
             AND newer.is_active = 1
             AND older.user_id IS NOT NULL
             AND (
                 older.created_at < newer.created_at
                 OR (older.created_at = newer.created_at AND older.id < newer.id)
             )
        )
    """))


def init_db():
    """Initialize tables and apply backward-compatible SQLite migrations."""
    Base.metadata.create_all(bind=engine)

    # SQLite-only migrations. PostgreSQL gets its tables from create_all and
    # must still continue to the demo-admin provisioning below.
    if _is_sqlite:
        with engine.connect() as conn:
            try:
                result = conn.execute(text("PRAGMA table_info(users)"))
                cols = {row[1] for row in result.fetchall()}
                if cols:
                    if "role" not in cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'passenger'"))
                    if "password_hash" not in cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))

                result = conn.execute(text("PRAGMA table_info(reports)"))
                report_cols = {row[1] for row in result.fetchall()}
                if report_cols:
                    _rebuild_reports_table_for_nullable_description(conn)
                    result = conn.execute(text("PRAGMA table_info(reports)"))
                    report_cols = {row[1] for row in result.fetchall()}
                    migrations = {
                        "issue_type": "ALTER TABLE reports ADD COLUMN issue_type VARCHAR DEFAULT 'other'",
                        "delay_bucket": "ALTER TABLE reports ADD COLUMN delay_bucket VARCHAR DEFAULT 'on_time'",
                        "description": "ALTER TABLE reports ADD COLUMN description VARCHAR",
                        "user_id": "ALTER TABLE reports ADD COLUMN user_id VARCHAR",
                        "is_active": "ALTER TABLE reports ADD COLUMN is_active BOOLEAN DEFAULT 1",
                        "resolved_at": "ALTER TABLE reports ADD COLUMN resolved_at DATETIME",
                        "plausibility_score": "ALTER TABLE reports ADD COLUMN plausibility_score FLOAT DEFAULT 1.0",
                    }
                    for col, ddl in migrations.items():
                        if col not in report_cols:
                            conn.execute(text(ddl))

                    _deduplicate_active_reports(conn)
                    conn.execute(text(
                        "CREATE UNIQUE INDEX IF NOT EXISTS uq_active_report_user_train "
                        "ON reports(user_id, train_number) WHERE is_active = 1"
                    ))
                conn.commit()
            except Exception as exc:
                conn.rollback()
                logger.warning("Database migration check failed: %s", exc, exc_info=True)

    # Ensure demo station admin accounts exist with valid credentials
    try:
        from app.models_db import User
        from app.services.auth_service import hash_password
        with SessionLocal() as session:
            admin_ndls = session.query(User).filter(User.phone_number == "admin_ndls").first()
            if not admin_ndls:
                admin_ndls = User(phone_number="admin_ndls")
                session.add(admin_ndls)
            admin_ndls.name = "NDLS Station Controller"
            admin_ndls.role = "station_admin"
            admin_ndls.password_hash = hash_password("predictrack@admin2026")

            station_admin = session.query(User).filter(User.phone_number == "station_admin").first()
            if not station_admin:
                station_admin = User(phone_number="station_admin")
                session.add(station_admin)
            station_admin.name = "Station Master"
            station_admin.role = "station_admin"
            station_admin.password_hash = hash_password("adminpassword123")

            session.commit()
    except Exception as exc:
        logger.warning("Station admin auto-seed notice: %s", exc)


def get_db():
    """FastAPI dependency — yields a DB session per request, closes after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
