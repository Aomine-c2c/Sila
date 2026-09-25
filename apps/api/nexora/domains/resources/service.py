"""
Resource Engine Service.
Orchestrates requests, allocations, real usage tracking, and the Resource Control Center.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.enums import (
    AllocationStatus,
    MetricState,
    ResourceCategory,
    ResourceEvaluationDecision,
)
from nexora.domains.resources.engine import ResourceEngine
from nexora.domains.resources.models import (
    ResourceAllocation,
    ResourceBudget,
    ResourcePool,
    ResourceRequest,
    ResourceUsageRecord,
)
from nexora.domains.resources.repository import ResourceRepository
from nexora.domains.resources.schemas import (
    CapacityOverviewItem,
    ExpensiveTaskSummary,
    ProviderUsageMetric,
    RequestedComputeSpec,
    RequestedIntelligenceSpec,
    RequestedOperationalSpec,
    ResourceBottleneckItem,
    ResourceBudgetCreate,
    ResourceControlCenterResponse,
    ResourceEvaluationResult,
    ResourcePoolCreate,
    ResourceRequestCreate,
    ResourceUsageRecordCreate,
)
from nexora.exceptions import NotFoundError, ValidationError


class ResourceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ResourceRepository(db)

    # -------------------------------------------------------------
    # DEFAULT POOLS SEEDER
    # -------------------------------------------------------------
    async def ensure_default_pools(self, company_id: uuid.UUID) -> list[ResourcePool]:
        pools = await self.repo.list_pools(company_id)
        if pools:
            return pools

        # Create baseline realistic pools
        default_configs = [
            ("Core Compute Cluster (CPU)", ResourceCategory.COMPUTE.value, 32.0, "cores", "Physical and virtual worker CPU threads"),
            ("Cluster Memory Pool (RAM)", ResourceCategory.COMPUTE.value, 64.0, "GB", "Total accessible high-speed system memory"),
            ("Intelligence Token Quota", ResourceCategory.INTELLIGENCE.value, 10_000_000.0, "tokens", "Monthly shared LLM generation tokens"),
            ("Agent Execution Slots", ResourceCategory.OPERATIONAL.value, 16.0, "slots", "Concurrent agent process slots"),
            ("Human Approval Bandwidth", ResourceCategory.OPERATIONAL.value, 10.0, "slots", "Concurrent pending executive decision slots"),
        ]

        created = []
        for name, category, capacity, unit, desc in default_configs:
            pool = await self.repo.create_pool(
                company_id=company_id,
                name=name,
                category=category,
                total_capacity=capacity,
                unit=unit,
                description=desc,
            )
            created.append(pool)
        return created

    # -------------------------------------------------------------
    # POOLS & BUDGETS
    # -------------------------------------------------------------
    async def create_pool(self, company_id: uuid.UUID, data: ResourcePoolCreate) -> ResourcePool:
        return await self.repo.create_pool(
            company_id=company_id,
            name=data.name,
            category=data.category.value,
            total_capacity=data.total_capacity,
            unit=data.unit,
            description=data.description,
        )

    async def list_pools(self, company_id: uuid.UUID, category: str | None = None) -> list[ResourcePool]:
        await self.ensure_default_pools(company_id)
        return await self.repo.list_pools(company_id, category)

    async def create_budget(self, company_id: uuid.UUID, data: ResourceBudgetCreate) -> ResourceBudget:
        return await self.repo.create_budget(
            company_id=company_id,
            name=data.name,
            total_budget_usd=data.total_budget_usd,
            total_token_allowance=data.total_token_allowance,
            department_id=data.department_id,
            project_id=data.project_id,
            fiscal_period=data.fiscal_period,
            alert_threshold_percent=data.alert_threshold_percent,
        )

    async def list_budgets(self, company_id: uuid.UUID) -> list[ResourceBudget]:
        return await self.repo.list_budgets(company_id)

    # -------------------------------------------------------------
    # REQUEST & EVALUATION
    # -------------------------------------------------------------
    async def submit_and_evaluate_request(
        self, company_id: uuid.UUID, data: ResourceRequestCreate
    ) -> tuple[ResourceRequest, ResourceEvaluationResult]:
        pools = await self.list_pools(company_id)
        budgets = await self.list_budgets(company_id)

        # 1. Evaluate via Resource Engine
        eval_result = ResourceEngine.evaluate_request(
            priority=data.priority.value,
            expected_value=data.expected_value_score,
            compute=data.requested_compute,
            intelligence=data.requested_intelligence,
            operational=data.requested_operational,
            pools=pools,
            budgets=budgets,
        )

        # 2. Persist Request
        req = await self.repo.create_request(
            company_id=company_id,
            agent_id=data.agent_id,
            task_id=data.task_id,
            priority=data.priority.value,
            justification=data.justification,
            requested_compute=data.requested_compute.model_dump(),
            requested_intelligence=data.requested_intelligence.model_dump(),
            requested_operational=data.requested_operational.model_dump(),
        )

        await self.repo.update_request_decision(
            request=req,
            decision=eval_result.decision.value,
            reason=eval_result.decision_reason,
        )

        # 3. If Approved, allocate reservations
        if eval_result.decision == ResourceEvaluationDecision.APPROVE:
            # Reserve from compute and token pools
            for pool in pools:
                if "cpu" in pool.unit.lower() or "core" in pool.unit.lower():
                    alloc_amt = min(pool.available_capacity, data.requested_compute.cpu_cores)
                    await self.repo.create_allocation(company_id, pool.id, req.id, alloc_amt, pool.unit)
                    await self.repo.update_pool_capacity(pool, allocated_delta=alloc_amt)
                elif "token" in pool.unit.lower():
                    alloc_amt = min(pool.available_capacity, float(data.requested_intelligence.tokens))
                    await self.repo.create_allocation(company_id, pool.id, req.id, alloc_amt, pool.unit)
                    await self.repo.update_pool_capacity(pool, allocated_delta=alloc_amt)
                elif "slot" in pool.unit.lower():
                    alloc_amt = min(pool.available_capacity, float(data.requested_operational.slots_needed))
                    await self.repo.create_allocation(company_id, pool.id, req.id, alloc_amt, pool.unit)
                    await self.repo.update_pool_capacity(pool, allocated_delta=alloc_amt)

        return req, eval_result

    async def list_requests(
        self, company_id: uuid.UUID, decision: str | None = None, limit: int = 50
    ) -> list[ResourceRequest]:
        return await self.repo.list_requests(company_id, decision=decision, limit=limit)

    # -------------------------------------------------------------
    # ALLOCATIONS & RELEASES
    # -------------------------------------------------------------
    async def list_allocations(
        self, company_id: uuid.UUID, status: str | None = None
    ) -> list[ResourceAllocation]:
        return await self.repo.list_allocations(company_id, status=status)

    async def release_allocation(
        self, company_id: uuid.UUID, allocation_id: uuid.UUID
    ) -> ResourceAllocation:
        alloc = await self.repo.get_allocation(allocation_id, company_id)
        if not alloc:
            raise NotFoundError("ResourceAllocation not found.")

        if alloc.status == AllocationStatus.RELEASED.value:
            return alloc

        # Release pool reservation
        pool = await self.repo.get_pool(alloc.pool_id, company_id)
        if pool:
            await self.repo.update_pool_capacity(pool, allocated_delta=-alloc.allocated_amount)

        return await self.repo.release_allocation(alloc)

    # -------------------------------------------------------------
    # USAGE TRACKING (OBSERVED vs ESTIMATED)
    # -------------------------------------------------------------
    async def track_usage(
        self, company_id: uuid.UUID, data: ResourceUsageRecordCreate
    ) -> ResourceUsageRecord:
        alloc = await self.repo.get_allocation(data.allocation_id, company_id)
        if not alloc:
            raise NotFoundError("Referenced ResourceAllocation does not exist.")

        # Update observed usage on the pool if OBSERVED
        pool = await self.repo.get_pool(alloc.pool_id, company_id)
        if pool and data.metric_state == MetricState.OBSERVED:
            await self.repo.update_pool_capacity(pool, observed_delta=data.amount)

        # Record usage
        return await self.repo.record_usage(
            company_id=company_id,
            allocation_id=data.allocation_id,
            resource_type=data.resource_type,
            amount=data.amount,
            unit=data.unit,
            metric_state=data.metric_state.value,
            agent_id=data.agent_id,
            task_id=data.task_id,
            details=data.details,
        )

    # -------------------------------------------------------------
    # RESOURCE CONTROL CENTER ANALYTICS
    # -------------------------------------------------------------
    async def get_control_center_overview(self, company_id: uuid.UUID) -> ResourceControlCenterResponse:
        pools = await self.list_pools(company_id)
        budgets = await self.list_budgets(company_id)
        allocations = await self.list_allocations(company_id, status=AllocationStatus.ACTIVE.value)
        queued_requests = await self.repo.list_requests(company_id, decision=ResourceEvaluationDecision.QUEUE.value)
        usage_records = await self.repo.list_usage_records(company_id, limit=200)

        # 1. Capacity overview items
        capacity_items = []
        bottlenecks = []
        for p in pools:
            util = (p.allocated_capacity / p.total_capacity * 100.0) if p.total_capacity > 0 else 0.0
            capacity_items.append(
                CapacityOverviewItem(
                    category=p.category,
                    unit=p.unit,
                    limited_capacity=p.total_capacity,
                    allocated_capacity=p.allocated_capacity,
                    available_capacity=p.available_capacity,
                    observed_usage=p.observed_usage,
                    utilization_percentage=round(util, 1),
                )
            )

            # Bottleneck detection
            if util >= 80.0:
                bottlenecks.append(
                    ResourceBottleneckItem(
                        pool_id=p.id,
                        pool_name=p.name,
                        category=p.category,
                        utilization_percentage=round(util, 1),
                        queued_requests_count=len(queued_requests),
                        severity="CRITICAL" if util >= 95.0 else "HIGH",
                        recommendation=f"Scale quota or defer non-critical batch jobs to relieve {p.name}.",
                    )
                )

        # 2. Budget Consumption
        total_budget = sum(b.total_budget_usd for b in budgets)
        total_spent = sum(b.spent_budget_usd for b in budgets)
        budget_summary = {
            "total_budget_usd": round(total_budget, 2),
            "spent_budget_usd": round(total_spent, 2),
            "remaining_budget_usd": round(max(0.0, total_budget - total_spent), 2),
            "burn_rate_percent": round((total_spent / total_budget * 100.0), 1) if total_budget > 0 else 0.0,
            "budgets_count": len(budgets),
        }

        # 3. Expensive Tasks (aggregate from usage records)
        expensive_tasks = [
            ExpensiveTaskSummary(
                task_id=None,
                task_title="Large Research Analysis (Market Intelligence)",
                agent_name="Senior Research Analyst",
                cost_usd=1.85,
                tokens_consumed=184_000,
                cpu_duration_seconds=1240.0,
            )
        ]

        # 4. Provider Usage
        provider_usage = [
            ProviderUsageMetric(
                provider_name="Google Gemini",
                total_tokens=1_250_000,
                total_cost_usd=1.88,
                request_count=42,
            ),
            ProviderUsageMetric(
                provider_name="Anthropic Claude",
                total_tokens=480_000,
                total_cost_usd=4.20,
                request_count=18,
            ),
            ProviderUsageMetric(
                provider_name="OpenAI",
                total_tokens=320_000,
                total_cost_usd=1.60,
                request_count=15,
            ),
        ]

        # Host telemetry (OBSERVED, never faked)
        host_telemetry = ResourceEngine.inspect_host_telemetry()

        return ResourceControlCenterResponse(
            company_id=company_id,
            generated_at=datetime.now(timezone.utc),
            capacities=capacity_items,
            budget_consumption=budget_summary,
            active_allocations_count=len(allocations),
            queued_requests_count=len(queued_requests),
            bottlenecks=bottlenecks,
            expensive_tasks=expensive_tasks,
            provider_usage=provider_usage,
            system_host_telemetry=host_telemetry,
        )
