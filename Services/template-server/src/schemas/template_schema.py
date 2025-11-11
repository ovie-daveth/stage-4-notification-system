# Pydantic models for request/response validation

from pydantic import BaseModel
from datetime import datetime

class TemplateCreate(BaseModel):
    # Fields required to create or update a template
    code: str
    language: str
    content: str
    version: int = 1

class TemplateResponse(BaseModel):
    # Fields returned in API responses
    id: int
    code: str
    language: str
    content: str
    version: int
    created_at: datetime

    class Config:
        orm_mode = True  # Enables ORM object conversion
