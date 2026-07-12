import asyncio
from datetime import date
from decimal import Decimal

from app.core.database import engine, AsyncSessionLocal
from app.models import Base
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.role import Role
from app.models.user import User
from app.schemas.vehicle import VehicleStatusEnum
from app.schemas.driver import DriverStatusEnum
from app.schemas.trip import TripStatusEnum
from app.core.security import get_password_hash

async def seed_db():
    print("Dropping existing tables to reset environment...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating fresh relational tables...")
        await conn.run_sync(Base.metadata.create_all)
        
    print("Seeding deterministic TransitOps data...")
    async with AsyncSessionLocal() as session:
        # Seed RBAC Roles
        print("Seeding Roles...")
        roles = [
            Role(name="Fleet Manager"),
            Role(name="Driver"),
            Role(name="Financial Analyst"),
            Role(name="Safety Officer")
        ]
        session.add_all(roles)
        await session.commit()

        # Seed Users
        print("Seeding Users...")
        default_pwd = get_password_hash("hackathon123")
        users = [
            User(email="manager@transitops.com", password_hash=default_pwd, role_id=1),
            User(email="driver@transitops.com", password_hash=default_pwd, role_id=2),
            User(email="analyst@transitops.com", password_hash=default_pwd, role_id=3)
        ]
        session.add_all(users)
        await session.commit()

        # Seed Realistic Vehicles
        print("Seeding Vehicles...")
        vehicles = [
            Vehicle(registration_number="MH-01-AB-1234", model="Tata Prima 2830.K", type="Heavy Truck", max_load_capacity=28000, odometer=12500, acquisition_cost=Decimal("3500000"), status=VehicleStatusEnum.AVAILABLE.value),
            Vehicle(registration_number="MH-04-CD-5678", model="Ashok Leyland 1920", type="Medium Truck", max_load_capacity=19000, odometer=45200, acquisition_cost=Decimal("2200000"), status=VehicleStatusEnum.AVAILABLE.value),
            Vehicle(registration_number="KA-05-EF-9012", model="Eicher Pro 3019", type="Medium Truck", max_load_capacity=19000, odometer=8900, acquisition_cost=Decimal("2100000"), status=VehicleStatusEnum.AVAILABLE.value),
            Vehicle(registration_number="DL-01-GH-3456", model="BharatBenz 2823C", type="Heavy Truck", max_load_capacity=28000, odometer=56000, acquisition_cost=Decimal("3800000"), status=VehicleStatusEnum.AVAILABLE.value),
            Vehicle(registration_number="MH-12-IJ-7890", model="Tata Signa 4825.TK", type="Heavy Truck", max_load_capacity=47500, odometer=2100, acquisition_cost=Decimal("4500000"), status=VehicleStatusEnum.AVAILABLE.value)
        ]
        session.add_all(vehicles)
        await session.commit()
        
        # Seed Realistic Drivers
        print("Seeding Drivers...")
        drivers = [
            Driver(name="Rajesh Kumar", license_number="DL-1420190012345", license_category="HMV", license_expiry_date=date(2028, 5, 12), contact_number="+91-9876543210", safety_score=95, status=DriverStatusEnum.AVAILABLE.value),
            Driver(name="Suresh Singh", license_number="MH-0120150098765", license_category="HMV", license_expiry_date=date(2027, 8, 22), contact_number="+91-8765432109", safety_score=88, status=DriverStatusEnum.AVAILABLE.value),
            Driver(name="Amit Patel", license_number="GJ-0520180054321", license_category="LMV", license_expiry_date=date(2029, 11, 30), contact_number="+91-7654321098", safety_score=100, status=DriverStatusEnum.AVAILABLE.value),
            Driver(name="Ramesh Yadav", license_number="UP-1620170067890", license_category="HMV", license_expiry_date=date(2026, 1, 15), contact_number="+91-6543210987", safety_score=92, status=DriverStatusEnum.AVAILABLE.value),
            Driver(name="Karthik N", license_number="KA-0320140023456", license_category="HMV", license_expiry_date=date(2030, 3, 10), contact_number="+91-5432109876", safety_score=97, status=DriverStatusEnum.AVAILABLE.value)
        ]
        session.add_all(drivers)
        await session.commit()

        # Seed Trips and trigger Dispatch state locks
        print("Seeding Trips...")
        trips = [
            Trip(source="Mumbai Central", destination="Pune Hub", vehicle_id=1, driver_id=1, cargo_weight=15000, planned_distance=150, status=TripStatusEnum.COMPLETED.value),
            Trip(source="Delhi Logistics Park", destination="Jaipur Hub", vehicle_id=2, driver_id=2, cargo_weight=18000, planned_distance=280, status=TripStatusEnum.DRAFT.value),
            Trip(source="Bengaluru Hub", destination="Chennai Port", vehicle_id=3, driver_id=3, cargo_weight=12000, planned_distance=350, status=TripStatusEnum.DISPATCHED.value)
        ]
        session.add_all(trips)
        
        # Emulate active constraints for the Dispatched trip
        vehicle_3 = await session.get(Vehicle, 3)
        driver_3 = await session.get(Driver, 3)
        vehicle_3.status = VehicleStatusEnum.ON_TRIP.value
        driver_3.status = DriverStatusEnum.ON_TRIP.value
        
        await session.commit()
        
    print("Database seeding completed successfully. Evaluator environment is ready!")

if __name__ == "__main__":
    asyncio.run(seed_db())
