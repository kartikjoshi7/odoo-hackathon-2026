from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from enum import Enum
from datetime import date

class DriverStatusEnum(str, Enum):
    AVAILABLE = 'Available'
    ON_TRIP = 'On Trip'
    OFF_DUTY = 'Off Duty'
    SUSPENDED = 'Suspended'

class DriverBase(BaseModel):
    name: str = Field(..., min_length=1)
    license_number: str = Field(..., min_length=1)
    license_category: str = Field(..., min_length=1)
    license_expiry_date: date
    contact_number: Optional[str] = None
    safety_score: int = Field(100, ge=0, le=100, description="Safety score ranges 0 to 100")
    status: DriverStatusEnum = DriverStatusEnum.AVAILABLE

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    license_number: Optional[str] = Field(None, min_length=1)
    license_category: Optional[str] = Field(None, min_length=1)
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[DriverStatusEnum] = None

class DriverResponse(DriverBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
