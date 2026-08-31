import logging
import httpx
from sqlalchemy.orm import Session

from app.config import RAILRADAR_API_KEY, RAILRADAR_BASE_URL
from app.models_db import ApiQuotaUsage
from app.services.quota_guard import get_current_month_key

logger = logging.getLogger(__name__)


def _record_quota_usage(db: Session, provider: str = "railradar") -> None:
    """Increments the outbound API quota count for the current month."""
    try:
        month_key = get_current_month_key()
        usage = (
            db.query(ApiQuotaUsage)
            .filter(ApiQuotaUsage.provider == provider, ApiQuotaUsage.month_key == month_key)
            .first()
        )
        if usage:
            usage.request_count += 1
        else:
            usage = ApiQuotaUsage(provider=provider, month_key=month_key, request_count=1)
            db.add(usage)
        db.commit()
    except Exception as e:
        logger.warning(f"[RailRadar] Failed to record quota usage in DB: {e}")
        db.rollback()


def fetch_live(train_number: str, db: Session) -> dict | None:
    """
    Calls the RailRadar live telemetry API for a train number.
    Returns parsed `data` dict on success, None on any failure.
    Never raises — caller degrades gracefully to the simulator.
    """
    clean_train_number = str(train_number).strip()
    if not RAILRADAR_API_KEY:
        logger.warning(f"RailRadar schedule fetch failed for {clean_train_number}: No API key configured in environment")
        return None

    url = f"{RAILRADAR_BASE_URL}/v1/trains/{clean_train_number}/live"
    headers = {
        "Authorization": f"Bearer {RAILRADAR_API_KEY}",
        "Accept": "application/json",
    }
    params = {
        "haltsOnly": "true",
    }

    try:
        logger.info(f"[RailRadar] Fetching live telemetry for train {clean_train_number} from {url}...")
        with httpx.Client(timeout=6.0) as client:
            response = client.get(url, headers=headers, params=params)

        # Record quota usage on every actual outbound HTTP attempt
        _record_quota_usage(db, provider="railradar")

        if response.status_code != 200:
            logger.warning(
                f"RailRadar schedule fetch failed for {clean_train_number}: HTTP {response.status_code} - {response.text[:200]}"
            )
            return None

        payload = response.json()
        if not payload.get("success") or "data" not in payload:
            logger.warning(
                f"RailRadar schedule fetch failed for {clean_train_number}: Unsuccessful response payload {payload}"
            )
            return None

        return payload.get("data")

    except httpx.TimeoutException as e:
        logger.warning(f"RailRadar schedule fetch failed for {clean_train_number}: Request timed out (4s) - {e}")
        _record_quota_usage(db, provider="railradar")
        return None
    except Exception as e:
        logger.warning(f"RailRadar schedule fetch failed for {clean_train_number}: {e}")
        return None

