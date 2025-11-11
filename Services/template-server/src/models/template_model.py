# Defines the Template table schema

from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import declarative_base

# Base class for SQLAlchemy models
Base = declarative_base()

class Template(Base):
    __tablename__ = "templates"

    # Unique ID for each template
    id = Column(Integer, primary_key=True, index=True)

    # Template code used for identification (e.g. welcome_email)
    code = Column(String(100), unique=True, nullable=False)

    # Language for localization (e.g. en, de, fr)
    language = Column(String(10), default="en")

    # Template body content
    content = Column(Text, nullable=False)

    # Version number for tracking updates
    version = Column(Integer, default=1)

    # Timestamp for creation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
