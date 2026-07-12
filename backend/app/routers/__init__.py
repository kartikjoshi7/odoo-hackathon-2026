from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, RoleChecker

from .auth import router as auth_router
from .vehicles import router as vehicles_router
from .drivers import router as drivers_router
from .trips import router as trips_router
from .maintenance import router as maintenance_router
from .financials import router as financials_router
from .dashboard import router as dashboard_router

# Unified routing tree
api_router = APIRouter()

# Public Routes
api_router.include_router(auth_router)

# Protected Routes with highly scalable RBAC middleware checks at the router level
api_router.include_router(
    dashboard_router, 
    dependencies=[Depends(get_current_user)]
)
api_router.include_router(
    vehicles_router, 
    dependencies=[Depends(RoleChecker(["Fleet Manager", "Safety Officer"]))]
)
api_router.include_router(
    drivers_router, 
    dependencies=[Depends(RoleChecker(["Fleet Manager", "Safety Officer", "Driver"]))]
)
api_router.include_router(
    trips_router, 
    dependencies=[Depends(RoleChecker(["Fleet Manager", "Driver"]))]
)
api_router.include_router(
    maintenance_router, 
    dependencies=[Depends(RoleChecker(["Fleet Manager"]))]
)
api_router.include_router(
    financials_router, 
    dependencies=[Depends(RoleChecker(["Fleet Manager", "Financial Analyst"]))]
)
