from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from enum import Enum

class TripStatusEnum(str, Enum):
    DRAFT = 'Draft'
    DISPATCHED = 'Dispatched'
    COMPLETED = 'Completed'
    CANCELLED = 'Cancelled'

class TripBase(BaseModel):
    source: str = Field(..., min_length=1)
    destination: str = Field(..., min_length=1)
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(..., gt=0, description="Cargo weight must be strictly positive")
    planned_distance: float = Field(..., gt=0, description="Planned distance must be strictly positive")
    status: TripStatusEnum = TripStatusEnum.DRAFT

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    source: Optional[str] = Field(None, min_length=1)
    destination: Optional[str] = Field(None, min_length=1)
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    cargo_weight: Optional[float] = Field(None, gt=0)
    planned_distance: Optional[float] = Field(None, gt=0)
    status: Optional[TripStatusEnum] = None

class TripResponse(TripBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
