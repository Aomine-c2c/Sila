"""Pydantic schemas for the Intelligence Exchange."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Provider & Model Metadata Schemas ─────────────────────────────────────────


class ModelProviderCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    display_name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    website_url: str | None = None
    is_local: bool = False


class ModelProviderResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    display_name: str
    description: str | None
    website_url: str | None
    is_active: bool
    is_local: bool
    is_healthy: bool
    consecutive_failures: int
    last_health_check_at: datetime | None
    created_at: datetime


class ModelCreate(BaseModel):
    provider_id: uuid.UUID
    model_identifier: str = Field(min_length=2, max_length=150)
    display_name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    capabilities: list[str] = Field(default_factory=lambda: ["reasoning", "text"])
    modalities: list[str] = Field(default_factory=lambda: ["text"])
    tool_support: bool = True
    structured_output_support: bool = True
    context_capacity: int = 128000
    max_output_tokens: int = 4096
    input_cost_per_million: float = 2.50
    output_cost_per_million: float = 10.00
    avg_latency_ms: float = 600.0
    availability_rate: float = 0.999
    privacy_classification: str = "PUBLIC_CLOUD"


class ModelResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    provider_id: uuid.UUID
    model_identifier: str
    display_name: str
    description: str | None
    capabilities: list[str]
    modalities: list[str]
    tool_support: bool
    structured_output_support: bool
    context_capacity: int
    max_output_tokens: int
    input_cost_per_million: float
    output_cost_per_million: float
    avg_latency_ms: float
    availability_rate: float
    privacy_classification: str
    is_active: bool
    created_at: datetime


# ── Routing Policy Schemas ───────────────────────────────────────────────────


class ModelRoutingPolicyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    strategy: str = "BALANCED"  # BALANCED | LOWEST_COST | LOWEST_LATENCY | HIGHEST_CAPABILITY | STRICT_PRIVACY
    max_cost_per_query_usd: float = 0.50
    max_acceptable_latency_ms: float = 5000.0
    required_privacy_level: str | None = None
    fallback_chain: list[str] = Field(default_factory=lambda: ["claude-3-5-sonnet", "gemini-1.5-pro", "local-deepseek-r1"])
    capability_preferences: dict[str, str] = Field(default_factory=dict)
    is_default: bool = False


class ModelRoutingPolicyResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    description: str | None
    strategy: str
    max_cost_per_query_usd: float
    max_acceptable_latency_ms: float
    required_privacy_level: str | None
    fallback_chain: list[str]
    capability_preferences: dict
    is_default: bool
    created_at: datetime


# ── Execution / Request & Response Schemas ───────────────────────────────────


class ModelRequest(BaseModel):
    """
    Standard vendor-agnostic request format for organizational intelligence.
    Agents express needs in terms of capabilities, with optional provider preferences or overrides.
    """
    prompt: str = Field(min_length=1)
    system_prompt: str | None = None
    required_capabilities: list[str] = Field(default_factory=lambda: ["reasoning"])
    context_tokens_needed: int = 4000
    preferred_provider: str | None = None
    preferred_model: str | None = None
    allow_fallback: bool = True
    max_acceptable_cost_usd: float | None = None
    required_privacy: str | None = None
    temperature: float = 0.7
    max_tokens: int = 4096


class ModelResponsePayload(BaseModel):
    """Normalized response payload delivered back to organizational agents."""
    text: str
    model_used: str
    provider_used: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    latency_ms: float
    routed_via_fallback: bool = False
    fallback_reason: str | None = None


# ── Dashboard & Analytics Schemas ───────────────────────────────────────────


class IntelligenceDashboardResponse(BaseModel):
    total_requests: int
    total_tokens_consumed: int
    total_spend_usd: float
    avg_latency_ms: float
    overall_success_rate: float
    providers_count: int
    models_count: int
    healthy_providers_count: int
    recent_routing_decisions: list[dict] = Field(default_factory=list)
    available_providers: list[ModelProviderResponse] = Field(default_factory=list)
    available_models: list[ModelResponse] = Field(default_factory=list)
