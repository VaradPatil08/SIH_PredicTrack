"""
Feature engineering — shared between training and live inference.

CRITICAL RULE: train_model.py and app/services/eta.py must both call
build_features() from THIS file, and nothing else. If training and
inference compute features differently even slightly, the model's
predictions become meaningless (this is one of the most common real
bugs in ML systems, not just a hackathon risk). Never duplicate this
logic anywhere else.

FEATURE SET (v1) — kept deliberately small and explainable:
  distance_km          static, from station data
  route_progress        static, station's position in the journey (0-1)
  hour_of_day            temporal, from scheduled departure time
  day_of_week            temporal, 0=Monday
  is_weekend              temporal, derived from day_of_week
  current_delay_min      dynamic, how delayed the train already is
  station_hist_avg_delay  historical, this station's average delay
                           across the Kaggle dataset (falls back to a
                           global average if the station is unseen)
  train_hist_avg_delay    historical, this train's average delay
                           across the Kaggle dataset (falls back to
                           the station average if the train is unseen)

Extend this list later (e.g. a disruption_flag from news-crawling or
report counts) by adding one function here, calling it from both
train_model.py and eta.py, and retraining — never add a feature to only
one side.
"""

import json
import os
import datetime

FEATURE_NAMES = [
    "distance_km",
    "route_progress",
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "current_delay_min",
    "station_hist_avg_delay",
    "train_hist_avg_delay",
]

_HIST_AVERAGES_PATH = os.path.join(os.path.dirname(__file__), "model", "historical_averages.json")


def load_historical_averages() -> dict:
    """
    Loads per-station and per-train historical average delays, produced
    by train_model.py from the Kaggle dataset. Returns a dict with a
    'global_avg' fallback plus 'station' and 'train' lookup maps.
    Returns a safe all-zero default if the file doesn't exist yet, so
    the app can run before training has happened.
    """
    if not os.path.exists(_HIST_AVERAGES_PATH):
        return {"global_avg": 15.0, "station": {}, "train": {}}
    with open(_HIST_AVERAGES_PATH) as f:
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
) -> list[float]:
    """
    Builds the feature vector in the exact order of FEATURE_NAMES.
    Both train_model.py (for every historical row) and eta.py (for
    every live prediction) call this same function.
    """
    route_progress = (distance_km / total_distance_km) if total_distance_km > 0 else 0.0
    is_weekend = 1.0 if day_of_week >= 5 else 0.0

    station_avg = hist_averages.get("station", {}).get(
        station_code, hist_averages.get("global_avg", 15.0)
    )
    train_avg = hist_averages.get("train", {}).get(
        train_number, station_avg
    )

    return [
        float(distance_km),
        float(route_progress),
        float(scheduled_departure_hour),
        float(day_of_week),
        is_weekend,
        float(current_delay_min),
        float(station_avg),
        float(train_avg),
    ]


def current_time_features() -> tuple[int, int]:
    """Convenience for live inference: (hour_of_day, day_of_week) from now."""
    now = datetime.datetime.utcnow()
    return now.hour, now.weekday()
