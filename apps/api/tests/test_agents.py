"""Tests for the Agents domain."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestAgents:
    async def test_create_agent(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/agents",
            json={
                "name": "Research Agent",
                "autonomy": "SUPERVISED",
                "capabilities": ["web_search", "summarize"],
                "system_instructions": "You are a research assistant.",
                "intelligence_config": {
                    "provider": "openai",
                    "model": "gpt-4o",
                    "temperature": 0.3,
                },
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Research Agent"
        assert data["autonomy"] == "SUPERVISED"
        assert "web_search" in data["capabilities"]
        assert data["status"] == "ACTIVE"

    async def test_list_agents(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        await client.post(f"/api/v1/companies/{company_id}/agents",
            json={"name": "Agent A"}, headers=auth_headers)
        await client.post(f"/api/v1/companies/{company_id}/agents",
            json={"name": "Agent B"}, headers=auth_headers)
        resp = await client.get(f"/api/v1/companies/{company_id}/agents", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_update_agent(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        create = await client.post(f"/api/v1/companies/{company_id}/agents",
            json={"name": "Original"}, headers=auth_headers)
        agent_id = create.json()["id"]
        resp = await client.patch(
            f"/api/v1/companies/{company_id}/agents/{agent_id}",
            json={"autonomy": "AUTONOMOUS", "name": "Updated"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["autonomy"] == "AUTONOMOUS"
        assert resp.json()["name"] == "Updated"

    async def test_delete_agent(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        create = await client.post(f"/api/v1/companies/{company_id}/agents",
            json={"name": "ToDelete"}, headers=auth_headers)
        agent_id = create.json()["id"]
        del_resp = await client.delete(
            f"/api/v1/companies/{company_id}/agents/{agent_id}", headers=auth_headers)
        assert del_resp.status_code == 204
        get_resp = await client.get(
            f"/api/v1/companies/{company_id}/agents/{agent_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    async def test_agent_not_found(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        fake_id = "00000000-0000-0000-0000-000000000000"
        resp = await client.get(
            f"/api/v1/companies/{company_id}/agents/{fake_id}", headers=auth_headers)
        assert resp.status_code == 404

    async def test_agent_default_autonomy(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        resp = await client.post(f"/api/v1/companies/{company_id}/agents",
            json={"name": "Default Agent"}, headers=auth_headers)
        assert resp.json()["autonomy"] == "SUPERVISED"

    async def test_agent_identity_config(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/agents",
            json={
                "name": "Persona Agent",
                "identity": {
                    "tone": "friendly",
                    "style": "creative",
                    "expertise_areas": ["marketing", "copywriting"],
                },
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["identity"]["tone"] == "friendly"
