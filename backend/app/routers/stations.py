"""
Stations Router — PredicTrack
Derives a station directory and per-station live-board from the
existing mock_trains.json timetable dataset.
All data is computed at startup so responses are instant.
"""

import math
import random
import time
from pathlib import Path
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(tags=["stations"])

# ---------------------------------------------------------------------------
# Load & index timetable once at startup
# ---------------------------------------------------------------------------
_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_trains.json"
with open(_DATA_PATH, encoding="utf-8") as _f:
    _ALL_TRAINS: dict = json.load(_f)

# Build station index: code -> {name, lat, lng, zone, trains: [...]}
_STATION_INDEX: dict[str, dict] = {}

for _train in _ALL_TRAINS.values():
    _zone = _train.get("zone", "Indian Railways")
    for _st in _train.get("stations", []):
        _code = _st.get("code", "").upper()
        if not _code:
            continue
        if _code not in _STATION_INDEX:
            _STATION_INDEX[_code] = {
                "code": _code,
                "name": _st.get("name", _code),
                "lat": _st.get("lat", 0.0),
                "lng": _st.get("lng", 0.0),
                "zone": _zone,
                "trains": [],
            }
        entry = {
            "train_number": _train["train_number"],
            "train_name": _train["name"],
            "scheduled_offset_min": _st.get("scheduled_offset_min", 0),
            "distance_km": _st.get("distance_km", 0),
            "zone": _zone,
        }
        _STATION_INDEX[_code]["trains"].append(entry)

# Sort trains within each station by scheduled_offset_min
for _s in _STATION_INDEX.values():
    _s["trains"].sort(key=lambda t: t["scheduled_offset_min"])

# Featured / major junction station codes (well-known hubs)
_FEATURED_CODES = {
    "NDLS", "MMCT", "HWH", "MAS", "BCT", "ADI", "BBS", "LTT",
    "BSB", "PUNE", "BPL", "NGP", "SC", "SBC", "CBE", "TVC",
    "VSKP", "GHY", "DDN", "JAT", "CNB", "PNBE", "MGS", "DDU",
    "GKP", "ASR", "JP", "KOTA", "AGC", "BVI"
}

def _category(code: str, train_count: int) -> str:
    if code in _FEATURED_CODES or train_count >= 40:
        return "A1 Category"
    if train_count >= 15:
        return "A Category"
    if train_count >= 5:
        return "B Category"
    return "C Category"


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class StationSummary(BaseModel):
    code: str
    name: str
    lat: float
    lng: float
    zone: str
    category: str
    platforms: int
    trains_today: int
    featured: bool
    next_arrival_time: str
    avg_delay_min: int


class ArrivalRow(BaseModel):
    train_number: str
    train_name: str
    origin: str
    destination: str
    scheduled_time: str          # "HH:MM"
    predicted_time: str          # "HH:MM" with delay
    delay_min: int
    status: str                  # "on_time" | "delayed" | "critical"
    platform: int
    zone: str
    top_delay_factors: list[str]


class StationLiveBoard(BaseModel):
    code: str
    name: str
    zone: str
    category: str
    platforms: int
    trains_today: int
    lat: float
    lng: float
    avg_delay_min: int
    arrivals: list[ArrivalRow]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _offset_to_hhmm(offset_min: int, base: str = "06:00") -> str:
    """Convert scheduled offset minutes from midnight/base to HH:MM."""
    total = offset_min % (24 * 60)
    h, m = divmod(total, 60)
    return f"{h:02d}:{m:02d}"


_DELAY_REASONS = [
    "Section speed restriction due to track maintenance work ahead",
    "Preceding express train clearance delay at junction signals",
    "Automatic block signalling clearance hold",
    "Freight train precedence at crossing loop",
    "Platform occupancy — outgoing train yet to depart",
    "TSR imposed after recent track inspection",
    "Fog-reduced speed zone in effect",
    "Crew change formalities at division boundary",
    "OHE defect reported in adjacent section",
    "Water filling extended due to high passenger demand",
]

_SIM_START = time.time()


def _live_delay(train_number: str, station_code: str, scheduled_offset_min: int) -> int:
    """Deterministic but evolving delay simulation."""
    seed_val = abs(hash(train_number + station_code)) % 1000
    elapsed = (time.time() - _SIM_START) / 60  # minutes since server start
    base = (seed_val % 18) + 2                  # 2–20 base delay
    drift = math.sin(elapsed / 40 + seed_val * 0.01) * 6
    noise = random.Random(int(elapsed / 5) + seed_val).uniform(-2, 2)
    delay = max(0, round(base + drift + noise))
    return delay


def _status(delay_min: int) -> str:
    if delay_min <= 2:
        return "on_time"
    if delay_min <= 20:
        return "delayed"
    return "critical"


def _random_reasons(n: int = 2) -> list[str]:
    return random.sample(_DELAY_REASONS, min(n, len(_DELAY_REASONS)))


