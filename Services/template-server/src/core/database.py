# Configures async SQLAlchemy database connection

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.core.config import settings

# Create an asynchronous engine
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# Session factory for dependency injection
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

# Dependency to provide DB session in API routes
async def get_db():
    async with SessionLocal() as session:
        yield session
