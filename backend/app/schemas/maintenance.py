from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from enum import Enum
from datetime import date
from decimal import Decimal

class MaintenanceStatusEnum(str, Enum):
    OPEN = 'Open'
    CLOSED = 'Closed'

class MaintenanceLogBase(BaseModel):
    vehicle_id: int
    description: str = Field(..., min_length=1)
    cost: Decimal = Field(default=Decimal('0.0'), ge=0)
    start_date: date
    end_date: Optional[date] = None
    status: MaintenanceStatusEnum = MaintenanceStatusEnum.OPEN

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    description: Optional[str] = Field(None, min_length=1)
    cost: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[MaintenanceStatusEnum] = None

class MaintenanceLogResponse(MaintenanceLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
