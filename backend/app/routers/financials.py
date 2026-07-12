from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from enum import Enum

from app.core.database import get_db
from app.models.fuel import FuelLog
from app.models.expense import Expense
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle
from app.schemas.fuel import FuelLogCreate, FuelLogResponse
from app.schemas.expense import ExpenseCreate, ExpenseResponse

router = APIRouter(prefix="/financials", tags=["Financials & Expenses"])

def serialize_enums(data: dict) -> dict:
    return {k: v.value if isinstance(v, Enum) else v for k, v in data.items()}

@router.post("/fuel", response_model=FuelLogResponse, status_code=201)
async def create_fuel_log(log: FuelLogCreate, db: AsyncSession = Depends(get_db)):
    """Records a refuelling transaction against a vehicle."""
    data = serialize_enums(log.model_dump())
    db_log = FuelLog(**data)
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

@router.post("/expense", response_model=ExpenseResponse, status_code=201)
async def create_expense(expense: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    """Records a generic business expense (e.g. tolls, permits, driver allowances)."""
    data = serialize_enums(expense.model_dump())
    db_expense = Expense(**data)
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

@router.get("/vehicles/{vehicle_id}/costs")
async def get_vehicle_operational_costs(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    """Calculates total historic operational cost (Fuel + Maintenance) for a specific asset."""
    vehicle = await db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    fuel_result = await db.execute(select(func.sum(FuelLog.cost)).where(FuelLog.vehicle_id == vehicle_id))
    fuel_cost = fuel_result.scalar() or 0.0
    
    maint_result = await db.execute(select(func.sum(MaintenanceLog.cost)).where(MaintenanceLog.vehicle_id == vehicle_id))
    maint_cost = maint_result.scalar() or 0.0
    
    total_cost = float(fuel_cost) + float(maint_cost)
    
    return {
        "vehicle_id": vehicle_id,
        "fuel_cost": float(fuel_cost),
        "maintenance_cost": float(maint_cost),
        "total_operational_cost": total_cost
    }
