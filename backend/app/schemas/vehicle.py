from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from enum import Enum
from decimal import Decimal

class VehicleStatusEnum(str, Enum):
    AVAILABLE = 'Available'
    ON_TRIP = 'On Trip'
    IN_SHOP = 'In Shop'
    RETIRED = 'Retired'

class VehicleBase(BaseModel):
    registration_number: str = Field(..., min_length=2)
    model: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    max_load_capacity: float = Field(..., gt=0, description="Max load capacity must be greater than 0")
    odometer: int = Field(0, ge=0)
    acquisition_cost: Decimal = Field(..., ge=0)
    status: VehicleStatusEnum = VehicleStatusEnum.AVAILABLE

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = Field(None, min_length=2)
    model: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, min_length=1)
    max_load_capacity: Optional[float] = Field(None, gt=0)
    odometer: Optional[int] = Field(None, ge=0)
    acquisition_cost: Optional[Decimal] = Field(None, ge=0)
    status: Optional[VehicleStatusEnum] = None

class VehicleResponse(VehicleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
