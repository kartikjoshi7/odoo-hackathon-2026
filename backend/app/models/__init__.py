# Expose all models to make Alembic and other modules easily import them from app.models
from app.core.database import Base
from .role import Role
from .user import User
from .vehicle import Vehicle
from .driver import Driver
from .trip import Trip
from .maintenance import MaintenanceLog
from .fuel import FuelLog
from .expense import Expense
from .audit import AuditLog
