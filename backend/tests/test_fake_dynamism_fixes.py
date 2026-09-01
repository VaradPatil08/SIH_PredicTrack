import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.routers.trains import _parse_platform_value
from app.services import eta


def test_real_platform_parser_preserves_railradar_value():
    assert _parse_platform_value("PF 7") == 7
    assert _parse_platform_value("7") == 7


def test_missing_or_malformed_platform_is_unavailable():
    assert _parse_platform_value(None) is None
    assert _parse_platform_value("") is None
    assert _parse_platform_value("PF unknown") is None
    assert _parse_platform_value("0") is None


def test_station_infrastructure_reason_changes_with_feature_state(monkeypatch):
    monkeypatch.setattr(
        eta,
        "_hist_averages",
        {
            "global_congestion": 20.0,
            "lookup": {
                "12951_ST": {
                    "kinematic_min_segment_time_min": 35,
                    "segment_scheduled_time_min": 60,
                    "station_congestion_index": 18,
                    "section_delay_gradient": 2,
                    "scheduled_halt_duration_min": 4,
                    "segment_distance_km": 40,
                }
            },
        },
    )
    first = eta.get_delay_reasons("ST", 20, 10, "12951", return_structured=True)

    eta._hist_averages["lookup"]["12951_ST"]["station_congestion_index"] = 31
    eta._hist_averages["lookup"]["12951_ST"]["section_delay_gradient"] = 9
    eta._hist_averages["lookup"]["12951_ST"]["scheduled_halt_duration_min"] = 12
    second = eta.get_delay_reasons("ST", 20, 10, "12951", return_structured=True)

    first_text = " | ".join(item["reason"] for item in first)
    second_text = " | ".join(item["reason"] for item in second)
    assert first_text != second_text
    assert "Sachin yard" in first_text
    assert "Sachin yard" in second_text


def test_override_reaches_prediction_and_reason_path(monkeypatch):
    monkeypatch.setattr(eta, "_try_load_model", lambda: None)
    monkeypatch.setattr(eta, "_model", None)
    monkeypatch.setattr(eta.random, "uniform", lambda _a, _b: 0)

    normal, _ = eta.predict_delay_minutes("12951", "ST", 100, 10, 1000)
    scenario, factors = eta.predict_delay_minutes(
        "12951", "ST", 100, 10, 1000,
        fog_severity=10,
        freight_precedence=True,
        tsr_speed_limit=True,
        platform_hold=True,
    )

    assert scenario > normal
    structured = eta.get_delay_reasons(
        "ST", scenario, 10, "12951", return_structured=True,
        fog_severity=10, freight_precedence=True, tsr_speed_limit=True, platform_hold=True,
    )
    categories = {factor["category"] for factor in structured}
    assert categories & {"WEATHER_CAUTION", "FREIGHT_PRECEDENCE", "SPEED_RESTRICTION", "PLATFORM_HOLD"}
