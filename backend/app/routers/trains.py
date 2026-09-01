import csv
import datetime
import json
import logging
import math
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import RAILRADAR_CACHE_TTL_SECONDS
from app.db import get_db
from app.models_db import TrainLiveCache
from app.models.schemas import (
    CurrentPosition,
    DelayReasonsResponse,
    LiveSyncResponse,
    ModelMetrics,
    Station,
    StationETA,
    TrainETAResponse,
    TrainRouteResponse,
    TrainSummary,
)
from app.services import (
    eta,
    live_feed,
    live_sync,
    quota_guard,
    railradar_client,
    railradar_interpolation,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["trains"])

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_trains.json"
with open(_DATA_PATH, encoding="utf-8") as f:
    _MOCK_TRAINS = json.load(f)

# Module-level sim start so delay random-walk is stable per server restart
_DELAY_SIM_START = time.time()

# Real schedule lookup from train_schedule_clean.csv
_SCHEDULE_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed"
_SCHEDULE_CSV_PATH = _SCHEDULE_DATA_DIR / "train_schedule_clean.csv"

_TRAIN_FIRST_DEP: dict[str, str] = {}
_TRAIN_SCHEDULE_LOOKUP: dict[str, dict[str, dict]] = {}


def _parse_time_str(time_str: str | None) -> str:
    if not time_str:
        return ""
    parts = str(time_str).strip().split(":")
    if len(parts) >= 2:
        try:
            return f"{int(parts[0]):02d}:{int(parts[1]):02d}"
        except (ValueError, TypeError):
            return ""
    return ""


def _parse_time_to_minutes(time_str: str | None) -> int:
    if not time_str:
        return 0
    parts = str(time_str).strip().split(":")
    if len(parts) >= 2:
        try:
            return int(parts[0]) * 60 + int(parts[1])
        except (ValueError, TypeError):
            return 0
    return 0


