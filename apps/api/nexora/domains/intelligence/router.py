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
    ModelRoutingPolicyResponse,
    ModelRoutingPolicyUpdate,
    ProviderConfigureRequest,
    ProviderConfigureResponse,
    ProviderProbeRequest,
    ProviderProbeResponse,
    TokenCompressionRequest,
    TokenCompressionResponse,
)
from nexora.domains.intelligence.proxy import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    LocalAIProxy,
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


# ── Policy Configuration ─────────────────────────────────────────────────────


@router.get("/policy", response_model=ModelRoutingPolicyResponse)
async def get_routing_policy(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_viewer()),
):
    """Retrieve active routing policy for company."""
    return await IntelligenceService(db).get_policy(company_id)


@router.put("/policy", response_model=ModelRoutingPolicyResponse)
async def update_routing_policy(
    company_id: uuid.UUID,
    body: ModelRoutingPolicyUpdate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """Update active routing policy strategy, budget caps, fallback chain, or capability preferences."""
    return await IntelligenceService(db).update_policy(company_id, body)


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


@router.post("/compress", response_model=TokenCompressionResponse)
async def compress_text(
    company_id: uuid.UUID,
    body: TokenCompressionRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_viewer()),
):
    """
    On-demand algorithmic token compression for prompts, instructions, and context snippets.
    Calculates exact token reduction, compression ratio, and estimated USD savings.
    """
    from datetime import datetime, timezone
    from nexora.core.compression import TokenCompressor
    res = TokenCompressor.compress(body.text, strategy=body.strategy)
    # Average inference input cost benchmark ($2.50 per 1M tokens)
    estimated_cost_saved = round(res.tokens_saved * (2.50 / 1_000_000.0), 6)
    return TokenCompressionResponse(
        original_text=res.original_text,
        compressed_text=res.compressed_text,
        original_tokens=res.original_tokens,
        compressed_tokens=res.compressed_tokens,
        tokens_saved=res.tokens_saved,
        compression_ratio_pct=round(res.compression_ratio_pct, 2),
        strategy_used=res.strategy_used.value,
        estimated_cost_saved_usd=estimated_cost_saved,
        timestamp=datetime.now(timezone.utc),
    )


# ── OpenAI-Compatible Intelligent AI Proxy ──────────────────────────────────


@router.post("/proxy/chat/completions", response_model=ChatCompletionResponse)
async def proxy_chat_completions(
    company_id: uuid.UUID,
    body: ChatCompletionRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    """
    Local AI Proxy endpoint.
    Accepts OpenAI-compatible /v1/chat/completions payloads, applies algorithmic
    token compression to the message history, and routes across providers
    with tiered automatic fallback (PRIMARY -> FALLBACK -> SECONDARY FALLBACK -> LOCAL DEGRADED).
    """
    service = IntelligenceService(db)
    await service.seed_default_providers_if_empty()
    return await LocalAIProxy.process_completion(
        router=service.router,
        company_id=company_id,
        request=body,
    )



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


@router.post(
    "/providers", response_model=ModelProviderResponse, status_code=status.HTTP_201_CREATED
)
async def add_provider(
    company_id: uuid.UUID,
    body: ModelProviderCreate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """Register a new AI provider (e.g. self-hosted cluster or newly released vendor)."""
    return await IntelligenceService(db).add_provider(body)


@router.post(
    "/providers/{provider_name}/configure",
    response_model=ProviderConfigureResponse,
)
async def configure_provider(
    company_id: uuid.UUID,
    provider_name: str,
    body: ProviderConfigureRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """
    Configure a provider's API key (stored encrypted in the vault) or base URL endpoint.
    Automatically queries the provider to discover and register available models.
    """
    return await IntelligenceService(db).configure_provider(provider_name, body)



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


@router.post("/providers/{provider_name}/probe", response_model=ProviderProbeResponse)
async def probe_provider(
    company_id: uuid.UUID,
    provider_name: str,
    body: ProviderProbeRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    """
    Actively probe a vendor adapter, measure round-trip latency,
    and evaluate circuit breaker responses or fault simulations.
    """
    return await IntelligenceService(db).probe_provider(provider_name, body)


@router.post("/circuit-breakers/reset")
async def reset_circuit_breakers(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_admin()),
):
    """Reset all provider circuit breakers and mark providers healthy."""
    service = IntelligenceService(db)
    service.router.registry.reset_circuit_breakers()
    from sqlalchemy import update

    from nexora.domains.intelligence.models import ModelProvider
    await db.execute(update(ModelProvider).values(is_healthy=True, consecutive_failures=0))
    await db.flush()
    return {"status": "ok", "message": "All circuit breakers reset to CLOSED and providers marked healthy."}


