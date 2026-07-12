from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.sockets import manager
from app.core.audit import log_audit_event
from app.api.deps import get_current_user
from app.models.user import User
from typing import List
from enum import Enum

from app.core.database import get_db
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle
from app.schemas.maintenance import MaintenanceLogCreate, MaintenanceLogUpdate, MaintenanceLogResponse
from app.schemas.vehicle import VehicleStatusEnum

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

def serialize_enums(data: dict) -> dict:
    return {k: v.value if isinstance(v, Enum) else v for k, v in data.items()}

@router.post("/", response_model=MaintenanceLogResponse, status_code=201)
async def create_maintenance_log(
    log: MaintenanceLogCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Logs a maintenance activity and locks the vehicle status to 'In Shop'."""
    vehicle = await db.get(Vehicle, log.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    data = serialize_enums(log.model_dump())
    db_log = MaintenanceLog(**data)
    db.add(db_log)
    
    # Business Rule: Lock Vehicle in shop
    vehicle.status = VehicleStatusEnum.IN_SHOP.value
    
    await db.commit()
    await db.refresh(db_log)
    
    # WebSocket Broadcast
    await manager.broadcast({"event": "REFRESH_DATA"})
    
    # Audit Log via Background Task
    background_tasks.add_task(log_audit_event, current_user.id, "CREATED_MAINTENANCE", f"Vehicle: {vehicle.id}")
    
    return db_log

@router.put("/{log_id}/close", response_model=MaintenanceLogResponse)
async def close_maintenance_log(log_id: int, db: AsyncSession = Depends(get_db)):
    """Closes the maintenance log and returns the vehicle to 'Available' (unless retired)."""
    db_log = await db.get(MaintenanceLog, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
        
    vehicle = await db.get(Vehicle, db_log.vehicle_id)
    
    # Business Rule: Unlock vehicle unless retired
    if vehicle and vehicle.status != VehicleStatusEnum.RETIRED.value:
        vehicle.status = VehicleStatusEnum.AVAILABLE.value
        
    await db.commit()
    await db.refresh(db_log)
    return db_log
