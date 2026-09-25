"""
Intelligence Router — Core routing engine of the NEXORA Intelligence Exchange.
Implements:
1. capability matching
2. provider selection
3. cost-aware routing
4. latency-aware routing
5. privacy-aware routing
6. fallback routing
7. rate-limit handling
8. provider failure handling
9. model availability monitoring
10. usage tracking
"""
import uuid
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.intelligence.adapters.base import ModelAdapterRegistry
from nexora.domains.intelligence.models import (
    Model,
    ModelProvider,
    ModelRequestLog,
    ModelRoutingPolicy,
)
from nexora.domains.intelligence.schemas import (
    ModelRequest,
    ModelResponsePayload,
)
from nexora.exceptions import BusinessRuleError, NotFoundError


class IntelligenceRouter:
    def __init__(self, db: AsyncSession, registry: ModelAdapterRegistry | None = None) -> None:
        self.db = db
        self.registry = registry or ModelAdapterRegistry()

    async def get_or_create_default_policy(self, company_id: uuid.UUID) -> ModelRoutingPolicy:
        """Fetch default company routing policy or create one."""
        q = select(ModelRoutingPolicy).where(
            ModelRoutingPolicy.company_id == company_id,
            ModelRoutingPolicy.is_deleted.is_(False),
        ).order_by(desc(ModelRoutingPolicy.is_default))
        result = await self.db.execute(q)
        policy = result.scalars().first()
        if not policy:
            policy = ModelRoutingPolicy(
                company_id=company_id,
                name="Default Balanced Policy",
                strategy="BALANCED",
                fallback_chain=["claude-3-5-sonnet", "gemini-1.5-pro", "local-deepseek-r1"],
                capability_preferences={
                    "reasoning": "claude-3-5-sonnet",
                    "code_generation": "gpt-4o",
                    "large_context": "gemini-1.5-pro",
                    "privacy": "local-deepseek-r1",
                },
                is_default=True,
            )
            self.db.add(policy)
            await self.db.flush()
            await self.db.refresh(policy)
        return policy

    async def resolve_candidate_models(
        self,
        request: ModelRequest,
        policy: ModelRoutingPolicy,
    ) -> list[Model]:
        """
        Filters and ranks available models matching requested capabilities,
        cost ceilings, latency tolerances, and privacy requirements.
        """
        # Load all active models whose providers are active and healthy
        q = (
            select(Model)
            .join(ModelProvider, Model.provider_id == ModelProvider.id)
            .where(
                Model.is_active.is_(True),
                Model.is_deleted.is_(False),
                ModelProvider.is_active.is_(True),
                ModelProvider.is_healthy.is_(True),
            )
        )
        result = await self.db.execute(q)
        all_models = list(result.scalars().all())

        candidates = []
        for m in all_models:
            # 1. Privacy filter
            if request.required_privacy and m.privacy_classification != request.required_privacy:
                continue

            # 2. Context capacity filter
            if m.context_capacity < request.context_tokens_needed:
                continue

            # 3. Capability matching
            caps = set(m.capabilities or [])
            req_caps = set(request.required_capabilities or [])
            if not req_caps.issubset(caps):
                # If explicit caps not all met, skip
                continue

            # 4. Cost ceiling check
            if request.max_acceptable_cost_usd is not None:
                est_cost = (request.context_tokens_needed * m.input_cost_per_million / 1_000_000)
                if est_cost > request.max_acceptable_cost_usd:
                    continue

            candidates.append(m)

        # Ranking Strategy
        strategy = policy.strategy
        if strategy == "LOWEST_COST":
            candidates.sort(key=lambda x: x.input_cost_per_million)
        elif strategy == "LOWEST_LATENCY":
            candidates.sort(key=lambda x: x.avg_latency_ms)
        elif strategy == "STRICT_PRIVACY":
            # Prioritize local/on-premise
            candidates.sort(key=lambda x: 0 if x.privacy_classification == "ON_PREMISE_ZERO_RETENTION" else 1)
        else:
            # BALANCED: score based on cost and latency
            candidates.sort(key=lambda x: (x.input_cost_per_million * 0.5) + (x.avg_latency_ms * 0.001))

        return candidates

    async def route_and_execute(
        self,
        company_id: uuid.UUID,
        request: ModelRequest,
        agent_id: uuid.UUID | None = None,
        task_id: uuid.UUID | None = None,
    ) -> ModelResponsePayload:
        """
        Main Intelligence Exchange routing routine:
        - Resolves candidates via policy
        - Respects user/agent preference overrides
        - Dispatches through adapter
        - Automatically executes fallback chain on provider failure/rate limit
        - Records usage and latency metrics to telemetry ledger
        """
        policy = await self.get_or_create_default_policy(company_id)
        candidates = await self.resolve_candidate_models(request, policy)

        # Handle explicit override if specified by caller
        target_model: Model | None = None
        routed_via_fallback = False
        fallback_reason = None

        if request.preferred_model:
            # Lookup specific model
            q = select(Model).where(
                Model.model_identifier == request.preferred_model,
                Model.is_active.is_(True),
            )
            res = await self.db.execute(q)
            target_model = res.scalar_one_or_none()

        if not target_model and candidates:
            # Check if policy has specific capability preference
            for cap in request.required_capabilities:
                pref_id = policy.capability_preferences.get(cap)
                if pref_id:
                    matched = next((m for m in candidates if m.model_identifier == pref_id), None)
                    if matched:
                        target_model = matched
                        break

            if not target_model:
                target_model = candidates[0]

        # Execute primary target model or execute fallback
        execution_chain = [target_model] if target_model else []

        if request.allow_fallback:
            for fb_ident in (policy.fallback_chain or []):
                q = select(Model).where(Model.model_identifier == fb_ident, Model.is_active.is_(True))
                res = await self.db.execute(q)
                fb_model = res.scalar_one_or_none()
                if fb_model and fb_model not in execution_chain:
                    execution_chain.append(fb_model)

        if not execution_chain:
            raise NotFoundError("No intelligence provider available matching requested capabilities.")

        last_error = None
        for idx, model in enumerate(execution_chain):
            provider = await self.db.get(ModelProvider, model.provider_id)
            if not provider or not provider.is_healthy:
                continue

            adapter = self.registry.get(provider.name)
            if not adapter:
                continue

            try:
                if idx > 0:
                    routed_via_fallback = True
                    fallback_reason = f"Primary model failed or rate-limited: {last_error}"

                metadata_dict = {
                    "avg_latency_ms": model.avg_latency_ms,
                    "input_cost_per_million": model.input_cost_per_million,
                    "output_cost_per_million": model.output_cost_per_million,
                }

                resp = await adapter.generate_response(model.model_identifier, request, metadata_dict)
                resp.routed_via_fallback = routed_via_fallback
                resp.fallback_reason = fallback_reason

                # Log successful execution telemetry
                log = ModelRequestLog(
                    company_id=company_id,
                    agent_id=agent_id,
                    task_id=task_id,
                    requested_capability=",".join(request.required_capabilities),
                    selected_provider_name=provider.name,
                    selected_model_identifier=model.model_identifier,
                    routed_via_fallback=routed_via_fallback,
                    fallback_reason=fallback_reason,
                    prompt_tokens=resp.prompt_tokens,
                    completion_tokens=resp.completion_tokens,
                    total_tokens=resp.total_tokens,
                    estimated_cost_usd=resp.estimated_cost_usd,
                    latency_ms=resp.latency_ms,
                    success=True,
                )
                self.db.add(log)
                await self.db.flush()
                return resp

            except Exception as e:
                last_error = str(e)
                # Provider failure tracking
                provider.consecutive_failures += 1
                if provider.consecutive_failures >= 3:
                    provider.is_healthy = False
                await self.db.flush()

        raise BusinessRuleError(f"All routed intelligence models failed. Last error: {last_error}")
