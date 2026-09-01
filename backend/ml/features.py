"""
Feature engineering — shared between training and live inference.

CRITICAL RULE: train_model.py and app/services/eta.py must both call
build_features() from THIS file, and nothing else. If training and
inference compute features differently even slightly, the model's
predictions become meaningless. Never duplicate this logic anywhere else.

FEATURE SET (v4 — 21 real railway features):
  --- Existing route / journey features (v3, unchanged) ---
  distance_km                  static/route, cumulative distance along route (km)
  remaining_distance_km        static/route, distance left to destination (km)
  pct_journey_completed        static/route, journey progress ratio [0.0 - 1.0]
  train_priority               static/heuristic, 3=Top (Vande Bharat/Rajdhani), 2=Superfast, 1=Express, 0=Passenger
  scheduled_halt_duration_min  static/schedule, scheduled halt duration at station (mins)
  current_delay_min            dynamic/live, current delay of the train (mins) — key live dynamic input
  station_hist_avg_delay       historical, mean historical delay for this station (mins)
  train_hist_avg_delay         historical, mean historical delay for this train (mins)
  hist_delay_lag1              historical/dynamic, delay at previous station along route (mins)
  hist_delay_lag2              historical/dynamic, delay two stations prior along route (mins)
  section_delay_gradient       historical, rate of delay accumulation / recovery over section
                               (= avg_delay_at_i - lag1, i.e. delay velocity in delay-minutes/station)
  station_congestion_index     historical/stress, station delay congestion stress index
  delay_vs_historical          interaction, (current_delay_min - station_hist_avg_delay)
  hour_sin                     temporal, cyclical sin encoding of departure hour
  hour_cos                     temporal, cyclical cos encoding of departure hour

  --- NEW: Physics-informed kinematics features (v4) ---
  segment_distance_km          static/route, distance from this station to the NEXT station (km)
                               NOTE: different from remaining_distance_km (to destination).
                               Derived from the route lookup table — next_cumulative_km - curr_cumulative_km.
  segment_scheduled_time_min   static/schedule, scheduled running time for this segment (min)
                               Derived as next_station_arr_min − curr_station_dep_min, midnight-safe.
  kinematic_min_segment_time_min static/physics, physically minimum feasible time (min) for
                               segment_distance_km under a trapezoidal velocity profile:
                               accelerate to v_max → cruise → decelerate. Computed once offline
                               (stored in lookup) from PRIORITY_KINEMATICS constants below.
                               When kinematic_min ≈ scheduled_time, the train has no physical
                               margin to run faster than schedule, so delay recovery is impossible.
  schedule_slack_ratio         static/derived, kinematic_min_segment_time_min / segment_scheduled_time_min
                               [0.0–1.0+ range]. Near or above 1.0 → schedule is physically tight,
                               delay cannot be recovered on this segment. This is a genuinely new
                               predictive signal not captured by distance_km or remaining_distance_km.
  delay_acceleration           historical/dynamic, second finite difference of the delay series
                               (= section_delay_gradient − (lag1 − lag2) = change-in-delay-velocity
                               across the last 3 stations). Positive → delay is worsening at an
                               accelerating rate; negative → delay is improving. Extends the
                               existing section_delay_gradient (delay velocity) feature.
  kinematic_extrapolated_delay dynamic/derived, kinematic extrapolation of current delay into the
                               segment: current_delay + section_delay_gradient·(Δt/60) +
                               0.5·delay_acceleration·(Δt/60)², where Δt = segment_scheduled_time_min.
                               This is a physics-inspired prior: given the delay "trajectory"
                               (velocity + acceleration) at this station, what delay should we
                               expect to arrive at the next station? The model learns the residual
                               from this prior, effectively correcting for missed route/congestion
                               effects that the kinematic formula cannot know.

TRAPEZOIDAL VELOCITY PROFILE — PHYSICAL ASSUMPTIONS (v4):
  Indian Railways stop-to-stop motion is modelled as: accelerate from rest to v_max,
  cruise, then decelerate to rest. Given segment distance d (km) and max speed v_max (km/h),
  acceleration/deceleration a (km/h²):

    d_accel = v_max² / (2·a)      distance to reach v_max from rest
    If d ≥ d_accel + d_decel:     full trapezoidal profile
      t_min = v_max/a + (d - d_accel - d_decel)/v_max + v_max/a
    Else (short segment, triangle profile):
      v_peak = √(2·d·a·b / (a+b))
      t_min = v_peak/a + v_peak/b

  Priority-class constants (symmetric accel/decel, i.e. a = b):
    Priority 3 (Vande Bharat / Rajdhani / Shatabdi):
      v_max = 160 km/h, a = 2400 km/h²  (≈ 0→160 km/h in 4 minutes)
    Priority 2 (Superfast, starts with 12/22/20):
      v_max = 130 km/h, a = 1800 km/h²  (≈ 0→130 km/h in 4.3 minutes)
    Priority 1 (Express / Mail, starts with 1):
      v_max = 110 km/h, a = 1200 km/h²  (≈ 0→110 km/h in 5.5 minutes)
    Priority 0 (Passenger / Special):
      v_max =  75 km/h, a =  750 km/h²  (≈ 0→ 75 km/h in 6 minutes)

  These are conservative mid-range values for electric multiple units and diesel
  locomotive-hauled rakes respectively. They produce physically sensible minimum
  times: e.g. a 45 km Priority-1 segment has t_min ≈ 30 min vs typical 45 min
  schedule (slack ratio ≈ 0.67), while a tight 10 km Priority-3 segment at 160 km/h
  has t_min ≈ 7 min vs a 9 min schedule (slack ratio ≈ 0.77).

REMOVED FEATURES (v2 → v3, still removed in v4):
  dow_sin / dow_cos    — always constant (day_of_week=2 hardcoded in training) → 0.0 feature
                         importance. Removed rather than faked. Re-add when per-run
                         weekday-labelled data is available.
  is_foggy             — no live weather feed; always 0 in both training and inference → 0.0
                         importance. Placeholder kept in build_features() signature for
                         future live integration. See TODO below.
  is_red_signal        — no live signal-aspect feed; always 0 → 0.0 importance. Same treatment.
"""

