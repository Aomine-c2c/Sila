"""Tests for the Workflows domain."""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestWorkflows:
    async def test_create_workflow_draft(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/workflows",
            json={
                "name": "Onboarding Workflow",
                "trigger_type": "MANUAL",
                "steps": [
                    {"id": "step1", "type": "agent_run", "name": "Welcome Email", "config": {}},
                    {"id": "step2", "type": "human_approval", "name": "Manager Review", "config": {}},
                ],
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Onboarding Workflow"
        assert data["status"] == "DRAFT"
        assert len(data["steps"]) == 2

    async def test_cannot_activate_empty_workflow(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        create = await client.post(
            f"/api/v1/companies/{company_id}/workflows",
            json={"name": "Empty Workflow"},
            headers=auth_headers,
        )
        workflow_id = create.json()["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/workflows/{workflow_id}/activate",
            headers=auth_headers,
        )
        assert resp.status_code == 400

    async def test_activate_workflow_with_steps(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]
        create = await client.post(
            f"/api/v1/companies/{company_id}/workflows",
            json={
                "name": "Ready Workflow",
                "steps": [{"id": "s1", "type": "agent_run", "name": "Do work"}],
            },
            headers=auth_headers,
        )
        workflow_id = create.json()["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/workflows/{workflow_id}/activate",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "ACTIVE"
