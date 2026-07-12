import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import verify_password

async def test():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == 'manager@transitops.com'))
        user = res.scalar_one_or_none()
        print('User exists:', user is not None)
        if user:
            print('Hash in DB:', repr(user.password_hash))
            print('Password matches:', verify_password('password', user.password_hash))

if __name__ == '__main__':
    asyncio.run(test())