import datetime
import json
import math
import os

# 21 features — must match the order returned by build_features() exactly.
FEATURE_NAMES = [
    # --- v3 route / journey features ---
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
    # --- v4 physics-informed kinematics features ---
    "segment_distance_km",
    "segment_scheduled_time_min",
    "kinematic_min_segment_time_min",
    "schedule_slack_ratio",
    "delay_acceleration",
    "kinematic_extrapolated_delay",
]

_HIST_AVERAGES_PATH = os.path.join(os.path.dirname(__file__), "model", "historical_averages.json")

# Trapezoidal velocity profile constants per train priority class.
# Keys: priority int (0–3). Values: (v_max_kmh, a_kmh2, b_kmh2) where
# a = acceleration, b = deceleration, both in km/h² (symmetric here).
# See module docstring for derivation and physical basis.
PRIORITY_KINEMATICS = {
    3: (160.0, 2400.0, 2400.0),   # Vande Bharat / Rajdhani / Shatabdi
    2: (130.0, 1800.0, 1800.0),   # Superfast
    1: (110.0, 1200.0, 1200.0),   # Express / Mail
    0: (75.0,   750.0,  750.0),   # Passenger / Special
}

# Safe fallback kinematics for priority values outside [0,3]
_DEFAULT_KINEMATICS = (110.0, 1200.0, 1200.0)  # same as priority 1


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


