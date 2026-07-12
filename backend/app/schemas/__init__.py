# Clean exports of all Pydantic schemas for our routing layer
from .role import RoleCreate, RoleUpdate, RoleResponse
from .user import UserCreate, UserUpdate, UserResponse
from .vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from .driver import DriverCreate, DriverUpdate, DriverResponse
from .trip import TripCreate, TripUpdate, TripResponse
from .maintenance import MaintenanceLogCreate, MaintenanceLogUpdate, MaintenanceLogResponse
from .fuel import FuelLogCreate, FuelLogUpdate, FuelLogResponse
from .expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
