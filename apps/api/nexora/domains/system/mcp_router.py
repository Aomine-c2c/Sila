"""
REST API Router for Model Context Protocol (MCP) Server Management & Tool Execution.

Endpoints:
- GET /companies/{company_id}/mcp/servers - List all registered MCP servers & tool schemas
- POST /companies/{company_id}/mcp/servers - Register custom external MCP server (stdio / sse)
- PATCH /companies/{company_id}/mcp/servers/{server_id}/toggle - Enable or disable an MCP server
- POST /companies/{company_id}/mcp/tools/call - Dispatch an MCP tool call through security sandbox
"""

from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.mcp import (
    MCPServerConfig,
    MCPToolCallRequest,
    MCPToolCallResult,
    mcp_manager,
)
from nexora.core.permissions import require_admin, require_member, require_viewer
from nexora.database import get_db
from nexora.domains.auth.models import User
from nexora.domains.auth.router import get_current_user

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]

router = APIRouter(prefix="/companies/{company_id}/mcp", tags=["Model Context Protocol (MCP)"])


class MCPToggleRequest(BaseModel):
    is_enabled: bool


@router.get("/servers", response_model=list[MCPServerConfig])
async def list_mcp_servers(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_viewer()),
):
    """
    List all available MCP servers (Perplexity, Glif, Chrome, Playwright, Firecrawl, custom)
    including their capabilities, transports, and input tool schemas.
    """
    return mcp_manager.list_servers()


@router.post("/servers", response_model=MCPServerConfig, status_code=status.HTTP_201_CREATED)
async def register_mcp_server(
    company_id: uuid.UUID,
    config: MCPServerConfig,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """Register a new custom MCP server into the organizational runtime."""
    return mcp_manager.register_server(config)


@router.patch("/servers/{server_id}/toggle")
async def toggle_mcp_server(
    company_id: uuid.UUID,
    server_id: str,
    req: MCPToggleRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """Enable or disable an MCP server across all organizational agents."""
    success = mcp_manager.toggle_server(server_id, req.is_enabled)
    if not success:
        from nexora.exceptions import NotFoundError
        raise NotFoundError(f"MCP server '{server_id}' not found.")
    return {"server_id": server_id, "is_enabled": req.is_enabled}


@router.post("/tools/call", response_model=MCPToolCallResult)
async def call_mcp_tool(
    company_id: uuid.UUID,
    req: MCPToolCallRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    """
    Executes a tool on a registered MCP server.
    Enforces SSRF prevention, parameter validation, and telemetry tracking.
    """
    req.company_id = company_id
    return await mcp_manager.call_tool(req)
