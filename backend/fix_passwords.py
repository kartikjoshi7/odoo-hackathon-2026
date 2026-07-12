import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def fix():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User))
        users = res.scalars().all()
        h = get_password_hash('password')
        for u in users:
            u.password_hash = h
        session.add_all(users)
        await session.commit()
        print('Fixed passwords for all users!')

if __name__ == '__main__':
    asyncio.run(fix())
