import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    TrainETAResponse, 
    TrainRouteResponse, 
    TrainSummary, 
    Station,
    StationETA, 
    CurrentPosition,
    DelayReasonsResponse,
    ModelMetrics
)
from app.services import eta, live_feed

router = APIRouter(tags=["trains"])

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_trains.json"
with open(_DATA_PATH, encoding="utf-8") as f:
    _MOCK_TRAINS = json.load(f)


@router.get("/trains", response_model=list[TrainSummary])
def list_trains():
    """All demo-able trains for the control directory / search page."""
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
        )
        for t in _MOCK_TRAINS.values()
    ]


@router.get("/trains/{train_number}/route", response_model=TrainRouteResponse)
@router.get("/train/{train_number}/route", response_model=TrainRouteResponse)
def get_train_route(train_number: str):
    """Returns static station list and GIS coordinates for a train route."""
    train = _MOCK_TRAINS.get(train_number)
    if not train:
        raise HTTPException(status_code=404, detail=f"Unknown train {train_number}")

    return TrainRouteResponse(
        train_number=train["train_number"],
        name=train["name"],
        stations=[
            Station(
                code=st["code"],
                name=st["name"],
                lat=st["lat"],
                lng=st["lng"],
                scheduled_offset_min=st.get("scheduled_offset_min", 0),
                distance_km=st.get("distance_km", 0.0),
            )
            for st in train["stations"]
        ]
    )


@router.get("/trains/{train_number}/eta", response_model=TrainETAResponse)
@router.get("/train/{train_number}/eta", response_model=TrainETAResponse)
def get_train_eta(train_number: str):
    """
    Main endpoint the live tracking page uses:
    Calculates interpolated current position, live speed, and station-level delay predictions.
    """
    train = _MOCK_TRAINS.get(train_number)
    if not train:
        raise HTTPException(status_code=404, detail=f"Unknown train {train_number}")

    stations = train["stations"]
    position, elapsed_min, current_station_index = live_feed.get_live_position_and_state(stations)

    base_delay = 18
    station_etas = []
    for idx, st in enumerate(stations):
        if idx < current_station_index:
            status = "reached"
            delay = 0 if idx == 0 else max(0, base_delay - (len(stations) - idx) * 2)
        elif idx == current_station_index:
            status = "delayed"
            delay = base_delay
        else:
            delay, _ = eta.predict_delay_minutes(
                train_number=train_number,
                station_code=st["code"],
                distance_km=st.get("distance_km", 0),
                current_delay_min=base_delay,
            )
            status = eta.status_from_delay(delay)

        station_etas.append(
            StationETA(
                code=st["code"],
                name=st["name"],
                lat=st["lat"],
                lng=st["lng"],
                scheduled_offset_min=st.get("scheduled_offset_min", 0),
                distance_km=st.get("distance_km", 0.0),
                predicted_delay_min=delay,
                predicted_offset_min=st.get("scheduled_offset_min", 0) + delay,
                status=status,
                platform=(idx % 4) + 1,
                top_delay_factors=eta.get_delay_reasons(st["code"]),
            )
        )

    return TrainETAResponse(
        train_number=train["train_number"],
        name=train["name"],
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
