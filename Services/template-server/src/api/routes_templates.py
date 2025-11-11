# Defines all CRUD endpoints for templates

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.models.template_model import Template
from src.schemas.template_schema import TemplateCreate, TemplateResponse
from src.core.database import get_db

# Initialize API router
router = APIRouter(prefix="/api/v1/templates", tags=["Templates"])

@router.post("/", response_model=TemplateResponse)
async def create_template(payload: TemplateCreate, db: AsyncSession = Depends(get_db)):
    """Create a new template"""
    result = await db.execute(select(Template).where(Template.code == payload.code))
    if result.scalar():
        raise HTTPException(status_code=400, detail="Template code already exists")
    new_template = Template(**payload.dict())
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template


@router.get("/", response_model=list[TemplateResponse])
async def get_templates(db: AsyncSession = Depends(get_db)):
    """Return list of all templates"""
    result = await db.execute(select(Template))
    return result.scalars().all()


@router.get("/{code}", response_model=TemplateResponse)
async def get_template(code: str, db: AsyncSession = Depends(get_db)):
    """Fetch a single template by its code"""
    result = await db.execute(select(Template).where(Template.code == code))
    template = result.scalar()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{code}", response_model=TemplateResponse)
async def update_template(code: str, payload: TemplateCreate, db: AsyncSession = Depends(get_db)):
    """Update an existing template by code"""
    result = await db.execute(select(Template).where(Template.code == code))
    template = result.scalar()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update fields
    template.language = payload.language
    template.content = payload.content
    template.version = payload.version

    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{code}")
async def delete_template(code: str, db: AsyncSession = Depends(get_db)):
    """Delete a template by code"""
    result = await db.execute(select(Template).where(Template.code == code))
    template = result.scalar()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    await db.delete(template)
    await db.commit()
    return {"success": True, "message": "Template deleted successfully"}
