from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from enum import Enum

class RoleEnum(str, Enum):
    FLEET_MANAGER = 'Fleet Manager'
    DRIVER = 'Driver'
    SAFETY_OFFICER = 'Safety Officer'
    FINANCIAL_ANALYST = 'Financial Analyst'

class RoleBase(BaseModel):
    name: RoleEnum = Field(..., description="The designated system role")

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[RoleEnum] = None

class RoleResponse(RoleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
