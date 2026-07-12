from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from enum import Enum
from datetime import date
from decimal import Decimal

class ExpenseTypeEnum(str, Enum):
    TOLL = 'Toll'
    TAX = 'Tax'
    OTHER = 'Other'

class ExpenseBase(BaseModel):
    vehicle_id: int
    type: ExpenseTypeEnum
    cost: Decimal = Field(..., gt=0)
    date: date

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    type: Optional[ExpenseTypeEnum] = None
    cost: Optional[Decimal] = Field(None, gt=0)
    date: Optional[date] = None

class ExpenseResponse(ExpenseBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
