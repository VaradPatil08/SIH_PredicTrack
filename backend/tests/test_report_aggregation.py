import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models_db import Report, User
from app.services.report_aggregation import get_crowd_delay_estimate


def _db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def _report(db, user_id, bucket, issue="delay", age_minutes=5):
    db.add(Report(
        train_number="12951",
        user_id=user_id,
        phone_number=f"+910000000{user_id[-1]}",
        issue_type=issue,
        delay_bucket=bucket,
        description=None,
        is_active=True,
        plausibility_score=1.0,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=age_minutes),
    ))


def test_mad_rejects_single_extreme_outlier():
    db = _db()
    users = [User(id=f"u{i}", phone_number=f"+91{i:010d}") for i in range(4)]
    db.add_all(users)
    db.commit()
    for u, bucket in zip(users, ["30min", "30min", "30min", "cancelled_looking"]):
        _report(db, u.id, bucket)
    db.commit()

    result = get_crowd_delay_estimate("12951", db)
    assert result is not None
    assert result["crowd_delay_min"] == 30.0
    assert result["report_count"] == 3


def test_confidence_threshold_gates_small_crowd():
    db = _db()
    users = [User(id=f"u{i}", phone_number=f"+91{i:010d}") for i in range(2)]
    db.add_all(users)
    db.commit()
    for u in users:
        _report(db, u.id, "30min")
    db.commit()
    assert get_crowd_delay_estimate("12951", db) is None


def test_one_report_per_user_per_train_upsert_behavior():
    from app.models.auth_schemas import ReportIn
    from app.routers.reports import submit_report

    db = _db()
    user = User(id="upsert-user", phone_number="+919999999999")
    db.add(user)
    db.commit()

    first = submit_report("12951", ReportIn(
        station_code="ST", issue_type="delay", delay_bucket="15min", description="Signal hold"
    ), user, db)
    first_id = first.id

    second = submit_report("12951", ReportIn(
        station_code="BRC", issue_type="signal_fault", delay_bucket="30min", description="Signal fault"
    ), user, db)

    assert second.id == first_id
    assert second.station_code == "BRC"
    assert second.issue_type == "signal_fault"
    assert second.delay_bucket == "30min"
    assert db.query(Report).filter(Report.user_id == user.id, Report.train_number == "12951").count() == 1
