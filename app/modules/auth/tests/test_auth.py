import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_admin_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First create an admin in test DB (use a fixture)
        resp = await client.post("/api/v1/auth/admin/login", json={
            "email": "admin@test.com", "password": "correct"
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

@pytest.mark.asyncio
async def test_admin_login_bad_input():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/auth/admin/login", json={"email": "x"})
        assert resp.status_code == 422

@pytest.mark.asyncio
async def test_protected_route_no_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/staff")
        assert resp.status_code == 401