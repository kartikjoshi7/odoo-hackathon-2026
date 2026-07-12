from fastapi import APIRouter

from .vehicles import router as vehicles_router
from .drivers import router as drivers_router
from .trips import router as trips_router

# Unified APIRouter mapping all domain paths
api_router = APIRouter()

api_router.include_router(vehicles_router)
api_router.include_router(drivers_router)
api_router.include_router(trips_router)
