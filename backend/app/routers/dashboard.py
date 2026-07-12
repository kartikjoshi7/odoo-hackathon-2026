from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.driver import Driver
from app.models.maintenance import MaintenanceLog
from app.models.fuel import FuelLog
from app.schemas.vehicle import VehicleStatusEnum
from app.schemas.trip import TripStatusEnum
from app.schemas.driver import DriverStatusEnum

router = APIRouter(prefix="/dashboard", tags=["Dashboard & KPIs"])

@router.get("/kpis")
async def get_dashboard_kpis(db: AsyncSession = Depends(get_db)):
    """Aggregates system-wide KPIs in real-time for the frontend dashboard."""
    # 1. Vehicle KPIs
    total_vehicles_q = await db.execute(select(func.count(Vehicle.id)))
    total_vehicles = total_vehicles_q.scalar() or 0
    
    active_vehicles_q = await db.execute(select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatusEnum.ON_TRIP.value))
    active_vehicles = active_vehicles_q.scalar() or 0
    
    available_vehicles_q = await db.execute(select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatusEnum.AVAILABLE.value))
    available_vehicles = available_vehicles_q.scalar() or 0
    
    maintenance_vehicles_q = await db.execute(select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatusEnum.IN_SHOP.value))
    maintenance_vehicles = maintenance_vehicles_q.scalar() or 0
    
    # 2. Trip KPIs
    active_trips_q = await db.execute(select(func.count(Trip.id)).where(Trip.status == TripStatusEnum.DISPATCHED.value))
    active_trips = active_trips_q.scalar() or 0
    
    pending_trips_q = await db.execute(select(func.count(Trip.id)).where(Trip.status == TripStatusEnum.DRAFT.value))
    pending_trips = pending_trips_q.scalar() or 0
    
    completed_trips_q = await db.execute(select(func.count(Trip.id)).where(Trip.status == TripStatusEnum.COMPLETED.value))
    completed_trips = completed_trips_q.scalar() or 0
    
    # 3. Personnel KPIs
    on_duty_drivers_q = await db.execute(select(func.count(Driver.id)).where(Driver.status == DriverStatusEnum.ON_TRIP.value))
    on_duty_drivers = on_duty_drivers_q.scalar() or 0
    
    # 4. Computed Metrics
    utilization_pct = (active_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0.0
    
    # Mock Revenue: Assume 5000.0 per completed trip
    mock_revenue = float(completed_trips) * 5000.0
    
    # Total Operational Costs
    total_maint_q = await db.execute(select(func.sum(MaintenanceLog.cost)))
    total_maint = float(total_maint_q.scalar() or 0.0)
    
    total_fuel_q = await db.execute(select(func.sum(FuelLog.cost)))
    total_fuel = float(total_fuel_q.scalar() or 0.0)
    
    total_acq_cost_q = await db.execute(select(func.sum(Vehicle.acquisition_cost)))
    total_acq_cost = float(total_acq_cost_q.scalar() or 0.0)
    
    total_costs = total_maint + total_fuel
    roi_pct = 0.0
    if total_acq_cost > 0:
        roi_pct = ((mock_revenue - total_costs) / total_acq_cost) * 100

    return {
        "kpis": {
            "active_vehicles": active_vehicles,
            "available_vehicles": available_vehicles,
            "vehicles_in_maintenance": maintenance_vehicles,
            "active_trips": active_trips,
            "pending_trips": pending_trips,
            "drivers_on_duty": on_duty_drivers,
            "fleet_utilization_percent": round(utilization_pct, 2),
            "fleet_roi_percent": round(roi_pct, 2),
            "total_revenue": round(mock_revenue, 2),
            "total_operational_cost": round(total_costs, 2)
        }
    }
