import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# Global station coordinates cache built from mock_trains.json
_GLOBAL_STATION_COORDS: Dict[str, Dict[str, Any]] = {}
try:
    _MOCK_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_trains.json"
    if _MOCK_PATH.exists():
        with open(_MOCK_PATH, encoding="utf-8") as f:
            _raw_trains = json.load(f)
            for _t in _raw_trains.values():
                for _s in _t.get("stations", []):
                    _code = str(_s.get("code", "")).strip().upper()
                    if _code and _code not in _GLOBAL_STATION_COORDS and "lat" in _s and "lng" in _s:
                        _GLOBAL_STATION_COORDS[_code] = {
                            "code": _code,
                            "name": _s.get("name") or _code,
                            "lat": float(_s["lat"]),
                            "lng": float(_s["lng"]),
                            "distance_km": float(_s.get("distance_km", 0.0) or 0.0),
                        }
except Exception as e:
    logger.warning(f"Could not load global station coordinates for RailRadar interpolation: {e}")


def _lookup_station(code: str, local_map: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not code:
        return None
    clean = code.strip().upper()
    return local_map.get(clean) or _GLOBAL_STATION_COORDS.get(clean)


def interpolate_railradar_position(
    data: Dict[str, Any],
    stations: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """
    Interpolates ground-truth lat/lng, speed, bearing, and distance to next halt
    from a RailRadar live data snapshot.

    Returns dict on success or None if stations cannot be resolved against the route.
    """
    if not data:
        return None

    # Station lookup map keyed by uppercase station code
    stn_map: Dict[str, Dict[str, Any]] = {
        str(st["code"]).strip().upper(): st for st in stations if "code" in st
    }

    current_loc = data.get("currentLocation") or {}
    prev_halt = data.get("previousHalt") or {}
    next_halt = data.get("nextHalt") or {}

    prev_code = str(prev_halt.get("stationCode", "")).strip().upper()
    next_code = str(next_halt.get("stationCode", "")).strip().upper()
    current_code = str(current_loc.get("stationCode", "")).strip().upper()

    status = str(current_loc.get("status", "")).strip().lower()
    speed_kmh = float(current_loc.get("speedKmh") or 0.0)
    bearing = current_loc.get("bearingDegrees")
    bearing_degrees = float(bearing) if bearing is not None else None

    # 1. Halted at a station (status == 'arrived', 'halted', 'halt') or terminal halt
    if status in ("arrived", "halted", "halt", "reached"):
        target_code = current_code or next_code or prev_code
        stn = _lookup_station(target_code, stn_map)
        if stn:
            return {
                "lat": round(float(stn["lat"]), 4),
                "lng": round(float(stn["lng"]), 4),
                "speed_kmh": 0.0,
                "bearing_degrees": bearing_degrees,
                "next_station_code": stn.get("code") or target_code,
                "next_station_name": stn.get("name") or target_code,
                "distance_to_next_km": 0.0,
                "source": "railradar",
            }

    # 2. Mid-segment / Departed train: resolve previous and next halt
    prev_stn = _lookup_station(prev_code, stn_map)
    next_stn = _lookup_station(next_code, stn_map)

    # Fallback to current station if both prev and next are not resolvable
    if not prev_stn and not next_stn:
        curr_stn = _lookup_station(current_code, stn_map)
        if curr_stn:
            return {
                "lat": round(float(curr_stn["lat"]), 4),
                "lng": round(float(curr_stn["lng"]), 4),
                "speed_kmh": speed_kmh,
                "bearing_degrees": bearing_degrees,
                "next_station_code": curr_stn.get("code") or current_code,
                "next_station_name": curr_stn.get("name") or current_code,
                "distance_to_next_km": 0.0,
                "source": "railradar",
            }
        return None

    if prev_stn and not next_stn:
        next_stn = prev_stn
    elif next_stn and not prev_stn:
        prev_stn = next_stn

    # Progress between stations: 0.0 to 1.0 (clamped)
    raw_progress = current_loc.get("segmentProgress")
    if raw_progress is None:
        progress = 0.5
    else:
        try:
            progress = max(0.0, min(1.0, float(raw_progress)))
        except (ValueError, TypeError):
            progress = 0.5

    # Linear interpolation of GPS coordinates between ground-truth stations
    lat = prev_stn["lat"] + (next_stn["lat"] - prev_stn["lat"]) * progress
    lng = prev_stn["lng"] + (next_stn["lng"] - prev_stn["lng"]) * progress

    # Compute distance to next station
    prev_dist = float(prev_stn.get("distance_km", 0.0))
    next_dist = float(next_stn.get("distance_km", 0.0))
    segment_distance = abs(next_dist - prev_dist)
    if segment_distance > 0:
        traveled = segment_distance * progress
        distance_to_next = max(0.0, round(segment_distance - traveled, 1))
    else:
        distance_to_next = 0.0

    return {
        "lat": round(float(lat), 4),
        "lng": round(float(lng), 4),
        "speed_kmh": round(speed_kmh, 1),
        "bearing_degrees": bearing_degrees,
        "next_station_code": next_stn["code"],
        "next_station_name": next_stn["name"],
        "distance_to_next_km": distance_to_next,
        "source": "railradar",
    }

