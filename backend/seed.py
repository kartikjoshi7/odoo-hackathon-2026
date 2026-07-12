import asyncio
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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Create Roles
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

        # Create Preset Users
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
        print("Database successfully seeded with default roles and preset users!")

if __name__ == "__main__":
    asyncio.run(seed_db())
