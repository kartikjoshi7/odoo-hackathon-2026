from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import date
from enum import Enum

from app.core.database import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse, DriverStatusEnum

router = APIRouter(prefix="/drivers", tags=["Drivers"])

def serialize_enums(data: dict) -> dict:
    return {k: v.value if isinstance(v, Enum) else v for k, v in data.items()}

@router.post("/", response_model=DriverResponse, status_code=201)
async def create_driver(driver: DriverCreate, db: AsyncSession = Depends(get_db)):
    """Register a new driver in the system."""
    data = serialize_enums(driver.model_dump())
    db_driver = Driver(**data)
    db.add(db_driver)
    await db.commit()
    await db.refresh(db_driver)
    return db_driver

@router.get("/", response_model=List[DriverResponse])
async def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all personnel data."""
    query = select(Driver).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch specific driver details."""
    driver = await db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(driver_id: int, driver_update: DriverUpdate, db: AsyncSession = Depends(get_db)):
    """Update driver stats, verifying compliance before modifying active state."""
    db_driver = await db.get(Driver, driver_id)
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Compliance Check: Expired licenses block state changes
    if driver_update.status:
        if db_driver.license_expiry_date < date.today():
             raise HTTPException(status_code=400, detail="Compliance Violation: Cannot update status, driver license is expired.")

    update_data = serialize_enums(driver_update.model_dump(exclude_unset=True))
    for key, value in update_data.items():
        setattr(db_driver, key, value)
        
    await db.commit()
    await db.refresh(db_driver)
    return db_driver
