from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from enum import Enum

from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleStatusEnum

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

def serialize_enums(data: dict) -> dict:
    return {k: v.value if isinstance(v, Enum) else v for k, v in data.items()}

@router.post("/", response_model=VehicleResponse, status_code=201)
async def create_vehicle(vehicle: VehicleCreate, db: AsyncSession = Depends(get_db)):
    """Create a new vehicle in the system. Defaults to 'Available' status."""
    data = serialize_enums(vehicle.model_dump())
    db_vehicle = Vehicle(**data)
    db.add(db_vehicle)
    await db.commit()
    await db.refresh(db_vehicle)
    return db_vehicle

@router.get("/", response_model=List[VehicleResponse])
async def list_vehicles(
    status: Optional[VehicleStatusEnum] = None, 
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all vehicles, optionally filtering by current status."""
    query = select(Vehicle)
    if status:
        query = query.where(Vehicle.status == status.value)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch specific vehicle details."""
    vehicle = await db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(vehicle_id: int, vehicle_update: VehicleUpdate, db: AsyncSession = Depends(get_db)):
    """Update vehicle metrics such as odometer readings or maintenance status."""
    db_vehicle = await db.get(Vehicle, vehicle_id)
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = serialize_enums(vehicle_update.model_dump(exclude_unset=True))
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
        
    await db.commit()
    await db.refresh(db_vehicle)
    return db_vehicle