def trapezoid_min_time_minutes(dist_km: float, v_max_kmh: float, a_kmh2: float, b_kmh2: float) -> float:
    """
    Minimum feasible travel time (minutes) for a stop-to-stop segment of length dist_km
    under a trapezoidal velocity profile.

    Physics:
      accelerate from 0 to min(v_max, v_peak) at rate a_kmh2 (km/h²),
      cruise at v_max (if distance permits),
      decelerate at rate b_kmh2 to stop.

    All inputs in km and km/h²; output in minutes.
    """
    if dist_km <= 0.0:
        return 0.0

    d = float(dist_km)
    v = float(v_max_kmh)
    a = float(a_kmh2)
    b = float(b_kmh2)

    # Distance required to accelerate to v_max then decelerate (full trapezoidal)
    d_accel = v * v / (2.0 * a)
    d_decel = v * v / (2.0 * b)
    d_full = d_accel + d_decel

    if d >= d_full:
        # Full trapezoidal: reach v_max and cruise
        t_accel = v / a          # hours
        t_decel = v / b          # hours
        t_cruise = (d - d_full) / v  # hours
        return (t_accel + t_cruise + t_decel) * 60.0
    else:
        # Triangular: segment too short to reach v_max
        # v_peak = sqrt(2 * d / (1/a + 1/b))
        v_peak = math.sqrt(2.0 * d / (1.0 / a + 1.0 / b))
        return (v_peak / a + v_peak / b) * 60.0


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
    day_of_week: int,        # Kept in signature for caller backward-compat; not used in vector (see module docstring)
    hist_averages: dict,
    is_foggy: int = 0,       # TODO: wire to live weather API when available — kept out of vector until then
    is_red_signal: int = 0,  # TODO: wire to live signal-aspect feed when available — kept out of vector until then
) -> list[float]:
    """
    Builds the 21-element feature vector in the exact order of FEATURE_NAMES.

    Both train_model.py (for historical records) and eta.py (for live inference)
    call this function to guarantee training-serving consistency.

    NOTE: day_of_week, is_foggy, is_red_signal are accepted but NOT placed in the
    returned vector. They had 0.0 feature importance in v2 because day_of_week was
    always hardcoded to 2 and the weather/signal flags were always 0. Keeping them
    in the signature allows callers to remain unchanged when live feeds are wired.

    v4 ADDITIONS (kinematics):
    The six new features (segment_distance_km … kinematic_extrapolated_delay) are
    read from the pre-computed lookup table in hist_averages['lookup']['{tid}_{stn}'].
    They are computed ONCE offline in train_model.py's
    compute_historical_averages_and_lookup() and stored there, so this function
    never recomputes the trapezoidal formula at inference time. For any (train, station)
    pair not seen during training, safe fallback constants are used (see below).
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

    # Key interaction feature: how does current delay compare to the historical norm at this station?
    delay_vs_hist = cur_delay - stn_avg

    # Cyclical hour encoding — captures time-of-day pattern (peak/off-peak hours)
    hour = float(scheduled_departure_hour)
    hour_sin = math.sin(2.0 * math.pi * hour / 24.0)
    hour_cos = math.cos(2.0 * math.pi * hour / 24.0)

    # NOTE: dow_sin/dow_cos removed (v3). is_foggy/is_red_signal removed (v3).
    # See module docstring for rationale and re-addition path.

    # --- v4: Physics-informed kinematics features ---
    # These are stored in the lookup table (computed offline in train_model.py).
    # Fallbacks are used for any (train, station) pair not seen during training.

    # segment_distance_km: distance to the NEXT station along this train's route.
    # Fallback: 50 km (approximate median for Indian long-haul inter-station gaps).
    seg_dist = float(lookup_data.get("segment_distance_km", 50.0))

    # segment_scheduled_time_min: scheduled running time for the next segment.
    # Fallback: 60 min (conservative).
    seg_sched_time = float(lookup_data.get("segment_scheduled_time_min", 60.0))
    seg_sched_time = max(seg_sched_time, 1.0)  # guard against zero division

    # kinematic_min_segment_time_min: pre-computed trapezoidal minimum (stored in lookup).
    # Fallback: compute it on-the-fly from the priority and fallback segment distance.
    if "kinematic_min_segment_time_min" in lookup_data:
        kin_min_time = float(lookup_data["kinematic_min_segment_time_min"])
    else:
        prio_int = int(round(priority))
        prio_int = max(0, min(3, prio_int))
        v_max, a, b = PRIORITY_KINEMATICS.get(prio_int, _DEFAULT_KINEMATICS)
        kin_min_time = trapezoid_min_time_minutes(seg_dist, v_max, a, b)

    # schedule_slack_ratio: near/above 1.0 → schedule is physically tight, no recovery margin.
    # Capped at 2.0 to limit leverage of extreme outlier segments (very slow schedules).
    slack_ratio = min(kin_min_time / seg_sched_time, 2.0)

    # delay_acceleration: second finite difference of the delay series.
    # section_delay_gradient ≈ delay velocity (delay change from lag2 → lag1 → current).
    # delay_acceleration ≈ (sec_gradient) − (lag1 − lag2)
    # = rate-of-change of the delay velocity across the last ~3 stations.
    delay_accel = sec_gradient - (lag1 - lag2)

    # kinematic_extrapolated_delay: physics-inspired prior for next-station delay.
    # Evaluated at a discrete 1-station forward prediction step (Δn = 1.0 station hop):
    # x(n + 1) = x(n) + x'(n)·Δn + 0.5·x''(n)·(Δn)²
    # where x' is section_delay_gradient (delay velocity) and x'' is delay_acceleration
    kin_extrap = cur_delay + sec_gradient * 1.0 + 0.5 * delay_accel * 1.0
    kin_extrap = max(0.0, kin_extrap)  # delay cannot be negative

    return [
        # --- v3 features (unchanged) ---
        dist,            # distance_km
        remaining_dist,  # remaining_distance_km
        pct_completed,   # pct_journey_completed
        priority,        # train_priority
        halt_duration,   # scheduled_halt_duration_min
        cur_delay,       # current_delay_min  ← key live dynamic input, must be dynamic not hardcoded
        stn_avg,         # station_hist_avg_delay
        trn_avg,         # train_hist_avg_delay
        lag1,            # hist_delay_lag1
        lag2,            # hist_delay_lag2
        sec_gradient,    # section_delay_gradient
        congestion,      # station_congestion_index
        delay_vs_hist,   # delay_vs_historical
        hour_sin,        # hour_sin
        hour_cos,        # hour_cos
        # --- v4 kinematics features ---
        seg_dist,        # segment_distance_km
        seg_sched_time,  # segment_scheduled_time_min
        kin_min_time,    # kinematic_min_segment_time_min
        slack_ratio,     # schedule_slack_ratio
        delay_accel,     # delay_acceleration
        kin_extrap,      # kinematic_extrapolated_delay
    ]


def current_time_features() -> tuple[int, int]:
    """Convenience for live inference: (hour_of_day, day_of_week) from current local time."""
    now = datetime.datetime.now(datetime.timezone.utc)
    return now.hour, now.weekday()
