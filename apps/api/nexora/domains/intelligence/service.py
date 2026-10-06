"""
Intelligence Service & Repository.
Manages providers, models, routing policies, seed data, and dashboard aggregation.
"""

import uuid
from datetime import UTC

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.intelligence.models import (
    Model,
    ModelProvider,
    ModelRequestLog,
    ModelRoutingPolicy,
)
from nexora.domains.intelligence.router_service import IntelligenceRouter
from nexora.domains.intelligence.schemas import (
    IntelligenceDashboardResponse,
    ModelCreate,
    ModelProviderCreate,
    ModelProviderResponse,
    ModelRequest,
    ModelResponse,
    ModelResponsePayload,
    ProviderProbeRequest,
    ProviderProbeResponse,
)
from nexora.exceptions import NotFoundError


class IntelligenceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.router = IntelligenceRouter(db)

    async def seed_default_providers_if_empty(self) -> None:
        """Seed initial models for Google Gemini, Anthropic Claude, OpenAI, and Local."""
        count = await self.db.scalar(select(func.count(ModelProvider.id)))
        if count and count > 0:
            return

        # 1. OpenAI
        p_openai = ModelProvider(
            name="openai",
            display_name="OpenAI",
            description="Frontier LLMs (GPT-4o, o1, o3-mini)",
            website_url="https://openai.com",
            is_healthy=True,
        )
        self.db.add(p_openai)
        await self.db.flush()

        m_gpt4o = Model(
            provider_id=p_openai.id,
            model_identifier="gpt-4o",
            display_name="GPT-4o",
            capabilities=["reasoning", "code_generation", "vision", "agentic", "text"],
            context_capacity=128000,
            input_cost_per_million=2.50,
            output_cost_per_million=10.00,
            avg_latency_ms=450.0,
            privacy_classification="PUBLIC_CLOUD",
        )
        self.db.add(m_gpt4o)

        # 2. Anthropic
        p_anthropic = ModelProvider(
            name="anthropic",
            display_name="Anthropic",
            description="Claude family of safety and reasoning models",
            website_url="https://anthropic.com",
            is_healthy=True,
        )
        self.db.add(p_anthropic)
        await self.db.flush()

        m_claude = Model(
            provider_id=p_anthropic.id,
            model_identifier="claude-3-5-sonnet",
            display_name="Claude 3.5 Sonnet",
            capabilities=[
                "reasoning",
                "architectural_reasoning",
                "code_generation",
                "analysis",
                "text",
            ],
            context_capacity=200000,
            input_cost_per_million=3.00,
            output_cost_per_million=15.00,
            avg_latency_ms=620.0,
            privacy_classification="PUBLIC_CLOUD",
        )
        self.db.add(m_claude)

        # 3. Google Gemini
        p_gemini = ModelProvider(
            name="google_gemini",
            display_name="Google Gemini",
            description="Multimodal frontier intelligence with massive 2M+ context windows",
            website_url="https://ai.google.dev",
            is_healthy=True,
        )
        self.db.add(p_gemini)
        await self.db.flush()

        m_gemini = Model(
            provider_id=p_gemini.id,
            model_identifier="gemini-1.5-pro",
            display_name="Gemini 1.5 Pro",
            capabilities=["reasoning", "large_context", "multimodal", "analysis", "text"],
            context_capacity=2000000,
            input_cost_per_million=1.25,
            output_cost_per_million=5.00,
            avg_latency_ms=380.0,
            privacy_classification="PUBLIC_CLOUD",
        )
        self.db.add(m_gemini)

        # 4. Local / Self-hosted
        p_local = ModelProvider(
            name="local",
            display_name="Local / Air-Gapped",
            description="On-premise zero-retention self-hosted models (DeepSeek-R1, Llama 3)",
            is_local=True,
            is_healthy=True,
        )
        self.db.add(p_local)
        await self.db.flush()

        m_deepseek = Model(
            provider_id=p_local.id,
            model_identifier="local-deepseek-r1",
            display_name="DeepSeek-R1 Local",
            capabilities=["reasoning", "code_generation", "privacy", "text"],
            context_capacity=64000,
            input_cost_per_million=0.0,
            output_cost_per_million=0.0,
            avg_latency_ms=750.0,
            privacy_classification="ON_PREMISE_ZERO_RETENTION",
        )
        self.db.add(m_deepseek)
        await self.db.flush()

    # ── Providers & Models CRUD ────────────────────────────────────────────────

    async def list_providers(self) -> list[ModelProvider]:
        await self.seed_default_providers_if_empty()
        result = await self.db.execute(
            select(ModelProvider).where(ModelProvider.is_active.is_(True))
        )
        return list(result.scalars().all())

    async def list_models(self) -> list[Model]:
        await self.seed_default_providers_if_empty()
        result = await self.db.execute(select(Model).where(Model.is_active.is_(True)))
        return list(result.scalars().all())

    async def add_provider(self, data: ModelProviderCreate) -> ModelProvider:
        p = ModelProvider(**data.model_dump())
        self.db.add(p)
        await self.db.flush()
        await self.db.refresh(p)
        return p

    async def add_model(self, data: ModelCreate) -> Model:
        provider = await self.db.get(ModelProvider, data.provider_id)
        if not provider:
            raise NotFoundError(f"Provider {data.provider_id} not found.")
        m = Model(**data.model_dump())
        self.db.add(m)
        await self.db.flush()
        await self.db.refresh(m)
        return m

    # ── Policy Management ──────────────────────────────────────────────────────

    async def get_policy(self, company_id: uuid.UUID):
        return await self.router.get_or_create_default_policy(company_id)

    async def update_policy(self, company_id: uuid.UUID, data) -> ModelRoutingPolicy:
        policy = await self.router.get_or_create_default_policy(company_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(policy, key, value)
        await self.db.flush()
        await self.db.refresh(policy)
        return policy

    # ── Routing Execution ──────────────────────────────────────────────────────

    async def execute_request(
        self,
        company_id: uuid.UUID,
        request: ModelRequest,
        agent_id: uuid.UUID | None = None,
        task_id: uuid.UUID | None = None,
    ) -> ModelResponsePayload:
        await self.seed_default_providers_if_empty()
        return await self.router.route_and_execute(
            company_id=company_id,
            request=request,
            agent_id=agent_id,
            task_id=task_id,
        )

    # ── Dashboard & Analytics ──────────────────────────────────────────────────

    async def get_dashboard(self, company_id: uuid.UUID) -> IntelligenceDashboardResponse:
        await self.seed_default_providers_if_empty()
        providers = await self.list_providers()
        models = await self.list_models()

        import sqlalchemy as sa

        # Telemetry aggregations
        q_stats = select(
            func.count(ModelRequestLog.id),
            func.coalesce(func.sum(ModelRequestLog.total_tokens), 0),
            func.coalesce(func.sum(ModelRequestLog.estimated_cost_usd), 0.0),
            func.coalesce(func.avg(ModelRequestLog.latency_ms), 0.0),
            func.coalesce(func.avg(sa.cast(ModelRequestLog.success, sa.Integer)), 1.0),
        ).where(ModelRequestLog.company_id == company_id)
        stats_res = await self.db.execute(q_stats)
        row = stats_res.one()

        # Recent routing decisions
        q_logs = (
            select(ModelRequestLog)
            .where(ModelRequestLog.company_id == company_id)
            .order_by(desc(ModelRequestLog.created_at))
            .limit(10)
        )
        logs_res = await self.db.execute(q_logs)
        recent_logs = [
            {
                "id": str(l.id),
                "requested_capability": l.requested_capability,
                "provider": l.selected_provider_name,
                "model": l.selected_model_identifier,
                "cost_usd": l.estimated_cost_usd,
                "latency_ms": l.latency_ms,
                "routed_tier": getattr(l, "routed_tier", "PRIMARY"),
                "fallback": l.routed_via_fallback,
                "fallback_reason": l.fallback_reason,
                "attempts_count": getattr(l, "attempts_count", 1),
                "routing_trace": getattr(l, "routing_trace", []),
                "circuit_breaker_status": getattr(l, "circuit_breaker_status", "CLOSED"),
                "success": l.success,
                "created_at": l.created_at.isoformat(),
            }
            for l in logs_res.scalars().all()
        ]

        healthy_count = sum(1 for p in providers if p.is_healthy)

        return IntelligenceDashboardResponse(
            total_requests=row[0],
            total_tokens_consumed=int(row[1]),
            total_spend_usd=float(row[2]),
            avg_latency_ms=float(row[3]),
            overall_success_rate=float(row[4]),
            providers_count=len(providers),
            models_count=len(models),
            healthy_providers_count=healthy_count,
            recent_routing_decisions=recent_logs,
            available_providers=[ModelProviderResponse.model_validate(p) for p in providers],
            available_models=[ModelResponse.model_validate(m) for m in models],
        )

    # ── Live Health & Latency Probing ──────────────────────────────────────────

    async def probe_provider(
        self,
        provider_name: str,
        probe_req: ProviderProbeRequest,
    ) -> ProviderProbeResponse:
        """
        Actively probes an AI vendor adapter to measure real-time latency,
        verify circuit breaker state, and optionally test fault tolerance via error injection.
        """
        await self.seed_default_providers_if_empty()
        import time
        from datetime import datetime

        # Find provider in database
        q = select(ModelProvider).where(ModelProvider.name == provider_name)
        res = await self.db.execute(q)
        provider = res.scalar_one_or_none()
        if not provider:
            raise NotFoundError(f"Provider '{provider_name}' not found.")

        adapter = self.router.registry.get(provider.name)
        if not adapter:
            raise NotFoundError(f"No active adapter registered for provider '{provider_name}'.")

        # Fast-fail check if circuit breaker is already OPEN
        if not adapter.circuit_breaker.can_execute():
            return ProviderProbeResponse(
                provider=provider.name,
                display_name=provider.display_name,
                is_healthy=False,
                latency_ms=0.0,
                circuit_breaker_status=adapter.circuit_breaker.state.value,
                consecutive_failures=provider.consecutive_failures,
                message=f"Fast-failed: Circuit breaker is {adapter.circuit_breaker.state.value} due to consecutive failures.",
                timestamp=datetime.now(UTC),
            )

        start_time = time.perf_counter()

        # Handle chaos / error simulation
        if probe_req.simulate_error:
            adapter.circuit_breaker.record_failure()
            provider.consecutive_failures += 1
            if provider.consecutive_failures >= adapter.circuit_breaker.failure_threshold:
                provider.is_healthy = False
            await self.db.flush()

            sim_latency = round((time.perf_counter() - start_time) * 1000 + 45.0, 2)
            err_type = probe_req.simulate_error.lower()
            return ProviderProbeResponse(
                provider=provider.name,
                display_name=provider.display_name,
                is_healthy=provider.is_healthy,
                latency_ms=sim_latency,
                circuit_breaker_status=adapter.circuit_breaker.state.value,
                consecutive_failures=provider.consecutive_failures,
                message=f"Simulated {err_type.upper()} fault recorded. Failure count: {provider.consecutive_failures}/{adapter.circuit_breaker.failure_threshold}",
                timestamp=datetime.now(UTC),
            )

        try:
            # Dispatch lightweight ping request
            test_req = ModelRequest(
                prompt="Ping healthcheck",
                context_tokens_needed=10,
                timeout_seconds=probe_req.timeout_seconds,
            )
            # Find default model for provider
            q_m = select(Model).where(Model.provider_id == provider.id, Model.is_active.is_(True))
            res_m = await self.db.execute(q_m)
            model = res_m.scalars().first()
            model_id = model.model_identifier if model else f"{provider.name}-default"

            await adapter.generate_response(model_id, test_req, {})

            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Record success on circuit breaker & database
            adapter.circuit_breaker.record_success()
            provider.consecutive_failures = 0
            provider.is_healthy = True
            await self.db.flush()

            return ProviderProbeResponse(
                provider=provider.name,
                display_name=provider.display_name,
                is_healthy=True,
                latency_ms=latency_ms,
                circuit_breaker_status=adapter.circuit_breaker.state.value,
                consecutive_failures=0,
                message=f"Probe successful ({latency_ms}ms). Provider is online and healthy.",
                timestamp=datetime.now(UTC),
            )

        except Exception as e:
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            adapter.circuit_breaker.record_failure()
            provider.consecutive_failures += 1
            if provider.consecutive_failures >= adapter.circuit_breaker.failure_threshold:
                provider.is_healthy = False
            await self.db.flush()

            return ProviderProbeResponse(
                provider=provider.name,
                display_name=provider.display_name,
                is_healthy=provider.is_healthy,
                latency_ms=latency_ms,
                circuit_breaker_status=adapter.circuit_breaker.state.value,
                consecutive_failures=provider.consecutive_failures,
                message=f"Probe failed: {str(e)}",
                timestamp=datetime.now(UTC),
            )

