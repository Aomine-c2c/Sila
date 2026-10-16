"""
Tests for Model Context Protocol (MCP) Server Integration & Tool Gateway.

Validates:
1. Listing builtin MCP servers (Perplexity, Glif, Chrome, Playwright, Firecrawl)
2. Registering custom MCP server
3. Enabling and disabling MCP servers
4. Dispatching tool executions (perplexity_search, glif_run_workflow, chrome_navigate, playwright_screenshot, firecrawl_scrape_page)
5. Security sandboxing & SSRF protection against forbidden metadata addresses
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


class TestMCPServers:
    async def test_list_builtin_mcp_servers(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        resp = await client.get(
            f"/api/v1/companies/{company_id}/mcp/servers",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        servers = resp.json()
        assert len(servers) >= 5

        server_ids = [s["id"] for s in servers]
        assert "perplexity" in server_ids
        assert "glif" in server_ids
        assert "chrome_devtools" in server_ids
        assert "playwright" in server_ids
        assert "firecrawl" in server_ids

        # Check tool schemas exist
        perp = next(s for s in servers if s["id"] == "perplexity")
        assert len(perp["tools"]) >= 2
        assert any(t["name"] == "perplexity_search" for t in perp["tools"])

    async def test_execute_perplexity_tool(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/mcp/tools/call",
            json={
                "server_id": "perplexity",
                "tool_name": "perplexity_search",
                "arguments": {"query": "Next-gen distributed consensus benchmarks"},
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert len(data["content"]) > 0
        assert "Perplexity Research Findings" in data["content"][0]["text"]
        assert data["duration_ms"] >= 0

    async def test_execute_playwright_tool(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/mcp/tools/call",
            json={
                "server_id": "playwright",
                "tool_name": "playwright_screenshot",
                "arguments": {"url": "https://neiman.internal/dashboard", "full_page": True},
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert "Playwright headless browser" in data["content"][0]["text"]

    async def test_execute_firecrawl_tool(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        resp = await client.post(
            f"/api/v1/companies/{company_id}/mcp/tools/call",
            json={
                "server_id": "firecrawl",
                "tool_name": "firecrawl_scrape_page",
                "arguments": {"url": "https://docs.neiman.ai/overview"},
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert "Documentation Extracted" in data["content"][0]["text"]

    async def test_mcp_ssrf_protection_blocked(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]
        # Attempt SSRF metadata access through Playwright
        resp = await client.post(
            f"/api/v1/companies/{company_id}/mcp/tools/call",
            json={
                "server_id": "playwright",
                "tool_name": "playwright_screenshot",
                "arguments": {"url": "http://169.254.169.254/latest/meta-data/"},
            },
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "BLOCKED"
        assert "Security sandbox violation" in data["error_message"]

    async def test_toggle_and_custom_server_registration(
        self, client: AsyncClient, auth_headers: dict, company_via_api: dict
    ):
        company_id = company_via_api["id"]

        # 1. Toggle glif off
        toggle_off = await client.patch(
            f"/api/v1/companies/{company_id}/mcp/servers/glif/toggle",
            json={"is_enabled": False},
            headers=auth_headers,
        )
        assert toggle_off.status_code == 200
        assert toggle_off.json()["is_enabled"] is False

        # Attempt call on disabled server -> BLOCKED
        blocked_call = await client.post(
            f"/api/v1/companies/{company_id}/mcp/tools/call",
            json={
                "server_id": "glif",
                "tool_name": "glif_generate_asset",
                "arguments": {"prompt": "cyberpunk command center"},
            },
            headers=auth_headers,
        )
        assert blocked_call.status_code == 200
        assert blocked_call.json()["status"] == "BLOCKED"

        # Re-enable glif
        await client.patch(
            f"/api/v1/companies/{company_id}/mcp/servers/glif/toggle",
            json={"is_enabled": True},
            headers=auth_headers,
        )

        # 2. Register custom MCP server
        custom_srv = {
            "id": "internal_postgres_mcp",
            "name": "Internal PostgreSQL MCP",
            "description": "Safe schema inspector and read-only database tool",
            "category": "custom",
            "transport": "sse",
            "endpoint": "http://localhost:8999/sse",
            "env_keys_required": ["PG_CONN_STR"],
            "is_enabled": True,
            "tools": [
                {
                    "name": "pg_inspect_schema",
                    "description": "Inspect table schema definitions",
                    "input_schema": {"type": "object", "properties": {"table": {"type": "string"}}},
                }
            ],
        }
        create_resp = await client.post(
            f"/api/v1/companies/{company_id}/mcp/servers",
            json=custom_srv,
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        created = create_resp.json()
        assert created["id"] == "internal_postgres_mcp"
