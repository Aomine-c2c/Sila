"""Tests for the authentication domain."""
import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


class TestRegistration:
    async def test_register_success(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePass123!",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert "password_hash" not in data
        assert "id" in data

    async def test_register_duplicate_email(self, client: AsyncClient):
        payload = {"email": "dup@example.com", "username": "dup1", "password": "SecurePass123!"}
        await client.post("/api/v1/auth/register", json=payload)
        payload2 = {"email": "dup@example.com", "username": "dup2", "password": "SecurePass123!"}
        resp = await client.post("/api/v1/auth/register", json=payload2)
        assert resp.status_code == 409

    async def test_register_duplicate_username(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "email": "a@example.com", "username": "taken", "password": "SecurePass123!"
        })
        resp = await client.post("/api/v1/auth/register", json={
            "email": "b@example.com", "username": "taken", "password": "SecurePass123!"
        })
        assert resp.status_code == 409

    async def test_register_invalid_email(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email", "username": "user1", "password": "SecurePass123!"
        })
        assert resp.status_code == 422

    async def test_register_short_password(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "x@example.com", "username": "user2", "password": "short"
        })
        assert resp.status_code == 422

    async def test_register_invalid_username_chars(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "y@example.com", "username": "user name!", "password": "SecurePass123!"
        })
        assert resp.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "email": "login@example.com", "username": "loginuser", "password": "Pass1234!"
        })
        resp = await client.post("/api/v1/auth/login", json={
            "email": "login@example.com", "password": "Pass1234!"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "email": "p@example.com", "username": "puser", "password": "RightPass123!"
        })
        resp = await client.post("/api/v1/auth/login", json={
            "email": "p@example.com", "password": "WrongPass!"
        })
        assert resp.status_code == 401

    async def test_login_unknown_email(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "ghost@example.com", "password": "AnyPass123!"
        })
        assert resp.status_code == 401


class TestMe:
    async def test_me_authenticated(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "alice@example.com"

    async def test_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    async def test_me_invalid_token(self, client: AsyncClient):
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert resp.status_code == 401
