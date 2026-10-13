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
        """Seed the full universal AI provider catalog if empty or missing entries."""
        from nexora.domains.intelligence.catalog import UNIVERSAL_PROVIDER_CATALOG

        result = await self.db.execute(select(ModelProvider))
        existing_providers = {p.name: p for p in result.scalars().all()}

        for item in UNIVERSAL_PROVIDER_CATALOG:
            if item["name"] not in existing_providers:
                p = ModelProvider(
                    name=item["name"],
                    display_name=item["display_name"],
                    description=item.get("description"),
                    website_url=item.get("website_url"),
                    base_url=item.get("base_url"),
                    is_local=item.get("is_local", False),
                    is_configured=bool(item.get("is_local")),
                    is_healthy=bool(item.get("is_local")),
                )
                self.db.add(p)
                existing_providers[item["name"]] = p

        await self.db.flush()

        # Seed initial models if models table is empty
        m_count = await self.db.scalar(select(func.count(Model.id)))
        if not m_count or m_count == 0:
            canonical_models = [
                ("openai", "gpt-4o", "GPT-4o", ["reasoning", "code_generation", "vision", "agentic", "text"], 128000, 2.50, 10.00, 450.0, "PUBLIC_CLOUD"),
                ("anthropic", "claude-3-5-sonnet", "Claude 3.5 Sonnet", ["reasoning", "architectural_reasoning", "code_generation", "analysis", "text"], 200000, 3.00, 15.00, 620.0, "PUBLIC_CLOUD"),
                ("google_gemini", "gemini-1.5-pro", "Gemini 1.5 Pro", ["reasoning", "large_context", "multimodal", "analysis", "text"], 2000000, 1.25, 5.00, 380.0, "PUBLIC_CLOUD"),
                ("local", "local-deepseek-r1", "DeepSeek-R1 Local", ["reasoning", "code_generation", "privacy", "text"], 64000, 0.0, 0.0, 750.0, "ON_PREMISE_ZERO_RETENTION"),
            ]
            for p_name, m_ident, disp, caps, ctx, in_c, out_c, lat, priv in canonical_models:
                p = existing_providers.get(p_name)
                if p:
                    self.db.add(
                        Model(
                            provider_id=p.id,
                            model_identifier=m_ident,
                            display_name=disp,
                            capabilities=caps,
                            context_capacity=ctx,
                            input_cost_per_million=in_c,
                            output_cost_per_million=out_c,
                            avg_latency_ms=lat,
                            privacy_classification=priv,
                        )
                    )
            await self.db.flush()

    # ── Providers & Models CRUD ────────────────────────────────────────────────

    async def list_providers(self) -> list[ModelProviderResponse]:
        await self.seed_default_providers_if_empty()
        from nexora.core.crypto import decrypt_secret, mask_secret

        result = await self.db.execute(
            select(ModelProvider).where(ModelProvider.is_active.is_(True)).order_by(ModelProvider.display_name)
        )
        providers = list(result.scalars().all())

        responses = []
        for p in providers:
            plain_key = decrypt_secret(p.api_key_encrypted) if p.api_key_encrypted else None
            masked = mask_secret(plain_key)
            responses.append(
                ModelProviderResponse(
                    id=p.id,
                    name=p.name,
                    display_name=p.display_name,
                    description=p.description,
                    website_url=p.website_url,
                    base_url=p.base_url,
                    is_configured=p.is_configured,
                    api_key_masked=masked,
                    is_active=p.is_active,
                    is_local=p.is_local,
                    is_healthy=p.is_healthy,
                    consecutive_failures=p.consecutive_failures,
                    last_health_check_at=p.last_health_check_at,
                    created_at=p.created_at,
                )
            )
        return responses

    async def list_models(self) -> list[Model]:
        await self.seed_default_providers_if_empty()
        result = await self.db.execute(select(Model).where(Model.is_active.is_(True)))
        return list(result.scalars().all())

    async def add_provider(self, data: ModelProviderCreate) -> ModelProvider:
        from nexora.core.crypto import encrypt_secret
        enc_key = encrypt_secret(data.api_key) if data.api_key else None
        p = ModelProvider(
            name=data.name,
            display_name=data.display_name,
            description=data.description,
            website_url=data.website_url,
            base_url=data.base_url,
            api_key_encrypted=enc_key,
            is_configured=bool(data.api_key or (data.base_url and data.is_local)),
            is_local=data.is_local,
            is_healthy=bool(data.api_key or data.is_local),
        )
        self.db.add(p)
        await self.db.flush()
        await self.db.refresh(p)
        return p

    async def configure_provider(
        self, provider_name: str, config: "ProviderConfigureRequest"
    ) -> "ProviderConfigureResponse":
        """
        Configure a provider's API key and/or base URL in the encrypted vault,
        and optionally auto-discover available models.
        """
        from nexora.core.crypto import encrypt_secret, mask_secret
        from nexora.domains.intelligence.discovery import fetch_provider_models
        from nexora.domains.intelligence.schemas import ProviderConfigureResponse

        result = await self.db.execute(
            select(ModelProvider).where(ModelProvider.name == provider_name)
        )
        provider = result.scalars().first()
        if not provider:
            raise NotFoundError(f"Provider '{provider_name}' not found.")

        # Update base URL if provided
        if config.base_url is not None:
            provider.base_url = config.base_url.strip() or None

        # Update API key if provided
        plain_key = None
        if config.api_key is not None:
            plain_key = config.api_key.strip() or None
            provider.api_key_encrypted = encrypt_secret(plain_key)

        provider.is_configured = bool(provider.api_key_encrypted or (provider.base_url and provider.is_local))
        provider.is_healthy = provider.is_configured
        provider.consecutive_failures = 0
        await self.db.flush()

        discovered_count = 0
        discovered_model_ids: list[str] = []

        if config.auto_discover and (plain_key or provider.base_url):
            discovered = await fetch_provider_models(
                provider_name=provider.name,
                base_url=provider.base_url,
                api_key=plain_key,
            )
            # Upsert discovered models
            for item in discovered:
                m_ident = item["model_identifier"]
                discovered_model_ids.append(m_ident)
                q_existing = await self.db.execute(
                    select(Model).where(
                        Model.provider_id == provider.id,
                        Model.model_identifier == m_ident,
                    )
                )
                m = q_existing.scalars().first()
                if not m:
                    m = Model(
                        provider_id=provider.id,
                        model_identifier=m_ident,
                        display_name=item["display_name"],
                        capabilities=item["capabilities"],
                        context_capacity=item["context_capacity"],
                        input_cost_per_million=item["input_cost_per_million"],
                        output_cost_per_million=item["output_cost_per_million"],
                        privacy_classification=item["privacy_classification"],
                    )
                    self.db.add(m)
                discovered_count += 1

            await self.db.flush()

        # Update dynamic adapter in registry
        from nexora.domains.intelligence.adapters.base import GenericOpenAICompatibleAdapter
        self.router.registry.register(
            GenericOpenAICompatibleAdapter(provider_name=provider.name, base_url=provider.base_url)
        )

        return ProviderConfigureResponse(
            provider_name=provider.name,
            display_name=provider.display_name,
            is_configured=provider.is_configured,
            is_healthy=provider.is_healthy,
            base_url=provider.base_url,
            api_key_masked=mask_secret(plain_key),
            discovered_models_count=discovered_count,
            models=discovered_model_ids[:20],
            message=f"Provider '{provider.display_name}' configured successfully. Discovered {discovered_count} models.",
        )

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

