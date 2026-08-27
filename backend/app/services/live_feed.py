"""
Simulated live-feed service for train position interpolation.

Interpolates a train's lat/lng smoothly between current and next station
based on elapsed journey time, mirroring the frontend's generateSyntheticETA()
algorithm for consistent offline/online behavior.
"""

import math
import time
from datetime import datetime

# Start time anchor for simulation progression
_SIM_START = time.time()
SECONDS_PER_SIM_MINUTE = 2
_DEFAULT_SIM_ELAPSED = 310


def get_live_position_and_state(
    stations: list[dict], 
    base_elapsed_min: int = _DEFAULT_SIM_ELAPSED
) -> tuple[dict, int, int]:
    """
    Computes smooth interpolated GPS coordinates, velocity, and segment metrics.
    Returns: (current_position_dict, effective_elapsed_min, current_station_index)
    """
    if not stations:
        return {
            "lat": 28.6415,
            "lng": 77.2209,
            "speed_kmh": 0,
            "last_updated": datetime.now().strftime("%I:%M:%S %p"),
            "next_station_code": "NDLS",
            "next_station_name": "New Delhi",
            "distance_to_next_km": 0,
        }, 0, 0

    sim_tick = int(time.time() - _SIM_START)
    total_journey_min = stations[-1].get("scheduled_offset_min", 1000)

    # Adapt base elapsed time if the route is shorter than the default 310 min
    if base_elapsed_min >= total_journey_min:
        effective_base = int(total_journey_min * 0.45)
    else:
        effective_base = base_elapsed_min

    # Progress elapsed time realistically as ticks advance
    effective_elapsed = effective_base + (sim_tick // SECONDS_PER_SIM_MINUTE) * 2
    if effective_elapsed > total_journey_min:
        effective_elapsed = (effective_elapsed % total_journey_min)

    # Determine current station index based on scheduled offset minutes
    current_station_index = 0
    for i, st in enumerate(stations):
        if st.get("scheduled_offset_min", 0) <= effective_elapsed:
            current_station_index = i
        else:
            break

    cur_stn = stations[current_station_index]
    next_index = min(current_station_index + 1, len(stations) - 1)
    next_stn = stations[next_index]

    if current_station_index < len(stations) - 1:
        segment_duration = max(1, next_stn.get("scheduled_offset_min", 0) - cur_stn.get("scheduled_offset_min", 0))
        progress_in_segment = min(0.95, max(0.05, (effective_elapsed - cur_stn.get("scheduled_offset_min", 0)) / segment_duration))
        
        current_lat = cur_stn["lat"] + (next_stn["lat"] - cur_stn["lat"]) * progress_in_segment
        current_lng = cur_stn["lng"] + (next_stn["lng"] - cur_stn["lng"]) * progress_in_segment
        current_speed = int(95 + math.sin(sim_tick * 0.5) * 18)
        
        cur_dist = cur_stn.get("distance_km", 0)
        next_dist = next_stn.get("distance_km", 0)
        traveled_in_seg = (next_dist - cur_dist) * progress_in_segment
        distance_to_next = max(4, round(next_dist - (cur_dist + traveled_in_seg)))
    else:
        current_lat = cur_stn["lat"]
        current_lng = cur_stn["lng"]
        current_speed = 0
        distance_to_next = 0

    position = {
        "lat": round(current_lat, 4),
        "lng": round(current_lng, 4),
        "speed_kmh": current_speed,
        "last_updated": datetime.now().strftime("%I:%M:%S %p"),
        "next_station_code": next_stn["code"],
        "next_station_name": next_stn["name"],
        "distance_to_next_km": distance_to_next,
    }

    return position, effective_elapsed, current_station_index
