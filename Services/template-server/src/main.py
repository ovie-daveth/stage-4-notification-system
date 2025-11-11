# FastAPI entry point for the Template Service

from fastapi import FastAPI
from src.api.routes_templates import router as template_router
from src.api.routes_health import router as health_router
from src.models.template_model import Base
from src.core.database import engine

# Initialize FastAPI application
app = FastAPI(title="Template Service")

# Register routes
app.include_router(template_router)
app.include_router(health_router)

@app.on_event("startup")
async def startup():
    """Create database tables automatically on startup"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
