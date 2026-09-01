"""
ETA prediction and delay diagnostic attribution service.

Loads the trained model from ml/model/delay_model.pkl if it exists.
If it doesn't exist yet (ML leads haven't trained it), falls back to
the original placeholder formula automatically — the app never
crashes or breaks the demo because a model file is missing, it just
runs on synthetic predictions until a real one is dropped in.

To go live: run ml/train_model.py once against the Kaggle dataset,
restart the server. Nothing else needs to change.
"""

import json
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml"))

_ML_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml")
_MODEL_PATH = os.path.join(_ML_DIR, "model", "delay_model.pkl")
_METRICS_PATH = os.path.join(_ML_DIR, "model", "metrics.json")

_model = None
_model_load_attempted = False
_hist_averages = None


def _try_load_model():
    """Loads the trained model once, on first use. Safe if the file is missing."""
    global _model, _model_load_attempted, _hist_averages
    if _model_load_attempted:
        return
    _model_load_attempted = True

    if os.path.exists(_MODEL_PATH):
        try:
            import joblib
            from features import load_historical_averages
            _model = joblib.load(_MODEL_PATH)
            _hist_averages = load_historical_averages()
            print(f"[eta.py] Loaded trained model from {_MODEL_PATH}")
        except Exception as e:
            print(f"[eta.py] Found model file but failed to load it ({e}). Falling back to placeholder.")
            _model = None
    else:
        print(f"[eta.py] No trained model found at {_MODEL_PATH}. Using placeholder formula until ML leads train one.")


def predict_delay_minutes(
    train_number: str,
    station_code: str,
    distance_km: float,
    current_delay_min: int = 18,
    total_distance_km: float = None,
    fog_severity: int = 0,
    freight_precedence: bool = False,
    tsr_speed_limit: bool = False,
    platform_hold: bool = False,
) -> tuple[int, list[str]]:
    """
    Returns (predicted_delay_minutes, top_delay_factors).

    Uses the real trained model if ml/model/delay_model.pkl exists,
    otherwise falls back to the original placeholder formula. The
    function signature is backward compatible — total_distance_km is
    optional so existing call sites don't break; when omitted, the
    real-model path falls back to the placeholder for that call since
    it needs total_distance_km to compute route_progress correctly.
    """
    _try_load_model()

    scenario_delay_offset = (
        max(0, min(int(fog_severity), 30))
        + (12 if freight_precedence else 0)
        + (8 if tsr_speed_limit else 0)
        + (6 if platform_hold else 0)
    )
    scenario_current_delay = max(0, int(current_delay_min)) + scenario_delay_offset

    if _model is not None and total_distance_km:
        from features import build_features, current_time_features
        hour, dow = current_time_features()
        features = build_features(
            train_number=train_number,
            station_code=station_code,
            distance_km=distance_km,
            total_distance_km=total_distance_km,
            # The trained v2/v4 model has no scenario-specific columns. Feeding the
            # scenario-adjusted current delay preserves the trained feature vector shape
            # while making the disruption part of the actual model inference path.
            current_delay_min=scenario_current_delay,
            scheduled_departure_hour=hour,
            day_of_week=dow,
            hist_averages=_hist_averages or {},
        )
        predicted = max(0, round(float(_model.predict([features])[0])))
    else:
        base = scenario_current_delay * 0.85
        distance_factor = distance_km / 450
        noise = random.uniform(-1, 3)
        predicted = max(0, round(base + distance_factor + noise))

    factors = get_delay_reasons(
        station_code=station_code,
        predicted_delay=predicted,
        current_delay=scenario_current_delay,
        train_number=train_number,
        fog_severity=fog_severity,
        freight_precedence=freight_precedence,
        tsr_speed_limit=tsr_speed_limit,
        platform_hold=platform_hold,
    )
    return predicted, factors


