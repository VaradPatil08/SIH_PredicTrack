from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import hashlib
import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db, SessionLocal
from app.models.schemas import StationPickerItem, StationArrivalItem
from app.models_db import User
from app.routers.trains import _MOCK_TRAINS, _compute_base_delay
from app.services import eta, live_feed, live_sync, auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed"
_SCHEDULE_CSV_PATH = _DATA_DIR / "train_schedule_clean.csv"

_HALT_LOOKUP: dict[str, int] = {}
_STATION_TO_TRAINS: dict[str, list[tuple[str, int]]] = {}
_STATION_NAMES: dict[str, str] = {}
_STATIONS_LIST: list[StationPickerItem] = []


def _parse_time_to_minutes(time_str: Optional[str]) -> int:
    if not time_str:
        return 0
    parts = str(time_str).strip().split(":")
    if len(parts) >= 2:
        try:
            return int(parts[0]) * 60 + int(parts[1])
        except (ValueError, TypeError):
            return 0
    return 0


def _build_admin_indices():
    global _HALT_LOOKUP, _STATION_TO_TRAINS, _STATION_NAMES, _STATIONS_LIST

    if _SCHEDULE_CSV_PATH.exists():
        try:
            with open(_SCHEDULE_CSV_PATH, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    tid = (row.get("train_id") or "").strip()
                    scode = (row.get("station_code") or "").strip().upper()
                    arr = row.get("scheduled_arrival")
                    dep = row.get("scheduled_departure")
                    if tid and scode and arr and dep:
                        try:
                            a_min = _parse_time_to_minutes(arr)
                            d_min = _parse_time_to_minutes(dep)
                            diff = d_min - a_min
                            if diff < 0:
                                diff += 1440
                            _HALT_LOOKUP[f"{tid}_{scode}"] = max(0, diff)
                        except Exception:
                            _HALT_LOOKUP[f"{tid}_{scode}"] = 0
        except Exception as e:
            logger.warning(f"Could not parse {_SCHEDULE_CSV_PATH} for halt durations: {e}")


    for train_number, train_data in _MOCK_TRAINS.items():
        stations = train_data.get("stations", [])
        for idx, st in enumerate(stations):
            code = (st.get("code") or "").strip().upper()
            name = (st.get("name") or "").strip()
            if code:
                if code not in _STATION_TO_TRAINS:
                    _STATION_TO_TRAINS[code] = []
                    _STATION_NAMES[code] = name or code
                _STATION_TO_TRAINS[code].append((train_number, idx))

    _STATIONS_LIST = sorted(
        [StationPickerItem(code=code, name=name) for code, name in _STATION_NAMES.items()],
        key=lambda s: s.name.lower()
    )


_build_admin_indices()


def _compute_platform(train_number: str, station_code: str) -> int:
    key = f"{train_number}_{station_code}".encode("utf-8")
    return (int(hashlib.md5(key).hexdigest(), 16) % 6) + 1


@router.get("/stations", response_model=list[StationPickerItem])
def get_admin_stations(
    current_admin: User = Depends(auth_service.get_current_station_admin),
):
    return _STATIONS_LIST


# Latency bounding constants for Admin arrivals view:
# 1. MAX_ACTIVE_SYNC_TRAINS: Caps how many soonest-arriving trains trigger an outbound
#    network sync attempt per station view. Any remaining trains beyond this cap read from
#    the shared DB cache (or fall back to simulator) without triggering outbound HTTP calls.
# 2. MAX_SYNC_WORKERS: Thread pool concurrency cap to parallelize blocking httpx calls,
#    ensuring total endpoint latency is bounded by ~1 single request timeout (~6s worst-case)
#    rather than accumulating sequentially across all trains (which previously caused 20s+ latency).
MAX_ACTIVE_SYNC_TRAINS = 10
MAX_SYNC_WORKERS = 8


def _sync_single_train(train_number: str, train: dict, active_sync: bool) -> tuple[str, Optional[dict]]:
    """Worker function executed in thread pool for parallel RailRadar telemetry sync."""
    thread_db = SessionLocal()
    try:
        cached = live_sync.perform_live_sync(train_number, train, thread_db, active_sync=active_sync)
        if cached and cached.source == "railradar":
            return train_number, {
                "lat": cached.lat,
                "lng": cached.lng,
                "speed_kmh": cached.speed_kmh,
                "live_source": "railradar",
                "live_synced_at": cached.synced_at.isoformat() if cached.synced_at else None,
            }
    except Exception as exc:
        logger.warning(f"Live sync thread failed for train {train_number}: {exc}")
    finally:
        thread_db.close()
    return train_number, None


@router.get("/station/{code}/arrivals", response_model=list[StationArrivalItem])
def get_station_arrivals(
    code: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(auth_service.get_current_station_admin),
):
    """
    Returns upcoming/live arrivals for the given station code, sorted soonest first,
    capped at the top 30 arrivals. Reuses live delay telemetry and shared RailRadar sync
    with bounded latency via thread-pooled parallelization.
    """
    station_code = code.strip().upper()
    if station_code not in _STATION_TO_TRAINS:
        raise HTTPException(status_code=404, detail=f"Unknown station code: {code}")

    # Prioritize trains arriving at this station (stn_idx > 0)
    train_entries = [e for e in _STATION_TO_TRAINS[station_code] if e[1] > 0]
    if not train_entries:
        train_entries = _STATION_TO_TRAINS[station_code]

    eta._try_load_model()

    # Filter and pre-sort candidate trains by scheduled arrival offset to evaluate the top 30
    candidates = []
    for train_number, stn_idx in train_entries:
        train = _MOCK_TRAINS.get(train_number)
        if not train:
            continue
        stations = train.get("stations", [])
        if stn_idx >= len(stations):
            continue
        st = stations[stn_idx]
        sched_offset = st.get("scheduled_offset_min", 0)
        candidates.append((train_number, stn_idx, sched_offset, train, stations, st))

    candidates.sort(key=lambda c: c[2])
    selected_candidates = candidates[:30]

    # Determine which trains qualify for active network sync (top MAX_ACTIVE_SYNC_TRAINS soonest)
    active_sync_trains = set(c[0] for c in selected_candidates[:MAX_ACTIVE_SYNC_TRAINS])

    # Parallelize live sync calls across thread pool to bound worst-case latency
    telemetry_map = {}
    if selected_candidates:
        num_workers = min(len(selected_candidates), MAX_SYNC_WORKERS)
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [
                executor.submit(
                    _sync_single_train,
                    train_number,
                    train,
                    (train_number in active_sync_trains),
                )
                for train_number, _, _, train, _, _ in selected_candidates
            ]
            for future in as_completed(futures):
                try:
                    tn, tele = future.result()
                    if tele:
                        telemetry_map[tn] = tele
                except Exception as exc:
                    logger.warning(f"Error gathering live sync result: {exc}")

    arrivals = []
    for train_number, stn_idx, sched_offset, train, stations, st in selected_candidates:
        sim_offset = train.get("sim_start_offset_min", 0)

        tele = telemetry_map.get(train_number)
        if tele:
            lat = tele["lat"]
            lng = tele["lng"]
            speed_kmh = tele["speed_kmh"]
            live_source = tele["live_source"]
            live_synced_at = tele["live_synced_at"]
            _, elapsed_min, current_station_index = live_feed.get_live_position_and_state(
                stations,
                train_number=train_number,
                start_offset_min=sim_offset,
            )
        else:
            position, elapsed_min, current_station_index = live_feed.get_live_position_and_state(
                stations,
                train_number=train_number,
                start_offset_min=sim_offset,
            )
            lat = position.get("lat")
            lng = position.get("lng")
            speed_kmh = position.get("speed_kmh")
            live_source = "simulated"
            live_synced_at = None

        base_delay = _compute_base_delay(train_number, stations, float(elapsed_min))

        if stn_idx < current_station_index:
            status = "departed"
            delay = 0 if stn_idx == 0 else max(0, base_delay - (current_station_index - stn_idx) * 2)
        elif stn_idx == current_station_index:
            status = "delayed" if base_delay > 2 else "on_time"
            delay = base_delay
        else:
            delay, _ = eta.predict_delay_minutes(
                train_number=train_number,
                station_code=st["code"],
                distance_km=st.get("distance_km", 0),
                current_delay_min=base_delay,
                total_distance_km=train.get("total_distance_km"),
            )
            status = eta.status_from_delay(delay)

        pred_offset = sched_offset + delay
        platform = _compute_platform(train_number, station_code)

        # Lookup halt duration: 0 for origin/destination, real CSV halt or 5 min fallback for mid-route
        if stn_idx == 0 or stn_idx == len(stations) - 1:
            halt = 0
        else:
            halt = _HALT_LOOKUP.get(f"{train_number}_{station_code}")
            if halt is None or halt <= 0:
                halt = 5

        direction = f"Towards {stations[-1]['name']}"

        arrivals.append(
            StationArrivalItem(
                train_number=train_number,
                train_name=train.get("name", f"Train {train_number}"),
                platform=platform,
                scheduled_arrival_offset_min=sched_offset,
                predicted_delay_min=delay,
                predicted_arrival_offset_min=pred_offset,
                halt_min=halt,
                status=status,
                direction=direction,
                lat=lat,
                lng=lng,
                speed_kmh=speed_kmh,
                live_source=live_source,
                live_synced_at=live_synced_at,
            )
        )

    arrivals.sort(key=lambda a: a.predicted_arrival_offset_min)
    return arrivals[:30]
