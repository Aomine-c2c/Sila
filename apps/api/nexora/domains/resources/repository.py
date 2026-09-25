"""
Resource Engine Repository.
Handles DB persistence and querying for:
- Resource Pools
- Resource Budgets
- Resource Requests
- Resource Allocations
- Resource Usage Records (OBSERVED & ESTIMATED)
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.enums import AllocationStatus, MetricState
from nexora.domains.resources.models import (
    ResourceAllocation,
    ResourceBudget,
    ResourcePool,
    ResourceRequest,
    ResourceUsageRecord,
)


class ResourceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # -------------------------------------------------------------
    # RESOURCE POOLS
    # -------------------------------------------------------------
    async def create_pool(
        self,
        company_id: uuid.UUID,
        name: str,
        category: str,
        total_capacity: float,
        unit: str,
        description: str | None = None,
    ) -> ResourcePool:
        pool = ResourcePool(
            company_id=company_id,
            name=name,
            category=category,
            total_capacity=total_capacity,
            unit=unit,
            description=description,
            allocated_capacity=0.0,
            observed_usage=0.0,
            is_active=True,
        )
        self.db.add(pool)
        await self.db.flush()
        await self.db.refresh(pool)
        return pool

    async def get_pool(self, pool_id: uuid.UUID, company_id: uuid.UUID) -> ResourcePool | None:
        stmt = select(ResourcePool).where(
            ResourcePool.id == pool_id,
            ResourcePool.company_id == company_id,
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_pools(self, company_id: uuid.UUID, category: str | None = None) -> list[ResourcePool]:
        stmt = select(ResourcePool).where(ResourcePool.company_id == company_id)
        if category:
            stmt = stmt.where(ResourcePool.category == category)
        stmt = stmt.order_by(ResourcePool.category, ResourcePool.name)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_pool_capacity(
        self,
        pool: ResourcePool,
        allocated_delta: float = 0.0,
        observed_delta: float = 0.0,
    ) -> ResourcePool:
        pool.allocated_capacity = max(0.0, pool.allocated_capacity + allocated_delta)
        pool.observed_usage = max(0.0, pool.observed_usage + observed_delta)
        await self.db.flush()
        await self.db.refresh(pool)
        return pool

    # -------------------------------------------------------------
    # RESOURCE BUDGETS
    # -------------------------------------------------------------
    async def create_budget(
        self,
        company_id: uuid.UUID,
        name: str,
        total_budget_usd: float,
        total_token_allowance: int = 10_000_000,
        department_id: uuid.UUID | None = None,
        project_id: uuid.UUID | None = None,
        fiscal_period: str = "MONTHLY",
        alert_threshold_percent: float = 80.0,
    ) -> ResourceBudget:
        budget = ResourceBudget(
            company_id=company_id,
            department_id=department_id,
            project_id=project_id,
            name=name,
            fiscal_period=fiscal_period,
            total_budget_usd=total_budget_usd,
            spent_budget_usd=0.0,
            total_token_allowance=total_token_allowance,
            consumed_tokens=0,
            alert_threshold_percent=alert_threshold_percent,
            is_exhausted=False,
        )
        self.db.add(budget)
        await self.db.flush()
        await self.db.refresh(budget)
        return budget

    async def get_budget(self, budget_id: uuid.UUID, company_id: uuid.UUID) -> ResourceBudget | None:
        stmt = select(ResourceBudget).where(
            ResourceBudget.id == budget_id,
            ResourceBudget.company_id == company_id,
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_budgets(self, company_id: uuid.UUID) -> list[ResourceBudget]:
        stmt = select(ResourceBudget).where(ResourceBudget.company_id == company_id).order_by(ResourceBudget.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def record_budget_expenditure(
        self,
        budget: ResourceBudget,
        usd_spent: float = 0.0,
        tokens_consumed: int = 0,
    ) -> ResourceBudget:
        budget.spent_budget_usd += usd_spent
        budget.consumed_tokens += tokens_consumed
        if (
            budget.spent_budget_usd >= budget.total_budget_usd
            or budget.consumed_tokens >= budget.total_token_allowance
        ):
            budget.is_exhausted = True
        await self.db.flush()
        await self.db.refresh(budget)
        return budget

    # -------------------------------------------------------------
    # RESOURCE REQUESTS
    # -------------------------------------------------------------
    async def create_request(
        self,
        company_id: uuid.UUID,
        justification: str,
        priority: str,
        requested_compute: dict,
        requested_intelligence: dict,
        requested_operational: dict,
        agent_id: uuid.UUID | None = None,
        task_id: uuid.UUID | None = None,
    ) -> ResourceRequest:
        req = ResourceRequest(
            company_id=company_id,
            agent_id=agent_id,
            task_id=task_id,
            priority=priority,
            justification=justification,
            requested_compute=requested_compute,
            requested_intelligence=requested_intelligence,
            requested_operational=requested_operational,
            decision=None,
            decision_reason=None,
            evaluated_at=None,
        )
        self.db.add(req)
        await self.db.flush()
        await self.db.refresh(req)
        return req

    async def get_request(self, request_id: uuid.UUID, company_id: uuid.UUID) -> ResourceRequest | None:
        stmt = select(ResourceRequest).where(
            ResourceRequest.id == request_id,
            ResourceRequest.company_id == company_id,
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_requests(
        self,
        company_id: uuid.UUID,
        decision: str | None = None,
        agent_id: uuid.UUID | None = None,
        limit: int = 50,
    ) -> list[ResourceRequest]:
        stmt = select(ResourceRequest).where(ResourceRequest.company_id == company_id)
        if decision:
            stmt = stmt.where(ResourceRequest.decision == decision)
        if agent_id:
            stmt = stmt.where(ResourceRequest.agent_id == agent_id)
        stmt = stmt.order_by(ResourceRequest.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_request_decision(
        self,
        request: ResourceRequest,
        decision: str,
        reason: str,
    ) -> ResourceRequest:
        request.decision = decision
        request.decision_reason = reason
        request.evaluated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(request)
        return request

    # -------------------------------------------------------------
    # RESOURCE ALLOCATIONS
    # -------------------------------------------------------------
    async def create_allocation(
        self,
        company_id: uuid.UUID,
        pool_id: uuid.UUID,
        request_id: uuid.UUID,
        amount: float,
        unit: str,
        expires_at: datetime | None = None,
    ) -> ResourceAllocation:
        alloc = ResourceAllocation(
            company_id=company_id,
            pool_id=pool_id,
            request_id=request_id,
            allocated_amount=amount,
            unit=unit,
            status=AllocationStatus.ACTIVE.value,
            expires_at=expires_at,
        )
        self.db.add(alloc)
        await self.db.flush()
        await self.db.refresh(alloc)
        return alloc

    async def get_allocation(self, allocation_id: uuid.UUID, company_id: uuid.UUID) -> ResourceAllocation | None:
        stmt = select(ResourceAllocation).where(
            ResourceAllocation.id == allocation_id,
            ResourceAllocation.company_id == company_id,
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_allocations(
        self,
        company_id: uuid.UUID,
        status: str | None = None,
    ) -> list[ResourceAllocation]:
        stmt = select(ResourceAllocation).where(ResourceAllocation.company_id == company_id)
        if status:
            stmt = stmt.where(ResourceAllocation.status == status)
        stmt = stmt.order_by(ResourceAllocation.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def release_allocation(self, allocation: ResourceAllocation) -> ResourceAllocation:
        allocation.status = AllocationStatus.RELEASED.value
        allocation.released_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(allocation)
        return allocation

    # -------------------------------------------------------------
    # RESOURCE USAGE RECORDS (OBSERVED & ESTIMATED)
    # -------------------------------------------------------------
    async def record_usage(
        self,
        company_id: uuid.UUID,
        allocation_id: uuid.UUID,
        resource_type: str,
        amount: float,
        unit: str,
        metric_state: str = MetricState.OBSERVED.value,
        agent_id: uuid.UUID | None = None,
        task_id: uuid.UUID | None = None,
        details: dict | None = None,
    ) -> ResourceUsageRecord:
        record = ResourceUsageRecord(
            company_id=company_id,
            allocation_id=allocation_id,
            agent_id=agent_id,
            task_id=task_id,
            metric_state=metric_state,
            resource_type=resource_type,
            amount=amount,
            unit=unit,
            details=details or {},
        )
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def list_usage_records(
        self,
        company_id: uuid.UUID,
        task_id: uuid.UUID | None = None,
        agent_id: uuid.UUID | None = None,
        limit: int = 100,
    ) -> list[ResourceUsageRecord]:
        stmt = select(ResourceUsageRecord).where(ResourceUsageRecord.company_id == company_id)
        if task_id:
            stmt = stmt.where(ResourceUsageRecord.task_id == task_id)
        if agent_id:
            stmt = stmt.where(ResourceUsageRecord.agent_id == agent_id)
        stmt = stmt.order_by(ResourceUsageRecord.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
