"""Tests for the NEXORA Intelligence Exchange."""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestIntelligenceExchange:
    async def test_list_providers(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        resp = await client.get(
            f"/api/v1/companies/{company_id}/intelligence/providers", headers=auth_headers
        )
        assert resp.status_code == 200
        providers = resp.json()
        assert len(providers) >= 4

        names = [p["name"] for p in providers]
        assert "openai" in names
        assert "anthropic" in names
        assert "google_gemini" in names
        assert "local" in names

    async def test_list_models(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        resp = await client.get(
            f"/api/v1/companies/{company_id}/intelligence/models", headers=auth_headers
        )
        assert resp.status_code == 200
        models = resp.json()
        assert len(models) >= 4

        idents = [m["model_identifier"] for m in models]
        assert "gpt-4o" in idents
        assert "claude-3-5-sonnet" in idents
        assert "gemini-1.5-pro" in idents
        assert "local-deepseek-r1" in idents

    async def test_capability_based_routing(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        # Agent requests "large_context" capability -> router picks gemini-1.5-pro
        resp = await client.post(
            f"/api/v1/companies/{company_id}/intelligence/generate",
            json={
                "prompt": "Analyze this 500-page organizational audit",
                "required_capabilities": ["large_context"],
                "context_tokens_needed": 150000,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider_used"] == "google_gemini"
        assert data["model_used"] == "gemini-1.5-pro"
        assert data["prompt_tokens"] > 0
        assert data["estimated_cost_usd"] > 0

    async def test_privacy_aware_routing(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        # Agent requests on-premise zero retention -> routes to local-deepseek-r1
        resp = await client.post(
            f"/api/v1/companies/{company_id}/intelligence/generate",
            json={
                "prompt": "Classified personnel records evaluation",
                "required_privacy": "ON_PREMISE_ZERO_RETENTION",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider_used"] == "local"
        assert data["model_used"] == "local-deepseek-r1"
        assert data["estimated_cost_usd"] == 0.0  # Zero API cost

    async def test_user_explicit_override(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        # Explicit override overrides capability routing defaults
        resp = await client.post(
            f"/api/v1/companies/{company_id}/intelligence/generate",
            json={
                "prompt": "Design high-resilience organizational taxonomy",
                "preferred_model": "claude-3-5-sonnet",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["model_used"] == "claude-3-5-sonnet"
        assert data["provider_used"] == "anthropic"

    async def test_dashboard_analytics(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        # Generate at least one request
        await client.post(
            f"/api/v1/companies/{company_id}/intelligence/generate",
            json={"prompt": "Dashboard telemetry check"},
            headers=auth_headers,
        )

        dash_resp = await client.get(
            f"/api/v1/companies/{company_id}/intelligence/dashboard", headers=auth_headers
        )
        assert dash_resp.status_code == 200
        dash = dash_resp.json()
        assert dash["total_requests"] >= 1
        assert dash["providers_count"] >= 4
        assert dash["models_count"] >= 4
        assert len(dash["recent_routing_decisions"]) >= 1

    async def test_policy_get_and_update(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        # 1. Get default policy
        get_res = await client.get(
            f"/api/v1/companies/{company_id}/intelligence/policy", headers=auth_headers
        )
        assert get_res.status_code == 200
        pol = get_res.json()
        assert pol["strategy"] == "BALANCED"
        assert len(pol["fallback_chain"]) >= 3

        # 2. Update policy to LOWEST_COST
        put_res = await client.put(
            f"/api/v1/companies/{company_id}/intelligence/policy",
            json={
                "strategy": "LOWEST_COST",
                "max_cost_per_query_usd": 0.25,
                "fallback_chain": ["gemini-1.5-pro", "local-deepseek-r1"],
            },
            headers=auth_headers,
        )
        assert put_res.status_code == 200
        updated = put_res.json()
        assert updated["strategy"] == "LOWEST_COST"
        assert updated["max_cost_per_query_usd"] == 0.25
        assert updated["fallback_chain"] == ["gemini-1.5-pro", "local-deepseek-r1"]

    async def test_preferred_provider_routing(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        # Explicit provider preference: google_gemini
        resp = await client.post(
            f"/api/v1/companies/{company_id}/intelligence/generate",
            json={
                "prompt": "Summarize this strategy briefing",
                "preferred_provider": "google_gemini",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider_used"] == "google_gemini"
        assert data["model_used"] == "gemini-1.5-pro"
