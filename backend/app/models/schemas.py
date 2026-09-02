"""
Pydantic schemas — this file defines the API contract between frontend and backend.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Union


class Station(BaseModel):
    code: str            # e.g. "MMCT"
    name: str            # e.g. "Mumbai Central"
    lat: float
    lng: float
    scheduled_offset_min: int = 0
    distance_km: float = 0.0


class DelayReasonItem(BaseModel):
    category: str = "TRACK_OCCUPANCY"
    reason: str
    reason_key: Optional[str] = None
    reason_params: dict = Field(default_factory=dict)
    impact_min: int = 5
    confidence: float = 0.90


class StationETA(Station):
    predicted_delay_min: int = 0
    predicted_offset_min: int = 0
    status: str = "on_time"   # "reached" | "on_time" | "delayed"
    platform: Optional[int] = None
    platform_is_estimated: bool = True
    top_delay_factors: List[DelayReasonItem] = Field(default_factory=list)


class TrainSummary(BaseModel):
    train_number: str
    name: str
    origin: str
    destination: str
    type: Optional[str] = None
    zone: Optional[str] = None
    scheduled_departure: Optional[str] = None
    total_distance_km: Optional[int] = None
    train_name: Optional[str] = None
    featured: Optional[bool] = False


class CurrentPosition(BaseModel):
    lat: float
    lng: float
    speed_kmh: Union[int, float]
    last_updated: str
    next_station_code: str
    next_station_name: str
    distance_to_next_km: Union[int, float]
    bearing_degrees: Optional[float] = None
    synced_at: Optional[str] = None
    source: str = "simulated"  # "simulated" | "railradar"


class LiveSyncResponse(BaseModel):
    train_number: str
    lat: float
    lng: float
    speed_kmh: float
    bearing_degrees: Optional[float] = None
    next_station_code: Optional[str] = None
    next_station_name: Optional[str] = None
    distance_to_next_km: Optional[float] = None
    source: str = "simulated"  # "railradar" | "simulated"
    synced_at: str


class TrainETAResponse(BaseModel):
    train_number: str
    name: str
    scheduled_departure: Optional[str] = None
    schedule_source: str = "local_fallback"  # "railradar" | "local_fallback"
    schedule_fetched_at: Optional[str] = None
    current_position: CurrentPosition
    elapsed_min: int
    stations: List[StationETA]
    is_mock: bool = False
    crowd_signal: Optional[dict] = None


class TrainRouteResponse(BaseModel):
    train_number: str
    name: str
    stations: List[Station]


class DelayReasonsResponse(BaseModel):
    reasons: List[Union[DelayReasonItem, str]] = []


class ModelMetrics(BaseModel):
    mae_minutes: float
    trained_on_records: int
    last_trained: str


class StationPickerItem(BaseModel):
    code: str
    name: str


class StationArrivalItem(BaseModel):
    train_number: str
    train_name: str
    platform: Optional[int] = None
    platform_is_estimated: bool = True
    scheduled_arrival_offset_min: int
    scheduled_departure: str = "00:00"
    scheduled_arrival_time: Optional[str] = None
    predicted_delay_min: int
    predicted_arrival_offset_min: int
    halt_min: int
    status: str
    direction: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    speed_kmh: Optional[float] = None
    live_source: str = "simulated"  # "railradar" | "simulated"
    live_synced_at: Optional[str] = None