def _next_arrival_and_avg_delay(trains: list[dict], code: str) -> tuple[str, int]:
    if not trains:
        return ("--:--", 0)
    first_offset = trains[0]["scheduled_offset_min"]
    next_arrival = _offset_to_hhmm(first_offset)
    sample_delays = [_live_delay(t["train_number"], code, t["scheduled_offset_min"]) for t in trains[:10]]
    avg_d = round(sum(sample_delays) / max(1, len(sample_delays)))
    return (next_arrival, avg_d)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/stations", response_model=list[StationSummary])
def list_stations(
    featured: Optional[bool] = Query(None, description="Filter to major junction stations only"),
    q: Optional[str] = Query(None, min_length=2, description="Search by station code or name"),
    limit: int = Query(60, ge=1, le=200),
):
    """
    Station directory — returns station summaries derived from the timetable.
    - **featured=true** -> major junctions for the default grid.
    - **q=<text>** -> full-network search (code or name substring).
    - Default -> sorted by featured status & train volume.
    """
    results = []
    for code, s in _STATION_INDEX.items():
        tc = len(s["trains"])
        is_featured = code in _FEATURED_CODES

        if featured is True and not is_featured:
            continue
        if featured is False and is_featured:
            continue
        if q:
            ql = q.strip().lower()
            if ql not in code.lower() and ql not in s["name"].lower():
                continue

        next_arr, avg_d = _next_arrival_and_avg_delay(s["trains"], code)
        platforms = max(2, min(24, tc // 8 + 2))

        results.append(StationSummary(
            code=code,
            name=s["name"],
            lat=s["lat"],
            lng=s["lng"],
            zone=s["zone"],
            category=_category(code, tc),
            platforms=platforms,
            trains_today=tc,
            featured=is_featured,
            next_arrival_time=next_arr,
            avg_delay_min=avg_d,
        ))

    results.sort(key=lambda r: (-int(r.featured), -r.trains_today))
    return results[:limit]


@router.get("/stations/search", response_model=list[StationSummary])
def search_stations(
    q: str = Query(..., min_length=2),
    limit: int = Query(30, ge=1, le=100),
):
    """Full-network station search — code or name substring, case-insensitive."""
    ql = q.strip().lower()
    out = []
    for code, s in _STATION_INDEX.items():
        if ql in code.lower() or ql in s["name"].lower():
            tc = len(s["trains"])
            next_arr, avg_d = _next_arrival_and_avg_delay(s["trains"], code)
            out.append(StationSummary(
                code=code,
                name=s["name"],
                lat=s["lat"],
                lng=s["lng"],
                zone=s["zone"],
                category=_category(code, tc),
                platforms=max(2, min(24, tc // 8 + 2)),
                trains_today=tc,
                featured=code in _FEATURED_CODES,
                next_arrival_time=next_arr,
                avg_delay_min=avg_d,
            ))
    out.sort(key=lambda r: (-int(r.featured), -r.trains_today))
    return out[:limit]


@router.get("/stations/{station_code}", response_model=StationLiveBoard)
def get_station_live_board(station_code: str):
    """
    Live arrivals/departures board for a single station.
    Returns all trains calling at this station with dynamic live delay predictions.
    """
    code = station_code.upper()
    s = _STATION_INDEX.get(code)
    if not s:
        raise HTTPException(status_code=404, detail=f"Station '{code}' not found in timetable.")

    tc = len(s["trains"])
    arrivals: list[ArrivalRow] = []

    for i, t_entry in enumerate(s["trains"][:80]):
        tn = t_entry["train_number"]
        train = _ALL_TRAINS.get(tn, {})

        origin = train.get("origin", "")
        dest = train.get("destination", "")
        zone = t_entry["zone"]

        sched_offset = t_entry["scheduled_offset_min"]
        delay = _live_delay(tn, code, sched_offset)
        status = _status(delay)

        sched_str = _offset_to_hhmm(sched_offset)
        pred_str = _offset_to_hhmm(sched_offset + delay)
        platform = (i % max(1, min(24, tc // 8 + 2))) + 1

        arrivals.append(ArrivalRow(
            train_number=tn,
            train_name=t_entry["train_name"],
            origin=origin,
            destination=dest,
            scheduled_time=sched_str,
            predicted_time=pred_str,
            delay_min=delay,
            status=status,
            platform=platform,
            zone=zone,
            top_delay_factors=_random_reasons(2) if delay > 2 else [],
        ))

    arrivals.sort(key=lambda a: a.scheduled_time)

    sample_delays = [a.delay_min for a in arrivals]
    avg_d = round(sum(sample_delays) / max(1, len(sample_delays))) if sample_delays else 0

    return StationLiveBoard(
        code=code,
        name=s["name"],
        zone=s["zone"],
        category=_category(code, tc),
        platforms=max(2, min(24, tc // 8 + 2)),
        trains_today=tc,
        lat=s["lat"],
        lng=s["lng"],
        avg_delay_min=avg_d,
        arrivals=arrivals,
    )
