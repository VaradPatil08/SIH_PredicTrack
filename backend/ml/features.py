"""
Feature engineering — shared between training and live inference.

CRITICAL RULE: train_model.py and app/services/eta.py must both call
build_features() from THIS file, and nothing else. If training and
inference compute features differently even slightly, the model's
predictions become meaningless. Never duplicate this logic anywhere else.

FEATURE SET (v2 — real railway features):
  distance_km                  static/route, cumulative distance along route (km)
  remaining_distance_km        static/route, distance left to destination (km)
  pct_journey_completed        static/route, journey progress ratio [0.0 - 1.0]
  train_priority               static/heuristic, 3=Top (Vande Bharat/Rajdhani), 2=Superfast, 1=Express, 0=Passenger
  scheduled_halt_duration_min  static/schedule, scheduled halt duration at station (mins)
  current_delay_min            dynamic/live, current delay of the train (mins)
  station_hist_avg_delay       historical, mean historical delay for this station (mins)
  train_hist_avg_delay         historical, mean historical delay for this train (mins)
  hist_delay_lag1              historical/dynamic, delay at previous station along route (mins)
  hist_delay_lag2              historical/dynamic, delay two stations prior along route (mins)
  section_delay_gradient       historical, rate of delay accumulation / recovery over section
  station_congestion_index     historical/stress, station delay congestion stress index
  delay_vs_historical          interaction, (current_delay_min - station_hist_avg_delay)
  hour_sin                     temporal, cyclical sin encoding of departure hour
  hour_cos                     temporal, cyclical cos encoding of departure hour
  dow_sin                      temporal, cyclical sin encoding of day of week
  dow_cos                      temporal, cyclical cos encoding of day of week
  is_foggy                     weather, binary flag (default 0, wired for live sensor stream)
  is_red_signal                signalling, binary flag (default 0, wired for live aspect feed)
"""

import json
import math
import os
import datetime

FEATURE_NAMES = [
    "distance_km",
    "remaining_distance_km",
    "pct_journey_completed",
    "train_priority",
    "scheduled_halt_duration_min",
    "current_delay_min",
    "station_hist_avg_delay",
    "train_hist_avg_delay",
    "hist_delay_lag1",
    "hist_delay_lag2",
    "section_delay_gradient",
    "station_congestion_index",
    "delay_vs_historical",
    "hour_sin",
    "hour_cos",
    "dow_sin",
    "dow_cos",
    "is_foggy",
    "is_red_signal",
]

_HIST_AVERAGES_PATH = os.path.join(os.path.dirname(__file__), "model", "historical_averages.json")


def assign_train_priority(train_id: str, train_name: str = "") -> int:
    """Classifies train priority level based on number pattern and name."""
    tid = str(train_id).strip()
    name = str(train_name).upper()
    if any(p in name for p in ["VANDE BHARAT", "RAJDHANI", "SHATABDI", "DURONTO", "GATIMAAN", "TEJAS"]):
        return 3  # Top priority
    elif tid.startswith(("12", "22", "20")):
        return 2  # Superfast
    elif tid.startswith("1"):
        return 1  # Mail / Express
    else:
        return 0  # Passenger / Special


def load_historical_averages() -> dict:
    """
    Loads per-station and per-train historical statistics and static feature lookup table,
    produced by train_model.py.
    Returns safe default fallbacks if the file does not exist yet.
    """
    if not os.path.exists(_HIST_AVERAGES_PATH):
        return {
            "global_avg": 20.0,
            "global_congestion": 20.0,
            "station": {},
            "train": {},
            "station_congestion": {},
            "station_halt": {},
            "lookup": {},
        }
    with open(_HIST_AVERAGES_PATH, encoding="utf-8") as f:
        return json.load(f)


def build_features(
    train_number: str,
    station_code: str,
    distance_km: float,
    total_distance_km: float,
    current_delay_min: float,
    scheduled_departure_hour: int,
    day_of_week: int,
    hist_averages: dict,
    is_foggy: int = 0,
    is_red_signal: int = 0,
) -> list[float]:
    """
    Builds the feature vector in the exact order of FEATURE_NAMES.
    Both train_model.py (for historical records) and eta.py (for live inference)
    call this function to guarantee training-serving consistency.
    """
    tid = str(train_number).zfill(5)
    stn = str(station_code).upper()

    dist = float(distance_km)
    tot_dist = float(total_distance_km) if total_distance_km and float(total_distance_km) > 0 else dist
    remaining_dist = max(0.0, tot_dist - dist)
    pct_completed = (dist / tot_dist) if tot_dist > 0 else 0.0
    pct_completed = min(max(pct_completed, 0.0), 1.0)

    cur_delay = float(current_delay_min)

    # Safe lookups from precomputed historical tables
    global_avg = float(hist_averages.get("global_avg", 20.0))
    global_congestion = float(hist_averages.get("global_congestion", global_avg))

    stn_avg = float(hist_averages.get("station", {}).get(stn, global_avg))
    trn_avg = float(hist_averages.get("train", {}).get(tid, stn_avg))

    lookup_data = hist_averages.get("lookup", {}).get(f"{tid}_{stn}", {})

    priority = float(lookup_data.get("train_priority", assign_train_priority(tid)))
    halt_duration = float(
        lookup_data.get(
            "scheduled_halt_duration_min",
            hist_averages.get("station_halt", {}).get(stn, 2.0),
        )
    )
    lag1 = float(lookup_data.get("hist_delay_lag1", cur_delay))
    lag2 = float(lookup_data.get("hist_delay_lag2", cur_delay))
    sec_gradient = float(lookup_data.get("section_delay_gradient", 0.0))
    congestion = float(
        lookup_data.get(
            "station_congestion_index",
            hist_averages.get("station_congestion", {}).get(stn, global_congestion),
        )
    )

    delay_vs_hist = cur_delay - stn_avg

    # Cyclical temporal features
    hour = float(scheduled_departure_hour)
    dow = float(day_of_week)
    hour_sin = math.sin(2.0 * math.pi * hour / 24.0)
    hour_cos = math.cos(2.0 * math.pi * hour / 24.0)
    dow_sin = math.sin(2.0 * math.pi * dow / 7.0)
    dow_cos = math.cos(2.0 * math.pi * dow / 7.0)

    # TODO: Live weather and signal aspect feed integration.
    # Currently default to 0.0 (normal visibility, clear aspect) until live telemetry stream is wired.
    fog_flag = float(is_foggy)
    red_signal_flag = float(is_red_signal)

    return [
        dist,
        remaining_dist,
        pct_completed,
        priority,
        halt_duration,
        cur_delay,
        stn_avg,
        trn_avg,
        lag1,
        lag2,
        sec_gradient,
        congestion,
        delay_vs_hist,
        hour_sin,
        hour_cos,
        dow_sin,
        dow_cos,
        fog_flag,
        red_signal_flag,
    ]


def current_time_features() -> tuple[int, int]:
    """Convenience for live inference: (hour_of_day, day_of_week) from current UTC time."""
    now = datetime.datetime.now(datetime.timezone.utc)
    return now.hour, now.weekday()

