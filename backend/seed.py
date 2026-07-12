import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.role import Role
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def seed_db():
    async with AsyncSessionLocal() as session:
        # Create Roles
        roles = ["fleet_manager", "driver", "safety_officer", "financial_analyst"]
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
            {"email": "manager@transitops.com", "role": "fleet_manager"},
            {"email": "driver@transitops.com", "role": "driver"},
            {"email": "safety@transitops.com", "role": "safety_officer"},
            {"email": "analyst@transitops.com", "role": "financial_analyst"}
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
