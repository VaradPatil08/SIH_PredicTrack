"""Pure aggregation helpers for crowdsourced disruption reports."""

import datetime as dt
from collections import Counter
from statistics import median

from sqlalchemy.orm import Session

from app.models_db import Report

# Kept here as shared, dependency-free defaults. reports.py exposes the same
# values for API/reporting compatibility.
FLAG_THRESHOLD = 3
FLAG_WINDOW_HOURS = 3
DELAY_BUCKET_MINUTES = {
    "on_time": 0,
    "15min": 15,
    "30min": 30,
    "1hr": 60,
    "2hr_plus": 120,
    "cancelled_looking": 180,
}


def _weighted_median(values):
    pairs = sorted(values, key=lambda x: x[0])
    total = sum(max(0.0, w) for _, w in pairs)
    if not pairs or total <= 0:
        return None
    halfway = total / 2.0
    running = 0.0
    for value, weight in pairs:
        running += max(0.0, weight)
        if running >= halfway:
            return float(value)
    return float(pairs[-1][0])


def get_crowd_delay_estimate(train_number: str, db: Session) -> dict | None:
    """Return a robust, recency/plausibility-weighted crowd delay estimate."""
    now = dt.datetime.utcnow()
    window_start = now - dt.timedelta(hours=FLAG_WINDOW_HOURS)
    reports = (
        db.query(Report)
        .filter(
            Report.train_number == train_number,
            Report.is_active.is_(True),
            Report.created_at >= window_start,
            Report.user_id.isnot(None),
        )
        .all()
    )

    # One active report per user/train is enforced by the endpoint/index; count
    # distinct users here as an additional defense against legacy DB rows.
    by_user = {}
    for report in reports:
        if report.user_id not in by_user or report.created_at > by_user[report.user_id].created_at:
            by_user[report.user_id] = report
    reports = list(by_user.values())
    if len(reports) < FLAG_THRESHOLD:
        return None

    values = [DELAY_BUCKET_MINUTES.get(r.delay_bucket, 0) for r in reports]
    med = median(values)
    deviations = [abs(v - med) for v in values]
    mad = median(deviations)

    if len(reports) >= 4:
        if mad == 0:
            survivors = [r for r, v in zip(reports, values) if v == med]
        else:
            cutoff = 2.5 * mad
            survivors = [r for r, v in zip(reports, values) if abs(v - med) <= cutoff]
    else:
        survivors = reports

    if not survivors:
        return None

    # Recompute consensus spread on the surviving signal.
    survivor_values = [DELAY_BUCKET_MINUTES.get(r.delay_bucket, 0) for r in survivors]
    consensus_mad = median([abs(v - median(survivor_values)) for v in survivor_values])
    weighted = []
    for report, value in zip(survivors, survivor_values):
        age_hours = max(0.0, (now - report.created_at).total_seconds() / 3600.0)
        recency = max(0.0, 1.0 - age_hours / FLAG_WINDOW_HOURS)
        plausibility = min(1.0, max(0.0, float(report.plausibility_score or 0.0)))
        weight = max(0.01, recency * plausibility)
        weighted.append((value, weight))

    crowd_delay = _weighted_median(weighted)
    if crowd_delay is None:
        return None

    tightness = max(0.0, min(1.0, 1.0 - consensus_mad / max(60.0, abs(median(survivor_values)), 1.0)))
    count_scale = max(0.0, min(1.0, len(survivors) / float(FLAG_THRESHOLD * 2)))
    confidence = max(0.0, min(1.0, tightness * (0.5 + 0.5 * count_scale)))

    dominant_issue_type = Counter(r.issue_type for r in survivors).most_common(1)[0][0]
    return {
        "crowd_delay_min": float(crowd_delay),
        "confidence": float(confidence),
        "report_count": len(survivors),
        "dominant_issue_type": dominant_issue_type,
    }