STATION_INFRA_CONTEXT = {
    # Structural context only: rendering stays feature-driven in get_delay_reasons().
    'BVI': ('HEADWAY_PRESSURE', {'corridor': 'suburban commuter peak section'}),
    'ST': ('FREIGHT_PRECEDENCE', {'yard': 'Sachin yard'}),
    'BRC': ('SIGNAL_INTERLOCKING', {'junction': 'Makarpura'}),
    'RTM': ('CREW_CHANGEOVER', {'junction': 'Morwani curve'}),
    'KOTA': ('BRIDGE_OVERHAUL', {'bridge': 'Chambal bridge'}),
    'SWM': ('WILDLIFE_CORRIDOR', {'corridor': 'Ranthambore sanctuary'}),
    'MTJ': ('FOG_VISIBILITY', {'corridor': 'NCR approach'}),
    'NDLS': ('TERMINAL_CONGESTION', {'junction': 'Shivaji Bridge outer signals'}),
    'CNB': ('BRIDGE_MAINTENANCE', {'bridge': 'Ganga Bridge', 'yard': 'Juhi yard'}),
    'PRYJ': ('YARD_INTERLOCKING', {'junction': 'Naini junction'}),
    'BSB': ('PLATFORM_HOLD', {'junction': 'Shivpur', 'station': 'Varanasi Cantt'}),
    'VAPI': ('SPEED_RESTRICTION', {'corridor': 'coastal section'}),
    'BH': ('BRIDGE_MAINTENANCE', {'bridge': 'Narmada river bridge'}),
    'ANND': ('SIGNAL_INTERLOCKING', {'siding': 'Dairy siding'}),
    'ND': ('HEADWAY_PRESSURE', {'corridor': 'suburban MEMU crossover'}),
    'ADI': ('TERMINAL_CONGESTION', {'platform': 'platform 1'}),
    'ASN': ('FREIGHT_PRECEDENCE', {'yard': 'Sitarampur yard'}),
    'DHN': ('SIGNAL_INTERLOCKING', {'junction': 'Coalfield junction'}),
    'PNME': ('SPEED_RESTRICTION', {'corridor': 'ghat section'}),
    'GAYA': ('CREW_CHANGEOVER', {'junction': 'Grand Chord crossover'}),
    'DDU': ('FREIGHT_PRECEDENCE', {'yard': 'Mughalsarai yards'}),
}


