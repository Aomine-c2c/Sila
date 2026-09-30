"""
Intelligence Router — Core routing engine of the NEXORA Intelligence Exchange.
Implements:
1. Provider health & model availability monitoring
2. Circuit breaker state checks & fast-fail protection
3. Rate-limit detection & exponential retry policies
4. Timeout & capability mismatch handling
5. Context-size & cost/token ceiling enforcement
6. Structured output schema validation
7. Four-Tier Fallback Hierarchy:
   PRIMARY -> FALLBACK -> SECONDARY FALLBACK -> LOCAL/DEGRADED MODE
8. Full routing decision ledger logging for future optimization
"""

import asyncio
import logging
import uuid
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.intelligence.adapters.base import (
    ModelAdapterRegistry,
    ProviderRateLimitError,
    ProviderTimeoutError,
    StructuredOutputValidationError,
)
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

logger = logging.getLogger(__name__)

# Global singleton registry so circuit breaker state persists across requests within the process
_SHARED_REGISTRY = ModelAdapterRegistry()


class IntelligenceRouter:
    def __init__(self, db: AsyncSession, registry: ModelAdapterRegistry | None = None) -> None:
        self.db = db
        self.registry = registry or _SHARED_REGISTRY

    async def get_or_create_default_policy(self, company_id: uuid.UUID) -> ModelRoutingPolicy:
        """Fetch default company routing policy or create one."""
        q = (
            select(ModelRoutingPolicy)
            .where(
                ModelRoutingPolicy.company_id == company_id,
                ModelRoutingPolicy.is_deleted.is_(False),
            )
            .order_by(desc(ModelRoutingPolicy.is_default))
        )
        result = await self.db.execute(q)
        policy = result.scalars().first()
        if not policy:
            policy = ModelRoutingPolicy(
                company_id=company_id,
                name="Default Resilient Policy",
                strategy="BALANCED",
                fallback_chain=["claude-3-5-sonnet", "gemini-1.5-pro", "gpt-4o", "local-deepseek-r1"],
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
        Pre-flight checks and filters available models matching requested capabilities,
        context size, cost ceilings, token ceilings, and privacy classification.
        """
        q = (
            select(Model)
            .join(ModelProvider, Model.provider_id == ModelProvider.id)
            .where(
                Model.is_active.is_(True),
                Model.is_deleted.is_(False),
                ModelProvider.is_active.is_(True),
            )
        )
        result = await self.db.execute(q)
        all_models = list(result.scalars().all())

        candidates = []
        for m in all_models:
            # 1. Privacy filter
            if request.required_privacy and m.privacy_classification != request.required_privacy:
                continue

            # 2. Context capacity pre-flight check
            if m.context_capacity < request.context_tokens_needed:
                continue

            # 3. Token ceiling pre-flight check
            if request.token_ceiling and request.context_tokens_needed > request.token_ceiling:
                continue

            # 4. Capability matching
            caps = set(m.capabilities or [])
            req_caps = set(request.required_capabilities or [])
            if not req_caps.issubset(caps):
                continue

            # 5. Cost ceiling check
            if request.max_acceptable_cost_usd is not None:
                est_cost = request.context_tokens_needed * m.input_cost_per_million / 1_000_000
                if est_cost > request.max_acceptable_cost_usd:
                    continue
            elif policy.max_cost_per_query_usd:
                est_cost = request.context_tokens_needed * m.input_cost_per_million / 1_000_000
                if est_cost > policy.max_cost_per_query_usd:
                    continue

            candidates.append(m)

        # Strategy-based ranking
        strategy = policy.strategy
        if strategy == "LOWEST_COST":
            candidates.sort(key=lambda x: x.input_cost_per_million)
        elif strategy == "LOWEST_LATENCY":
            candidates.sort(key=lambda x: x.avg_latency_ms)
        elif strategy == "STRICT_PRIVACY":
            candidates.sort(
                key=lambda x: 0 if x.privacy_classification == "ON_PREMISE_ZERO_RETENTION" else 1
            )
        elif strategy == "HIGHEST_CAPABILITY":
            candidates.sort(key=lambda x: x.context_capacity, reverse=True)
        else:
            # BALANCED
            candidates.sort(
                key=lambda x: (x.input_cost_per_million * 0.5) + (x.avg_latency_ms * 0.001)
            )

        return candidates

    async def construct_fallback_hierarchy(
        self,
        request: ModelRequest,
        policy: ModelRoutingPolicy,
        candidates: list[Model],
    ) -> list[tuple[str, Model]]:
        """
        Builds the 4-tier execution plan:
        1. PRIMARY
        2. FALLBACK
        3. SECONDARY FALLBACK
        4. LOCAL/DEGRADED MODE
        """
        chain: list[tuple[str, Model]] = []
        seen_identifiers = set()

        # Step 1: Select PRIMARY
        primary_model: Model | None = None
        if request.preferred_model:
            q = select(Model).where(
                Model.model_identifier == request.preferred_model, Model.is_active.is_(True)
            )
            res = await self.db.execute(q)
            primary_model = res.scalar_one_or_none()

        if not primary_model and request.preferred_provider:
            q_p = select(ModelProvider).where(
                ModelProvider.name == request.preferred_provider, ModelProvider.is_active.is_(True)
            )
            res_p = await self.db.execute(q_p)
            pref_prov = res_p.scalar_one_or_none()
            if pref_prov:
                primary_model = next((m for m in candidates if m.provider_id == pref_prov.id), None)

        if not primary_model and candidates:
            # Check capability preferences
            for cap in request.required_capabilities:
                pref_id = policy.capability_preferences.get(cap)
                if pref_id:
                    matched = next((m for m in candidates if m.model_identifier == pref_id), None)
                    if matched:
                        primary_model = matched
                        break
            if not primary_model:
                primary_model = candidates[0]

        if primary_model:
            chain.append(("PRIMARY", primary_model))
            seen_identifiers.add(primary_model.model_identifier)

        if not request.allow_fallback:
            return chain

        # Step 2 & 3: FALLBACK and SECONDARY FALLBACK
        fallback_targets = list(policy.fallback_chain or [])
        tier_names = ["FALLBACK", "SECONDARY FALLBACK"]
        tier_idx = 0

        for ident in fallback_targets:
            if ident in seen_identifiers:
                continue
            q = select(Model).where(Model.model_identifier == ident, Model.is_active.is_(True))
            res = await self.db.execute(q)
            fb_model = res.scalar_one_or_none()
            if fb_model:
                if "local" in ident.lower():
                    # Keep local for Tier 4
                    continue
                tier_label = tier_names[tier_idx] if tier_idx < len(tier_names) else "SECONDARY FALLBACK"
                chain.append((tier_label, fb_model))
                seen_identifiers.add(ident)
                tier_idx += 1
                if tier_idx >= 2:
                    break

        # Step 4: Ensure LOCAL/DEGRADED MODE is always available as safety net
        q_local = (
            select(Model)
            .join(ModelProvider, Model.provider_id == ModelProvider.id)
            .where(
                ModelProvider.is_local.is_(True),
                Model.is_active.is_(True),
            )
        )
        res_local = await self.db.execute(q_local)
        local_model = res_local.scalars().first()
        if local_model and local_model.model_identifier not in seen_identifiers:
            chain.append(("LOCAL_DEGRADED", local_model))

        return chain

    async def route_and_execute(
        self,
        company_id: uuid.UUID,
        request: ModelRequest,
        agent_id: uuid.UUID | None = None,
        task_id: uuid.UUID | None = None,
    ) -> ModelResponsePayload:
        """
        Executes real-world multi-provider hardened dispatch.
        Guarantees:
        - Primary -> Fallback -> Secondary Fallback -> Local/Degraded Mode
        - Rate-limit handling with exponential backoff
        - Circuit-breaker state evaluation
        - Structured-output schema verification
        - Comprehensive telemetry logging of every step
        """
        policy = await self.get_or_create_default_policy(company_id)
        candidates = await self.resolve_candidate_models(request, policy)

        # Context-size validation pre-check
        if not candidates and not request.preferred_model:
            # Check if all models failed context size
            q_cap = select(Model).where(Model.is_active.is_(True))
            all_m = (await self.db.execute(q_cap)).scalars().all()
            max_cap = max((m.context_capacity for m in all_m), default=0)
            if request.context_tokens_needed > max_cap:
                raise BusinessRuleError(
                    f"Context capacity overflow: Requested {request.context_tokens_needed} tokens, "
                    f"highest available provider capacity is {max_cap} tokens."
                )

        hierarchy = await self.construct_fallback_hierarchy(request, policy, candidates)
        if not hierarchy:
            raise NotFoundError("No intelligence provider available matching requested capabilities.")

        routing_trace: list[dict[str, Any]] = []
        last_error_reason: str | None = None
        total_attempts = 0

        for tier, model in hierarchy:
            provider = await self.db.get(ModelProvider, model.provider_id)
            if not provider:
                continue

            adapter = self.registry.get(provider.name)
            if not adapter:
                continue

            # Circuit Breaker Check
            if not adapter.circuit_breaker.can_execute():
                trace_entry = {
                    "tier": tier,
                    "provider": provider.name,
                    "model": model.model_identifier,
                    "action": "SKIPPED",
                    "reason": f"Circuit breaker is {adapter.circuit_breaker.state.value}",
                }
                routing_trace.append(trace_entry)
                continue

            # Attempt Execution with Retries for Rate Limits
            max_retries = 2
            for retry_num in range(max_retries):
                total_attempts += 1
                try:
                    metadata_dict = {
                        "avg_latency_ms": model.avg_latency_ms,
                        "input_cost_per_million": model.input_cost_per_million,
                        "output_cost_per_million": model.output_cost_per_million,
                    }

                    # Execute generation
                    resp = await adapter.generate_response(
                        model.model_identifier, request, metadata_dict
                    )

                    # Success! Register with circuit breaker and provider health
                    adapter.circuit_breaker.record_success()
                    provider.consecutive_failures = 0
                    provider.is_healthy = True

                    routed_via_fallback = tier != "PRIMARY"
                    resp.routed_tier = tier
                    resp.routed_via_fallback = routed_via_fallback
                    resp.fallback_reason = last_error_reason if routed_via_fallback else None
                    resp.attempts_count = total_attempts
                    resp.circuit_breaker_status = adapter.circuit_breaker.state.value

                    routing_trace.append({
                        "tier": tier,
                        "provider": provider.name,
                        "model": model.model_identifier,
                        "action": "COMPLETED",
                        "attempt": retry_num + 1,
                    })
                    resp.routing_trace = routing_trace

                    # Log to audit ledger
                    log = ModelRequestLog(
                        company_id=company_id,
                        agent_id=agent_id,
                        task_id=task_id,
                        requested_capability=",".join(request.required_capabilities),
                        selected_provider_name=provider.name,
                        selected_model_identifier=model.model_identifier,
                        routed_tier=tier,
                        routed_via_fallback=routed_via_fallback,
                        fallback_reason=resp.fallback_reason,
                        attempts_count=total_attempts,
                        routing_trace=routing_trace,
                        circuit_breaker_status=adapter.circuit_breaker.state.value,
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

                except ProviderRateLimitError as rle:
                    last_error_reason = f"Rate-limit on {provider.name}: {rle}"
                    if retry_num < max_retries - 1:
                        # Exponential backoff
                        backoff = 0.05 * (2**retry_num)
                        await asyncio.sleep(backoff)
                        routing_trace.append({
                            "tier": tier,
                            "provider": provider.name,
                            "model": model.model_identifier,
                            "action": "RETRY",
                            "attempt": retry_num + 1,
                            "error": str(rle),
                        })
                        continue
                    else:
                        adapter.circuit_breaker.record_failure()
                        provider.consecutive_failures += 1
                        routing_trace.append({
                            "tier": tier,
                            "provider": provider.name,
                            "model": model.model_identifier,
                            "action": "FAILOVER",
                            "error": str(rle),
                        })
                        break

                except ProviderTimeoutError as pte:
                    last_error_reason = f"Timeout on {provider.name}: {pte}"
                    adapter.circuit_breaker.record_failure()
                    provider.consecutive_failures += 1
                    routing_trace.append({
                        "tier": tier,
                        "provider": provider.name,
                        "model": model.model_identifier,
                        "action": "FAILOVER",
                        "error": str(pte),
                    })
                    break

                except StructuredOutputValidationError as soe:
                    last_error_reason = f"Structured schema validation error on {provider.name}: {soe}"
                    routing_trace.append({
                        "tier": tier,
                        "provider": provider.name,
                        "model": model.model_identifier,
                        "action": "FAILOVER",
                        "error": str(soe),
                    })
                    break

                except Exception as e:
                    last_error_reason = f"Unexpected failure on {provider.name}: {e}"
                    adapter.circuit_breaker.record_failure()
                    provider.consecutive_failures += 1
                    routing_trace.append({
                        "tier": tier,
                        "provider": provider.name,
                        "model": model.model_identifier,
                        "action": "FAILOVER",
                        "error": str(e),
                    })
                    break

            if provider.consecutive_failures >= 3:
                provider.is_healthy = False
            await self.db.flush()

        # If everything exhausted, record in ledger and raise
        fail_log = ModelRequestLog(
            company_id=company_id,
            agent_id=agent_id,
            task_id=task_id,
            requested_capability=",".join(request.required_capabilities),
            selected_provider_name=hierarchy[0][1].model_identifier if hierarchy else "unknown",
            selected_model_identifier="exhausted",
            routed_tier="EXHAUSTED",
            routed_via_fallback=True,
            fallback_reason=f"Exhausted all tiers. Last reason: {last_error_reason}",
            attempts_count=total_attempts,
            routing_trace=routing_trace,
            circuit_breaker_status="OPEN",
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            estimated_cost_usd=0.0,
            latency_ms=0.0,
            success=False,
            error_message=last_error_reason,
        )
        self.db.add(fail_log)
        await self.db.flush()

        raise BusinessRuleError(
            f"All routing tiers failed. Telemetry preserved for optimization. Last error: {last_error_reason}"
        )

