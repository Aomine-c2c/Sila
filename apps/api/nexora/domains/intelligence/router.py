"""Intelligence Exchange API router."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.permissions import require_admin, require_member, require_viewer
from nexora.database import get_db
from nexora.domains.auth.models import User
from nexora.domains.auth.router import get_current_user
from nexora.domains.intelligence.schemas import (
    IntelligenceDashboardResponse,
    ModelCreate,
    ModelProviderCreate,
    ModelProviderResponse,
    ModelRequest,
    ModelResponse,
    ModelResponsePayload,
    ModelRoutingPolicyCreate,
    ModelRoutingPolicyResponse,
)
from nexora.domains.intelligence.service import IntelligenceService

router = APIRouter(prefix="/companies/{company_id}/intelligence", tags=["Intelligence Exchange"])

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


# ── Intelligence Dashboard ───────────────────────────────────────────────────


@router.get("/dashboard", response_model=IntelligenceDashboardResponse)
async def get_dashboard(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_viewer()),
):
    """Retrieve the Intelligence Exchange metrics, costs, models, and routing decisions."""
    return await IntelligenceService(db).get_dashboard(company_id)


# ── Vendor Agnostic Generation & Capability Routing ─────────────────────────


@router.post("/generate", response_model=ModelResponsePayload)
async def generate_response(
    company_id: uuid.UUID,
    body: ModelRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    """
    Route an intelligence request through capability matching,
    cost/latency/privacy constraints, and fallback chains.
    """
    return await IntelligenceService(db).execute_request(company_id, body)


# ── Model & Provider Catalog ────────────────────────────────────────────────


@router.get("/providers", response_model=list[ModelProviderResponse])
async def list_providers(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_viewer()),
):
    """List registered intelligence providers (Gemini, Claude, OpenAI, Local, etc.)."""
    providers = await IntelligenceService(db).list_providers()
    return providers


@router.post("/providers", response_model=ModelProviderResponse, status_code=status.HTTP_201_CREATED)
async def add_provider(
    company_id: uuid.UUID,
    body: ModelProviderCreate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """Register a new AI provider (e.g. self-hosted cluster or newly released vendor)."""
    return await IntelligenceService(db).add_provider(body)


@router.get("/models", response_model=list[ModelResponse])
async def list_models(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_viewer()),
):
    """List all models registered with metadata (context, costs, latency, privacy)."""
    models = await IntelligenceService(db).list_models()
    return models


@router.post("/models", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def add_model(
    company_id: uuid.UUID,
    body: ModelCreate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """Register a new model specification under an existing provider."""
    return await IntelligenceService(db).add_model(body)
