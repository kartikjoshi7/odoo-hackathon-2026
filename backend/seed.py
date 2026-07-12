import asyncio
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.models.fuel import FuelLog
from app.models.expense import Expense
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def seed_db():
    print("🚀 Dropping and recreating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Create Roles
        print("👤 Seeding Roles and Users...")
        roles = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]
        role_map = {}
        for r_name in roles:
            result = await session.execute(select(Role).where(Role.name == r_name))
            role = result.scalar_one_or_none()
            if not role:
                role = Role(name=r_name)
                session.add(role)
                await session.commit()
                await session.refresh(role)
            role_map[r_name] = role.id

        # 2. Create Preset Users
        presets = [
            {"email": "manager@transitops.com", "role": "Fleet Manager"},
            {"email": "driver@transitops.com", "role": "Driver"},
            {"email": "safety@transitops.com", "role": "Safety Officer"},
            {"email": "analyst@transitops.com", "role": "Financial Analyst"}
        ]

        for p in presets:
            result = await session.execute(select(User).where(User.email == p["email"]))
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    email=p["email"],
                    password_hash=get_password_hash("password"),
                    role_id=role_map[p["role"]]
                )
                session.add(user)
        
        await session.commit()

        # 3. Create Demo Vehicles (Ensuring we hit different regions for the UI charts)
        print("🚛 Seeding Fleet Assets...")
        v1 = Vehicle(registration_number="GJ-06-AB-1234", model="Tata Signa 4825.T", type="Heavy", max_load_capacity=25000, odometer=12500, acquisition_cost=Decimal('4500000'), region="North", status="Available")
        v2 = Vehicle(registration_number="MH-01-CD-5555", model="Ashok Leyland Dost+", type="Light", max_load_capacity=1500, odometer=8000, acquisition_cost=Decimal('850000'), region="South", status="On Trip")
        v3 = Vehicle(registration_number="DL-04-ZZ-1111", model="Mahindra Blazo", type="Heavy", max_load_capacity=28000, odometer=54000, acquisition_cost=Decimal('4200000'), region="East", status="In Shop")
        
        session.add_all([v1, v2, v3])
        await session.commit()

        # 4. Create Demo Drivers
        d1 = Driver(name="Ramesh Kumar", license_number="DL-142020", phone="+919876543210", status="Available")
        d2 = Driver(name="Suresh Singh", license_number="GJ-552021", phone="+919876543211", status="On Trip")
        
        session.add_all([d1, d2])
        await session.commit()

        # 5. Create active conditions (A Trip and a Maintenance Log)
        print("📊 Seeding Active Operations & Analytics...")
        t1 = Trip(vehicle_id=v2.id, driver_id=d2.id, origin="Mumbai", destination="Pune", distance_km=150, estimated_revenue=Decimal('15000'), status="In Progress")
        session.add(t1)

        m1 = MaintenanceLog(vehicle_id=v3.id, description="Transmission Overhaul", cost=Decimal('25000'), status="Open")
        session.add(m1)

        await session.commit()

        print("🏆 Database successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed_db())