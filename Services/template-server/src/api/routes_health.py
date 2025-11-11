# Health check route for monitoring

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
async def health():
    """Return simple service health status"""
    return {"status": "ok"}
