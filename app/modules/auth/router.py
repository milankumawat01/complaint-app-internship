from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.modules.auth.models import Admin

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/admin/login")
async def admin_login(email: str, password: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admin).where(Admin.email == email))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not admin.is_active:
        raise HTTPException(status_code=401, detail="Account inactive")
    token = create_access_token({"sub": str(admin.id), "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}