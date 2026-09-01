import datetime
import json
import logging
from sqlalchemy.orm import Session


from app.config import RAILRADAR_CACHE_TTL_SECONDS
from app.models_db import TrainLiveCache
from app.services import quota_guard, railradar_client, railradar_interpolation, live_feed

logger = logging.getLogger(__name__)


def get_simulated_cache(clean_num: str, train: dict, db: Session) -> TrainLiveCache:
    """Create/update a shared simulated snapshot without making an external API call."""
    now = datetime.datetime.utcnow()
    stations = train.get("stations", [])
    sim_pos, _, _ = live_feed.get_live_position_and_state(
        stations,
        train_number=clean_num,
        start_offset_min=train.get("sim_start_offset_min", 0),
    )

    cached = db.query(TrainLiveCache).filter(TrainLiveCache.train_number == clean_num).first()
    if cached is None:
        cached = TrainLiveCache(train_number=clean_num)
        db.add(cached)

    cached.source = "simulated"
    cached.synced_at = now
    cached.lat = sim_pos["lat"]
    cached.lng = sim_pos["lng"]
    cached.speed_kmh = sim_pos["speed_kmh"]
    cached.bearing_degrees = None
    cached.next_station_code = sim_pos.get("next_station_code")
    cached.next_station_name = sim_pos.get("next_station_name")
    cached.distance_to_next_km = sim_pos.get("distance_to_next_km")
    cached.raw_response = None
    db.commit()
    return cached


def perform_live_sync(
    clean_num: str,
    train: dict,
    db: Session,
    active_sync: bool = True,
    force_sync: bool = False,
) -> TrainLiveCache:
    """
    Core RailRadar telemetry sync & cache upsert logic.
    - If cache exists and age < RAILRADAR_CACHE_TTL_SECONDS: returns existing cached record.
    - If stale (> TTL) or missing:
      - If active_sync is True and quota_guard.has_budget(db): calls RailRadar API, interpolates, and updates cache with source="railradar".
      - If active_sync is False, or on budget exhaustion / RailRadar failure: degrades gracefully to simulator (source="simulated").
    """
    now = datetime.datetime.utcnow()
    stations = train.get("stations", [])

    # 1. Check shared DB cache for fresh snapshot within TTL window
    cached = db.query(TrainLiveCache).filter(TrainLiveCache.train_number == clean_num).first()
    if cached:
        age_seconds = (now - cached.synced_at).total_seconds()
        if age_seconds < RAILRADAR_CACHE_TTL_SECONDS and not force_sync:
            return cached

    # If active sync is disabled for this train (e.g. beyond top N cap in admin view),
    # do NOT make outbound HTTP calls; fall back immediately to simulated state.
    if not active_sync:
        if cached is not None and cached.source == "railradar":
            return cached
        return get_simulated_cache(clean_num, train, db)

    # 2. Check quota budget before outbound call
    if not quota_guard.has_budget(db):
        logger.warning(f"RailRadar schedule fetch failed for {clean_num}: Quota budget exhausted")
        return get_simulated_cache(clean_num, train, db)

    # 3. Fetch from RailRadar API
    raw_data = railradar_client.fetch_live(clean_num, db)
    if raw_data:
        interpolated = railradar_interpolation.interpolate_railradar_position(raw_data, stations)
        if interpolated:
            # Upsert cache with real RailRadar telemetry
            if cached:
                cached.source = "railradar"
                cached.synced_at = now
                cached.lat = interpolated["lat"]
                cached.lng = interpolated["lng"]
                cached.speed_kmh = interpolated["speed_kmh"]
                cached.bearing_degrees = interpolated.get("bearing_degrees")
                cached.next_station_code = interpolated.get("next_station_code")
                cached.next_station_name = interpolated.get("next_station_name")
                cached.distance_to_next_km = interpolated.get("distance_to_next_km")
                cached.raw_response = json.dumps(raw_data)
            else:
                cached = TrainLiveCache(
                    train_number=clean_num,
                    source="railradar",
                    synced_at=now,
                    lat=interpolated["lat"],
                    lng=interpolated["lng"],
                    speed_kmh=interpolated["speed_kmh"],
                    bearing_degrees=interpolated.get("bearing_degrees"),
                    next_station_code=interpolated.get("next_station_code"),
                    next_station_name=interpolated.get("next_station_name"),
                    distance_to_next_km=interpolated.get("distance_to_next_km"),
                    raw_response=json.dumps(raw_data),
                )
                db.add(cached)
            db.commit()
            return cached
        else:
            logger.warning(f"RailRadar schedule fetch failed for {clean_num}: Route interpolation / station matching failed against train route")

    # Fallback to simulated position if RailRadar failed, unmapped route, or offline
    return get_simulated_cache(clean_num, train, db)
