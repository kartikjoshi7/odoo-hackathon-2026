from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from enum import Enum

from app.core.database import get_db
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripStatusEnum
from app.schemas.vehicle import VehicleStatusEnum
from app.schemas.driver import DriverStatusEnum

router = APIRouter(prefix="/trips", tags=["Trips - Dispatch Engine"])

def serialize_enums(data: dict) -> dict:
    return {k: v.value if isinstance(v, Enum) else v for k, v in data.items()}

@router.post("/", response_model=TripResponse, status_code=201)
async def dispatch_trip(trip: TripCreate, db: AsyncSession = Depends(get_db)):
    """
    Core Dispatch Workflow. Enforces relational constraints:
    - Driver must be 'Available'
    - Vehicle must be 'Available'
    - Cargo weight must not exceed Vehicle limits
    Locks resources by updating states to 'On Trip'.
    """
    # 1. Verify Driver Compliance & Availability
    driver = await db.get(Driver, trip.driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.status != DriverStatusEnum.AVAILABLE.value:
        raise HTTPException(status_code=400, detail="Conflict: Driver is currently not available for dispatch")

    # 2. Verify Vehicle Asset Availability
    vehicle = await db.get(Vehicle, trip.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status != VehicleStatusEnum.AVAILABLE.value:
        raise HTTPException(status_code=400, detail="Conflict: Vehicle is currently not available for dispatch")
        
    # 3. Verify Deterministic Physics (Capacity)
    if trip.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=400, 
            detail=f"Safety Constraint: Cargo ({trip.cargo_weight}) exceeds vehicle capacity ({vehicle.max_load_capacity})"
        )

    # 4. Generate the Trip Record
    data = serialize_enums(trip.model_dump())
    data['status'] = TripStatusEnum.DISPATCHED.value
    db_trip = Trip(**data)
    db.add(db_trip)
    
    # 5. Execute State Machine Locks
    vehicle.status = VehicleStatusEnum.ON_TRIP.value
    driver.status = DriverStatusEnum.ON_TRIP.value
    
    await db.commit()
    await db.refresh(db_trip)
    return db_trip

@router.get("/active", response_model=List[TripResponse])
async def list_active_trips(db: AsyncSession = Depends(get_db)):
    """Fetch all trips actively in transit."""
    query = select(Trip).where(Trip.status == TripStatusEnum.DISPATCHED.value)
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/{trip_id}/complete", response_model=TripResponse)
async def complete_trip(
    trip_id: int, 
    actual_distance: float = Query(..., gt=0, description="The actual recorded distance of the trip"), 
    db: AsyncSession = Depends(get_db)
):
    """
    Closes the dispatch loop. 
    Logs final odometer readings and unlocks the resources back to 'Available'.
    """
    db_trip = await db.get(Trip, trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if db_trip.status != TripStatusEnum.DISPATCHED.value:
        raise HTTPException(status_code=400, detail="Invalid State: Only dispatched/active trips can be completed")

    # Finalize Trip Status
    db_trip.status = TripStatusEnum.COMPLETED.value
    
    # Finalize Vehicle Logs & Unlock State
    vehicle = await db.get(Vehicle, db_trip.vehicle_id)
    vehicle.odometer += int(actual_distance)
    vehicle.status = VehicleStatusEnum.AVAILABLE.value
    
    # Unlock Driver State
    driver = await db.get(Driver, db_trip.driver_id)
    driver.status = DriverStatusEnum.AVAILABLE.value

    await db.commit()
    await db.refresh(db_trip)
    return db_trip
