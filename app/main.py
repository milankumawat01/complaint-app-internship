from fastapi import FastAPI
from app.core.database import engine, Base

app = FastAPI(title="Complaint App API", version="1.0.0")

@app.on_event("startup")
async def startup():
    # For first run only; replace with Alembic migrations immediately after
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health():
    return {"status": "ok"}