def _build_schedule_indices():
    global _TRAIN_FIRST_DEP, _TRAIN_SCHEDULE_LOOKUP

    if not _SCHEDULE_CSV_PATH.exists():
        return

    train_rows: dict[str, list[dict]] = {}
    try:
        with open(_SCHEDULE_CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                tid = (row.get("train_id") or "").strip()
                scode = (row.get("station_code") or "").strip().upper()
                if not tid or not scode:
                    continue
                try:
                    seq = int(row.get("seq_no", 0))
                except (ValueError, TypeError):
                    continue

                arr = (row.get("scheduled_arrival") or "").strip()
                dep = (row.get("scheduled_departure") or "").strip()
                if not arr and not dep:
                    continue

                if tid not in train_rows:
                    train_rows[tid] = []
                train_rows[tid].append({
                    "seq_no": seq,
                    "station_code": scode,
                    "scheduled_arrival": arr,
                    "scheduled_departure": dep,
                    "distance_km": float(row.get("distance_km", 0.0) or 0.0)
                })

        for tid, rows in train_rows.items():
            if not rows:
                continue
            rows.sort(key=lambda x: x["seq_no"])
            first_dep_raw = rows[0]["scheduled_departure"] or rows[0]["scheduled_arrival"]
            first_dep = _parse_time_str(first_dep_raw)
            if not first_dep:
                first_dep = "06:00"

            base_min = _parse_time_to_minutes(first_dep)
            _TRAIN_FIRST_DEP[tid] = first_dep

            station_map = {}
            cum_day_mins = 0
            prev_mins = base_min

            for r in rows:
                arr_str = _parse_time_str(r["scheduled_arrival"]) or first_dep
                dep_str = _parse_time_str(r["scheduled_departure"]) or arr_str
                raw_arr_mins = _parse_time_to_minutes(arr_str)
                raw_dep_mins = _parse_time_to_minutes(dep_str)

                # Day rollover: arrival significantly earlier than previous station
                if raw_arr_mins < prev_mins - 30:
                    cum_day_mins += 1440
                prev_mins = raw_arr_mins

                arr_offset = (cum_day_mins + raw_arr_mins) - base_min
                if arr_offset < 0:
                    arr_offset = 0

                # Rollover within same halt
                if raw_dep_mins < raw_arr_mins:
                    cum_day_mins += 1440
                    raw_dep_mins += 1440
                prev_mins = raw_dep_mins % 1440

                station_map[r["station_code"]] = {
                    "seq_no": r["seq_no"],
                    "scheduled_arrival": arr_str,
                    "scheduled_departure": dep_str,
                    "scheduled_offset_min": arr_offset,
                    "distance_km": r["distance_km"]
                }

            _TRAIN_SCHEDULE_LOOKUP[tid] = station_map
    except Exception as e:
        logger.warning(f"Could not parse {_SCHEDULE_CSV_PATH} for train schedules: {e}")


_build_schedule_indices()


@router.get("/trains/search", response_model=list[TrainSummary])
def search_trains(
    q: str = Query(..., min_length=2, description="Search query — min 2 chars; matches train number, name, origin, destination"),
    limit: int = Query(20, ge=1, le=50, description="Max results (1–50, default 20)"),
):
    """
    Full-network search across all trains.
    Case-insensitive match on train_number (prefix/exact) or name/origin/destination (substring).
    """
    ql = q.strip().lower()
    if len(ql) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters.")

    results = []
    for t in _MOCK_TRAINS.values():
        if (
            ql in t.get("train_number", "").lower()
            or ql in t.get("name", "").lower()
            or ql in (t.get("origin") or "").lower()
            or ql in (t.get("destination") or "").lower()
        ):
            results.append(
                TrainSummary(
                    train_number=t["train_number"],
                    name=t["name"],
                    origin=t["origin"],
                    destination=t["destination"],
                    type=t.get("type"),
                    zone=t.get("zone"),
                    scheduled_departure=t.get("scheduled_departure"),
                    total_distance_km=t.get("total_distance_km"),
                    train_name=t["name"],
                    featured=bool(t.get("featured", False)),
                )
            )
            if len(results) >= limit:
                break
    return results


@router.get("/trains", response_model=list[TrainSummary])
def list_trains(
    featured: bool | None = Query(
        None,
        description="If true (default), return only featured flagship homepage trains. Pass false to return full network.",
    )
):
    """Returns train list (curated featured trains by default)."""
    show_featured_only = featured if featured is not None else True
    return [
        TrainSummary(
            train_number=t["train_number"],
            name=t["name"],
            origin=t["origin"],
            destination=t["destination"],
            type=t.get("type"),
            zone=t.get("zone"),
            scheduled_departure=t.get("scheduled_departure"),
            total_distance_km=t.get("total_distance_km"),
            train_name=t["name"],
            featured=bool(t.get("featured", False)),
        )
        for t in _MOCK_TRAINS.values()
        if bool(t.get("featured", False)) == show_featured_only
    ]


@router.get("/trains/{train_number}/route", response_model=TrainRouteResponse)
@router.get("/train/{train_number}/route", response_model=TrainRouteResponse)
def get_train_route(train_number: str):
    """Returns static station list and GIS coordinates for a train route."""
    clean_num = str(train_number).strip()
    train = _MOCK_TRAINS.get(clean_num)
    if not train:
        raise HTTPException(status_code=404, detail=f"Unknown train {clean_num}")

    real_schedule = _TRAIN_SCHEDULE_LOOKUP.get(clean_num)

    return TrainRouteResponse(
        train_number=train["train_number"],
        name=train["name"],
        stations=[
            Station(
                code=st["code"],
                name=st["name"],
                lat=st["lat"],
                lng=st["lng"],
                scheduled_offset_min=(
                    real_schedule[st["code"].upper()]["scheduled_offset_min"]
                    if real_schedule and st["code"].upper() in real_schedule
                    else st.get("scheduled_offset_min", 0)
                ),
                distance_km=st.get("distance_km", 0.0),
            )
            for st in train["stations"]
        ]
    )


def _compute_base_delay(
    train_number: str,
    stations: list[dict],
    elapsed_min: float,
) -> int:
    """Computes a smoothly-evolving delay estimate for the whole journey."""
    hist = eta._hist_averages or {}
    global_avg = float(hist.get("global_avg", 20.0))
    tid = str(train_number).zfill(5)

    train_avg = float(hist.get("train", {}).get(tid, global_avg))
    hist_base = max(8.0, min(train_avg, 60.0))

    total_min = float(stations[-1].get("scheduled_offset_min", 1000) or 1000)
    phase = (elapsed_min / total_min) * 2.0 * math.pi
    sine_component = hist_base * 0.30 * math.sin(phase)

    real_elapsed = time.time() - _DELAY_SIM_START
    bucket = int(real_elapsed // 240)
    hash_val = hash(f"{train_number}:{bucket}") % 1000
    walk_component = hist_base * 0.25 * (hash_val / 500.0 - 1.0)

    raw = hist_base + sine_component + walk_component
    return max(int(hist_base * 0.3), min(round(raw), int(hist_base * 2.2)))


_perform_live_sync = live_sync.perform_live_sync


@router.post("/trains/{train_number}/live/sync", response_model=LiveSyncResponse)
@router.post("/train/{train_number}/live/sync", response_model=LiveSyncResponse)
def sync_train_live(train_number: str, db: Session = Depends(get_db)):
    """
    Explicit sync endpoint triggered on page load / manual refresh button.
    1. Checks shared DB cache for fresh snapshot within TTL window (shared across all users).
    2. Checks monthly quota guard before calling external RailRadar API.
    3. Degrades gracefully to the simulator on budget exhaustion, network errors, or route mismatches.
    """
    clean_num = str(train_number).strip()
    train = _MOCK_TRAINS.get(clean_num)
    if not train:
        raise HTTPException(status_code=404, detail=f"Unknown train {clean_num}")

    cached = _perform_live_sync(clean_num, train, db)
    return LiveSyncResponse(
        train_number=clean_num,
        lat=cached.lat,
        lng=cached.lng,
        speed_kmh=cached.speed_kmh,
        bearing_degrees=cached.bearing_degrees,
        next_station_code=cached.next_station_code,
        next_station_name=cached.next_station_name,
        distance_to_next_km=cached.distance_to_next_km,
        source=cached.source,
        synced_at=cached.synced_at.isoformat(),
    )


@router.get("/trains/{train_number}/eta", response_model=TrainETAResponse)
@router.get("/train/{train_number}/eta", response_model=TrainETAResponse)
def get_train_eta(train_number: str, db: Session = Depends(get_db)):
    """
    Main endpoint the live tracking page polls every 60 seconds.
    Performs active RailRadar sync check (refreshing if cache > TTL and budget available),
    satisfying position from fresh TrainLiveCache or the simulator.
    """
    clean_num = str(train_number).strip()
    train = _MOCK_TRAINS.get(clean_num)
    if not train:
        raise HTTPException(status_code=404, detail=f"Unknown train {clean_num}")

    stations = train["stations"]
    sim_offset = train.get("sim_start_offset_min", 0)

    # 1. Perform RailRadar sync check (reuses _perform_live_sync)
    cached = _perform_live_sync(clean_num, train, db)

    is_railradar = bool(cached and cached.source == "railradar")
    schedule_source = "railradar" if is_railradar else "local_fallback"
    schedule_fetched_at = cached.synced_at.isoformat() if (is_railradar and cached.synced_at) else None

    if is_railradar and cached:
        position = {
            "lat": cached.lat,
            "lng": cached.lng,
            "speed_kmh": cached.speed_kmh,
            "last_updated": cached.synced_at.strftime("%I:%M:%S %p"),
            "next_station_code": cached.next_station_code or stations[-1]["code"],
            "next_station_name": cached.next_station_name or stations[-1]["name"],
            "distance_to_next_km": cached.distance_to_next_km or 0.0,
            "bearing_degrees": cached.bearing_degrees,
            "synced_at": cached.synced_at.isoformat(),
            "source": "railradar",
        }
        # Approximate current station index & elapsed journey for delay propagation
        _, elapsed_min, current_station_index = live_feed.get_live_position_and_state(
            stations,
            train_number=clean_num,
            start_offset_min=sim_offset,
        )
    else:
        sim_pos, elapsed_min, current_station_index = live_feed.get_live_position_and_state(
            stations,
            train_number=clean_num,
            start_offset_min=sim_offset,
        )
        position = {
            **sim_pos,
            "bearing_degrees": None,
            "synced_at": None,
            "source": "simulated",
        }

    # Ensure the ETA model's historical averages are loaded
    eta._try_load_model()

    # Continuously-evolving delay estimate
    base_delay = _compute_base_delay(clean_num, stations, float(elapsed_min))

    station_etas = []
    railradar_schedule_used = False
    real_first_dep = _TRAIN_FIRST_DEP.get(clean_num) or train.get("scheduled_departure") or "06:00"

    # If RailRadar live data is available with route halts, use it directly!
    if is_railradar and cached and cached.raw_response:
        try:
            raw_payload = json.loads(cached.raw_response)
            route = raw_payload.get("route") or []
            if route:
                origin_h = route[0]
                origin_dt = None
                origin_dep_raw = origin_h.get("scheduledDeparture") or origin_h.get("scheduledArrival")
                if origin_dep_raw:
                    try:
                        origin_dt = datetime.datetime.fromisoformat(str(origin_dep_raw))
                        real_first_dep = origin_dt.strftime("%H:%M")
                    except Exception:
                        pass

                local_stn_map = {
                    str(s.get("code", "")).strip().upper(): s for s in stations if "code" in s
                }

                for idx, h in enumerate(route):
                    code = str(h.get("stationCode", "")).strip().upper()
                    name = h.get("stationName") or code

                    arr_dt = None
                    arr_raw = h.get("scheduledArrival") or h.get("scheduledDeparture")
                    if arr_raw:
                        try:
                            arr_dt = datetime.datetime.fromisoformat(str(arr_raw))
                        except Exception:
                            pass

                    if arr_dt and origin_dt:
                        diff_sec = (arr_dt - origin_dt).total_seconds()
                        sched_offset = max(0, int(diff_sec // 60))
                    else:
                        sched_offset = 0

                    delay = int(h.get("delayArrival") if h.get("delayArrival") is not None else (h.get("delayDeparture") or 0))
                    raw_st = str(h.get("status", "")).lower()
                    if raw_st in ("departed", "reached", "arrived"):
                        st_status = "reached"
                    elif delay > 2:
                        st_status = "delayed"
                    else:
                        st_status = "on_time"

                    local_s = local_stn_map.get(code)
                    if local_s:
                        lat = float(local_s.get("lat") or 0.0)
                        lng = float(local_s.get("lng") or 0.0)
                    else:
                        global_s = railradar_interpolation._GLOBAL_STATION_COORDS.get(code)
                        lat = float(global_s["lat"]) if global_s else 0.0
                        lng = float(global_s["lng"]) if global_s else 0.0

                    dist = float(h.get("distance", 0.0) or (local_s.get("distance_km", 0.0) if local_s else 0.0))

                    pf_raw = str(h.get("platform", "")).replace("PF", "").replace("pf", "").strip()
                    try:
                        pf_num = int(pf_raw)
                    except Exception:
                        pf_num = (idx % 4) + 1

                    station_etas.append(
                        StationETA(
                            code=code,
                            name=name,
                            lat=lat,
                            lng=lng,
                            scheduled_offset_min=sched_offset,
                            distance_km=dist,
                            predicted_delay_min=delay,
                            predicted_offset_min=sched_offset + delay,
                            status=st_status,
                            platform=pf_num,
                            top_delay_factors=eta.get_delay_reasons(code),
                        )
                    )
                railradar_schedule_used = True
        except Exception as e:
            logger.warning(f"Failed to parse RailRadar route halts for {clean_num}: {e}")

    # Fallback to local schedule CSV or mock data if RailRadar schedule was not available
    if not station_etas:
        real_schedule = _TRAIN_SCHEDULE_LOOKUP.get(clean_num)
        real_first_dep = _TRAIN_FIRST_DEP.get(clean_num) or train.get("scheduled_departure") or "06:00"

        for idx, st in enumerate(stations):
            code = (st.get("code") or "").strip().upper()
            if real_schedule and code in real_schedule:
                sched_offset = real_schedule[code]["scheduled_offset_min"]
            else:
                sched_offset = st.get("scheduled_offset_min", 0)

            if idx < current_station_index:
                status = "reached"
                delay = 0 if idx == 0 else max(0, base_delay - (current_station_index - idx) * 2)
            elif idx == current_station_index:
                status = "delayed" if base_delay > 2 else "on_time"
                delay = base_delay
            else:
                delay, _ = eta.predict_delay_minutes(
                    train_number=clean_num,
                    station_code=st["code"],
                    distance_km=st.get("distance_km", 0),
                    current_delay_min=base_delay,
                    total_distance_km=train.get("total_distance_km"),
                )
                status = eta.status_from_delay(delay)

            station_etas.append(
                StationETA(
                    code=st["code"],
                    name=st["name"],
                    lat=st["lat"],
                    lng=st["lng"],
                    scheduled_offset_min=sched_offset,
                    distance_km=st.get("distance_km", 0.0),
                    predicted_delay_min=delay,
                    predicted_offset_min=sched_offset + delay,
                    status=status,
                    platform=(idx % 4) + 1,
                    top_delay_factors=eta.get_delay_reasons(st["code"]),
                )
            )

    schedule_source = "railradar" if railradar_schedule_used else "local_fallback"
    schedule_fetched_at = cached.synced_at.isoformat() if (railradar_schedule_used and cached and cached.synced_at) else None

    return TrainETAResponse(
        train_number=train["train_number"],
        name=train["name"],
        scheduled_departure=real_first_dep,
        schedule_source=schedule_source,
        schedule_fetched_at=schedule_fetched_at,
        current_position=CurrentPosition(**position),
        elapsed_min=elapsed_min,
        stations=station_etas,
        is_mock=False,
    )


@router.get("/trains/{train_number}/eta/{station_code}/reasons", response_model=DelayReasonsResponse)
@router.get("/train/{train_number}/eta/{station_code}/reasons", response_model=DelayReasonsResponse)
def get_station_delay_reasons(train_number: str, station_code: str):
    """Returns root-cause attribution reasons for a delayed station."""
    reasons = eta.get_delay_reasons(station_code.upper())
    return DelayReasonsResponse(reasons=reasons)


@router.get("/model/metrics", response_model=ModelMetrics)
def get_model_metrics():
    """Powers the /about page specification with model validation metrics."""
    return ModelMetrics(**eta.model_metrics())
