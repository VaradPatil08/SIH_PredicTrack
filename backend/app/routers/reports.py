import datetime
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db
from app.models.auth_schemas import ReportIn, ReportOut, ReportSummaryOut
from app.models_db import Report, User
from app.services.auth_service import get_current_user
from app.services import live_feed
from app.services.report_filters import is_low_quality_text
from app.services.report_aggregation import FLAG_THRESHOLD as AGG_FLAG_THRESHOLD

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trains", tags=["reports"])

FLAG_THRESHOLD = AGG_FLAG_THRESHOLD
FLAG_WINDOW_HOURS = 3


def _expire_reports(reports: list[Report]) -> bool:
    """Lazily mark expired reports inactive; returns whether anything changed."""
    now = datetime.datetime.utcnow()
    cutoff = now - datetime.timedelta(hours=FLAG_WINDOW_HOURS)
    changed = False
    for report in reports:
        if report.is_active and report.created_at < cutoff:
            report.is_active = False
            if report.resolved_at is None:
                report.resolved_at = now
            changed = True
    return changed


def _station_plausibility(train_number: str, station_code: str | None, train: dict) -> float:
    """Score whether the reported station is temporally plausible for the train."""
    if not station_code:
        return 1.0
    target = str(station_code).strip().upper()
    stations = train.get("stations", [])
    station = next((s for s in stations if str(s.get("code", "")).upper() == target), None)
    if not station:
        return 0.35

    try:
        _, elapsed_min, current_index = live_feed.get_live_position_and_state(
            stations,
            train_number=train_number,
            start_offset_min=train.get("sim_start_offset_min", 0),
        )
        scheduled = float(station.get("scheduled_offset_min", 0))
        diff = scheduled - float(elapsed_min)
        # At/near the current section is strongest. More than two hours behind
        # or ahead receives a progressively lower score, but is never rejected.
        if abs(diff) <= 30:
            return 1.0
        return max(0.1, 1.0 - (abs(diff) - 30.0) / 240.0)
    except Exception:
        logger.debug("Could not calculate report plausibility for %s", train_number, exc_info=True)
        return 0.5


@router.post("/{train_number}/reports", response_model=ReportOut)
def submit_report(
    train_number: str,
    payload: ReportIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or refresh the authenticated user's active report for a train."""
    clean_num = str(train_number).strip()
    now = datetime.datetime.utcnow()

    # Expire this user's stale active report before looking for the UPSERT target.
    existing = (
        db.query(Report)
        .filter(
            Report.user_id == current_user.id,
            Report.train_number == clean_num,
            Report.is_active.is_(True),
        )
        .first()
    )
    if existing and existing.created_at < now - datetime.timedelta(hours=FLAG_WINDOW_HOURS):
        existing.is_active = False
        existing.resolved_at = existing.resolved_at or now
        db.commit()
        existing = None

    train = None
    try:
        from app.routers.trains import _MOCK_TRAINS
        train = _MOCK_TRAINS.get(clean_num)
    except Exception:
        pass

    plausibility = _station_plausibility(clean_num, payload.station_code, train) if train else 0.5
    if payload.description and is_low_quality_text(payload.description):
        logger.debug("Low-quality supplementary report text ignored by future NLP features for %s", clean_num)

    if existing:
        report = existing
        report.station_code = payload.station_code
        report.issue_type = payload.issue_type
        report.delay_bucket = payload.delay_bucket
        report.description = payload.description
        report.phone_number = current_user.phone_number
        report.is_active = True
        report.resolved_at = None
        report.plausibility_score = plausibility
        report.created_at = now
    else:
        report = Report(
            train_number=clean_num,
            station_code=payload.station_code,
            issue_type=payload.issue_type,
            delay_bucket=payload.delay_bucket,
            description=payload.description,
            phone_number=current_user.phone_number,
            user_id=current_user.id,
            is_active=True,
            resolved_at=None,
            plausibility_score=plausibility,
            created_at=now,
        )
        db.add(report)

    try:
        db.commit()
    except IntegrityError:
        # Protect the UPSERT contract under a rare concurrent double-submit.
        db.rollback()
        report = (
            db.query(Report)
            .filter(
                Report.user_id == current_user.id,
                Report.train_number == clean_num,
                Report.is_active.is_(True),
            )
            .first()
        )
        if report is None:
            raise
        report.station_code = payload.station_code
        report.issue_type = payload.issue_type
        report.delay_bucket = payload.delay_bucket
        report.description = payload.description
        report.phone_number = current_user.phone_number
        report.created_at = now
        report.resolved_at = None
        report.plausibility_score = plausibility
        db.commit()

    db.refresh(report)
    return report


@router.get("/{train_number}/reports", response_model=list[ReportOut])
def list_reports(train_number: str, db: Session = Depends(get_db)):
    reports = (
        db.query(Report)
        .filter(Report.train_number == train_number, Report.is_active.is_(True))
        .order_by(Report.created_at.desc())
        .limit(50)
        .all()
    )
    if _expire_reports(reports):
        db.commit()
        reports = [r for r in reports if r.is_active]
    return reports


@router.get("/{train_number}/reports/summary", response_model=ReportSummaryOut)
def report_summary(train_number: str, db: Session = Depends(get_db)):
    """Return only active reports inside the current flagging window."""
    window_start = datetime.datetime.utcnow() - datetime.timedelta(hours=FLAG_WINDOW_HOURS)
    recent = (
        db.query(Report)
        .filter(
            Report.train_number == train_number,
            Report.is_active.is_(True),
            Report.created_at >= window_start,
        )
        .order_by(Report.created_at.desc())
        .all()
    )
    if _expire_reports(recent):
        db.commit()
        recent = [r for r in recent if r.is_active]

    return ReportSummaryOut(
        train_number=train_number,
        window_hours=FLAG_WINDOW_HOURS,
        report_count=len(recent),
        flagged=len(recent) >= FLAG_THRESHOLD,
        recent_reports=recent[:10],
    )
