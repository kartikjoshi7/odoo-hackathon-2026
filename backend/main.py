from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Starting up TransitOps API...")
    yield
    # Shutdown actions
    print("Shutting down TransitOps API...")
    await engine.dispose()

app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform backend.",
    version="1.0.0",
    lifespan=lifespan
)

# TODO: Include future modular routers here
# app.include_router(some_router, prefix="/api/v1/module")

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
