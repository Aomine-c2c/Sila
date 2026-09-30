"""Tests for the Workflows domain."""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestWorkflows:
    async def test_create_workflow_draft(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/workflows",
            json={
                "name": "Onboarding Workflow",
                "trigger_type": "MANUAL",
                "steps": [
                    {"id": "step1", "type": "agent_run", "name": "Welcome Email", "config": {}},
                    {
                        "id": "step2",
                        "type": "human_approval",
                        "name": "Manager Review",
                        "config": {},
                    },
                ],
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Onboarding Workflow"
        assert data["status"] == "DRAFT"
        assert len(data["steps"]) == 2

    async def test_cannot_activate_empty_workflow(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
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

    async def test_activate_workflow_with_steps(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
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

    async def test_trigger_and_observe_canonical_pipeline(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        create = await client.post(
            f"/api/v1/companies/{company_id}/workflows",
            json={
                "name": "Software Requirement Pipeline",
                "trigger_type": "MANUAL",
                "steps": [
                    {"id": "step1", "type": "AGENT", "name": "Product Agent Analyzes", "config": {"agent": "Product Agent"}},
                    {"id": "step2", "type": "PARALLEL", "name": "Engineers Implement", "config": {"tasks": [{"name": "Backend"}, {"name": "Frontend"}]}},
                    {"id": "step3", "type": "TOOL", "name": "QA Tests", "config": {"tool_name": "pytest_runner"}},
                    {"id": "step4", "type": "APPROVAL", "name": "CTO Deployment Gate", "config": {"risk_level": "HIGH"}},
                ],
            },
            headers=auth_headers,
        )
        assert create.status_code == 201
        workflow_id = create.json()["id"]

        # Trigger execution
        exec_resp = await client.post(
            f"/api/v1/companies/{company_id}/workflows/{workflow_id}/execute",
            json={
                "title": "Feature Requirement Run #1",
                "input_payload": {"spec": "User audit logging"},
            },
            headers=auth_headers,
        )
        assert exec_resp.status_code == 201
        exec_data = exec_resp.json()
        assert exec_data["title"] == "Feature Requirement Run #1"
        assert exec_data["total_steps"] == 4
        # Since step4 is an APPROVAL gate, execution should pause at step4
        assert exec_data["status"] == "WAITING_APPROVAL"
        assert exec_data["current_step_id"] == "step4"
        assert exec_data["pending_approval_id"] is not None
        assert len(exec_data["step_records"]) >= 4

        # Verify step provenance
        step_names = [sr["step_name"] for sr in exec_data["step_records"]]
        assert "Product Agent Analyzes" in step_names
        assert "Engineers Implement" in step_names
        assert "QA Tests" in step_names
        assert "CTO Deployment Gate" in step_names

