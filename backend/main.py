from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from app.core.database import engine
from app.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Starting up TransitOps API...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown actions
    print("Shutting down TransitOps API...")
    await engine.dispose()

from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform backend.",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Explicitly whitelist the exact frontend URLs
origins = [
    "http://localhost:5173",    # Standard Vite React port
    "http://localhost:3000",    # Standard Create React App port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Replaced the wildcard with explicit origins
    allow_credentials=True,     # Allows the Authorization headers to pass
    allow_methods=["*"],  
    allow_headers=["*"],  
)

from app.routers import api_router

# Mount unified application routers
app.include_router(api_router, prefix="/api/v1")

from app.core.sockets import manager

@app.websocket("/api/v1/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the frontend, but we keep the connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint returning system uptime status."""
    return {
        "status": "ok",
        "service": "TransitOps",
        "message": "API is functioning optimally."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