def get_delay_reasons(
    station_code: str,
    predicted_delay: int = 15,
    current_delay: int = 0,
    train_number: str = "",
    return_structured: bool = False,
    fog_severity: int = 0,
    freight_precedence: bool = False,
    tsr_speed_limit: bool = False,
    platform_hold: bool = False,
) -> list:
    """
    Dynamically attributes root causes for predicted station delay based on the
    underlying ML feature state and physics:
      1. On-Time Check: If predicted_delay <= 2, returns nominal operations & timetable slack.
      2. Kinematic Timetable Compression (schedule_slack_ratio >= 0.75): Speed headroom margin.
      3. Station Terminal Bottleneck (station_congestion_index >= 15): Junction interlocking & dwell.
      4. Sectional Delay Gradient (section_delay_gradient >= 3): Running speed loss over preceding block.
      5. Upstream Delay Ripple (current_delay >= 8): Delay carried from prior divisions.
      6. Extended Operational Dwell (scheduled_halt >= 8): Crew changeover & platform dwell.

    Calculates impact minutes deterministically so they match predicted_delay.
    """
    _try_load_model()
    stn = str(station_code).upper().strip()
    tid = str(train_number).zfill(5) if train_number else ""
    fog_severity = max(0, min(int(fog_severity), 30))
    override_candidates = []
    if fog_severity > 0:
        override_candidates.append((110.0 + fog_severity, {
            "category": "WEATHER_CAUTION",
            "reason": f"Dense fog scenario: {fog_severity}m of forecast safety impact reduces visibility margin on the {stn} approach (current delay: {int(current_delay)}m).",
        }))
    if freight_precedence:
        override_candidates.append((109.0 + current_delay, {
            "category": "FREIGHT_PRECEDENCE",
            "reason": f"Freight precedence scenario: +12m clearance allowance at {stn} is applied while current corridor delay is {int(current_delay)}m.",
        }))
    if tsr_speed_limit:
        override_candidates.append((108.0 + current_delay, {
            "category": "SPEED_RESTRICTION",
            "reason": f"Track-speed restriction scenario: +8m running-time allowance on the {stn} section, with {int(current_delay)}m upstream delay carried into the prediction.",
        }))
    if platform_hold:
        override_candidates.append((107.0 + current_delay, {
            "category": "PLATFORM_HOLD",
            "reason": f"Platform hold scenario: +6m dwell allowance at {stn}, with scheduled halt and approach congestion reflected in the model state.",
        }))

    # 1. On-time / nominal operations
    if predicted_delay <= 2 and not override_candidates:
        factors = [
            {
                "category": "NOMINAL_OPERATIONS",
                "reason": f"Nominal line headway: clear automated block signals and on-schedule transit into {stn}.",
                "impact_min": 0,
                "confidence": 0.98,
            },
            {
                "category": "SCHEDULE_HEADROOM",
                "reason": f"Timetable slack: adequate runtime margin allows on-time platform turnaround at {stn}.",
                "impact_min": 0,
                "confidence": 0.95,
            }
        ]
        return factors if return_structured else [f["reason"] for f in factors]

    lookup_key = f"{tid}_{stn}"
    lookup = _hist_averages.get("lookup", {}).get(lookup_key, {}) if _hist_averages else {}
    kin_min = float(lookup.get("kinematic_min_segment_time_min", 30.0))
    sched_time = max(1.0, float(lookup.get("segment_scheduled_time_min", 60.0)))
    slack_ratio = min(kin_min / sched_time, 2.0)
    congestion = float(lookup.get("station_congestion_index", _hist_averages.get("global_congestion", 20.0) if _hist_averages else 20.0))
    sec_gradient = float(lookup.get("section_delay_gradient", 0.0))
    halt_duration = float(lookup.get("scheduled_halt_duration_min", 2.0))
    seg_dist = float(lookup.get("segment_distance_km", 50.0))

    candidates = list(override_candidates)

    # Check 1: Kinematic timetable compression (trapezoidal velocity profile ceiling)
    if slack_ratio >= 0.75:
        candidates.append((
            50.0 + slack_ratio * 30.0,
            {
                "category": "SCHEDULE_HEADROOM",
                "reason": f"Kinematic timetable compression: tight scheduled time ({int(sched_time)}m) leaves minimal speed margin to recover delay over {int(seg_dist)} km section.",
            }
        ))

    # Check 2: Terminal junction interlocking & platform dwell bottleneck
    if congestion >= 15.0 or stn in STATION_INFRA_CONTEXT:
        cat, context = STATION_INFRA_CONTEXT.get(stn, ("TERMINAL_CONGESTION", {}))
        detail = ", ".join(str(v) for v in context.values())
        reason = (
            f"{cat.replace('_', ' ').title()} at {stn}: congestion index {congestion:.1f}, "
            f"schedule slack ratio {slack_ratio:.2f}, section delay gradient {sec_gradient:.1f}m, "
            f"scheduled halt {halt_duration:.1f}m, segment {seg_dist:.1f} km, current delay {int(current_delay)}m"
        )
        if detail:
            reason += f"; structural context: {detail}."
        else:
            reason += "."
        candidates.append((60.0 + congestion + sec_gradient + halt_duration, {"category": cat, "reason": reason}))

    # Check 3: Sectional delay accumulation / gradient
    if sec_gradient >= 3.0:
        candidates.append((
            45.0 + sec_gradient * 2.0,
            {
                "category": "HEADWAY_PRESSURE",
                "reason": f"Sectional delay accumulation: train losing clearance interval over preceding block (+{int(sec_gradient)}m delay gradient).",
            }
        ))

    # Check 4: Upstream corridor ripple delay carried forward
    if current_delay >= 8:
        candidates.append((
            35.0 + float(current_delay),
            {
                "category": "SECTION_CLEARANCE",
                "reason": f"Upstream corridor ripple delay: carrying {int(current_delay)}m residual delay propagated from earlier section.",
            }
        ))

    # Check 5: Extended operational dwell
    if halt_duration >= 8.0:
        candidates.append((
            30.0 + halt_duration,
            {
                "category": "PLATFORM_OCCUPANCY",
                "reason": f"Scheduled operational halt: extended {int(halt_duration)}m crew changeover, loco check, and platform dwell.",
            }
        ))

    # Fallback options if fewer than 2 candidates qualify
    candidates.append((
        10.0,
        {
            "category": "SPEED_RESTRICTION",
            "reason": f"Sectional speed restriction: automated caution aspects and track maintenance speed limit approaching {stn}.",
        }
    ))
    candidates.append((
        5.0,
        {
            "category": "SIGNAL_INTERLOCKING",
            "reason": f"Station approach route signaling clearance queue entering {stn} outer signals.",
        }
    ))

    candidates.sort(key=lambda x: -x[0])
    selected = [dict(c[1]) for c in candidates[:2]]

    # Allocate impact minutes deterministically so they sum up to predicted_delay
    impact_1 = max(1, round(predicted_delay * 0.60))
    impact_2 = max(1, predicted_delay - impact_1)

    selected[0]["impact_min"] = impact_1
    selected[0]["confidence"] = round(min(0.96, 0.88 + 0.003 * predicted_delay), 2)
    selected[1]["impact_min"] = impact_2
    selected[1]["confidence"] = round(min(0.92, 0.82 + 0.002 * predicted_delay), 2)

    return selected if return_structured else [f["reason"] for f in selected]


def status_from_delay(delay_min: int) -> str:
    """Classifies delay into operational status."""
    if delay_min <= 2:
        return "on_time"
    return "delayed"


def model_metrics() -> dict:
    """
    Returns real training metrics if the model has been trained,
    otherwise clearly-labeled placeholder metrics so the About page
    doesn't silently show fake numbers as if they were real.
    """
    if os.path.exists(_METRICS_PATH):
        with open(_METRICS_PATH) as f:
            saved = json.load(f)
        return {
            "mae_minutes": saved["mae_minutes"],
            "trained_on_records": saved["trained_on_records"],
            "last_trained": f"Gradient Boosted Tree (trained {saved['last_trained']})",
        }
    return {
        "mae_minutes": 0.0,
        "trained_on_records": 0,
        "last_trained": "Not yet trained — placeholder predictions in use",
    }
