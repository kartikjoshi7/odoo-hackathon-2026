from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user with a hashed password."""
    user_q = await db.execute(select(User).where(User.email == user_in.email))
    if user_q.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    
    # SECURITY PATCH: Privilege Escalation Prevention
    # Ignore the client's requested role_id and force all public signups to be Drivers (role_id=2).
    # Fleet Managers must manually upgrade users in the database if they need higher permissions.
    safe_role_id = 2
    
    db_user = User(
        email=user_in.email,
        password_hash=hashed_password,
        role_id=safe_role_id
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    OAuth2 compatible token login. Get an access token for future requests.
    """
    user_q = await db.execute(select(User).where(User.email == form_data.username))
    user = user_q.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get the currently logged in user details including role."""
    role = await db.get(Role, user.role_id)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.email.split("@")[0].title(), # Frontend expects a name field
        "role": role.name if role else "driver"
    }
