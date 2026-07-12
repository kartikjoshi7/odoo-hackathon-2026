from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date
from decimal import Decimal

class FuelLogBase(BaseModel):
    vehicle_id: int
    liters: float = Field(..., gt=0, description="Fuel volume must be positive")
    cost: Decimal = Field(..., gt=0, description="Fuel cost must be strictly positive")
    date: date

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    liters: Optional[float] = Field(None, gt=0)
    cost: Optional[Decimal] = Field(None, gt=0)
    date: Optional[date] = None

class FuelLogResponse(FuelLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
