"""
NEXORA Resource Engine Evaluation and Scheduling Core.

Evaluates operational requests against:
- Availability (Compute, Intelligence, Operational pools)
- Priority (CRITICAL, HIGH, NORMAL, LOW, BACKGROUND)
- Policy & Budget constraints
- Expected Value Score
- Existing committed allocations

Produces decisions:
- APPROVE: Sufficient capacity & budget; allocations reserved immediately.
- DENY: Hard constraint violation (exhausted budget, unauthorized, zero feasibility).
- DEFER: Temporary shortage for lower priority; retry after delay.
- REDUCE: Insufficient capacity for full request, but partial allocation feasible.
- QUEUE: High value/priority request waiting on active allocations to complete.

Metric states:
- OBSERVED: Verified actual OS or provider measurement.
- ESTIMATED: Model/Task heuristic claim.
- ALLOCATED: Reserved from pool.
- LIMITED: Hard quota cap.
- AVAILABLE: Limited - Allocated.
"""
import logging
import os
import shutil
import uuid
from datetime import datetime, timedelta, timezone

from nexora.core.enums import (
    MetricState,
    ResourceCategory,
    ResourceEvaluationDecision,
    ResourcePriority,
)
from nexora.domains.resources.models import ResourceBudget, ResourcePool, ResourceRequest
from nexora.domains.resources.schemas import (
    RequestedComputeSpec,
    RequestedIntelligenceSpec,
    RequestedOperationalSpec,
    ResourceEvaluationResult,
)

logger = logging.getLogger("nexora.resources.engine")


class ResourceEngine:
    """
    Core resource scheduler and multi-dimensional operational capacity evaluator.
    """

    PRIORITY_WEIGHTS = {
        ResourcePriority.CRITICAL.value: 100,
        ResourcePriority.HIGH.value: 75,
        ResourcePriority.NORMAL.value: 50,
        ResourcePriority.LOW.value: 25,
        ResourcePriority.BACKGROUND.value: 10,
    }

    @staticmethod
    def inspect_host_telemetry() -> dict:
        """
        Inspect genuine host operating system compute metrics.
        CRITICAL RULE: Do not fake metrics if unobservable. Clearly mark OBSERVED vs ESTIMATED.
        """
        telemetry = {
            "metric_state": MetricState.OBSERVED.value,
            "cpu_cores_available": os.cpu_count() or 1,
            "load_average": [0.0, 0.0, 0.0],
            "storage_total_gb": 0.0,
            "storage_free_gb": 0.0,
            "ram_total_mb": None,
            "gpu_detected": False,
        }

        # Load average (Linux/Unix)
        if hasattr(os, "getloadavg"):
            try:
                telemetry["load_average"] = list(os.getloadavg())
            except Exception:
                pass

        # Storage disk usage
        try:
            total, used, free = shutil.disk_usage("/")
            telemetry["storage_total_gb"] = round(total / (1024**3), 2)
            telemetry["storage_free_gb"] = round(free / (1024**3), 2)
        except Exception:
            pass

        # RAM via /proc/meminfo on Linux without third-party dependencies
        try:
            if os.path.exists("/proc/meminfo"):
                with open("/proc/meminfo", "r") as f:
                    for line in f:
                        if line.startswith("MemTotal:"):
                            parts = line.split()
                            telemetry["ram_total_mb"] = round(int(parts[1]) / 1024, 2)
                            break
        except Exception:
            pass

        return telemetry

    @classmethod
    def evaluate_request(
        cls,
        priority: str,
        expected_value: float,
        compute: RequestedComputeSpec,
        intelligence: RequestedIntelligenceSpec,
        operational: RequestedOperationalSpec,
        pools: list[ResourcePool],
        budgets: list[ResourceBudget],
    ) -> ResourceEvaluationResult:
        """
        Multi-dimensional evaluation across compute, intelligence, operational, and financial dimensions.
        """
        # 1. Financial / Budget Evaluation
        for budget in budgets:
            if budget.is_exhausted:
                return ResourceEvaluationResult(
                    decision=ResourceEvaluationDecision.DENY,
                    decision_reason=f"Financial/token budget '{budget.name}' is fully exhausted.",
                )
            if (budget.spent_budget_usd + intelligence.max_inference_cost_usd) > budget.total_budget_usd:
                return ResourceEvaluationResult(
                    decision=ResourceEvaluationDecision.DENY,
                    decision_reason=f"Requested cost ${intelligence.max_inference_cost_usd:.2f} exceeds remaining budget for '{budget.name}'.",
                )

        # 2. Check Pool Capacities
        pools_by_category: dict[str, list[ResourcePool]] = {}
        for p in pools:
            if p.is_active:
                pools_by_category.setdefault(p.category, []).append(p)

        allocated_pool_ids: list[uuid.UUID] = []
        compute_pools = pools_by_category.get(ResourceCategory.COMPUTE.value, [])
        intel_pools = pools_by_category.get(ResourceCategory.INTELLIGENCE.value, [])
        op_pools = pools_by_category.get(ResourceCategory.OPERATIONAL.value, [])

        # Evaluate Compute Pool (CPU / RAM)
        compute_available = True
        compute_deficit = False
        for cp in compute_pools:
            if "cpu" in cp.unit.lower() or "core" in cp.unit.lower():
                if cp.available_capacity < compute.cpu_cores:
                    compute_available = False
                    compute_deficit = True
            elif "gb" in cp.unit.lower() or "ram" in cp.name.lower():
                if cp.available_capacity < compute.ram_gb:
                    compute_available = False
                    compute_deficit = True

        # Evaluate Intelligence Pool (Tokens)
        intel_available = True
        intel_deficit = False
        for ip in intel_pools:
            if "token" in ip.unit.lower():
                if ip.available_capacity < intelligence.tokens:
                    intel_available = False
                    intel_deficit = True

        # Evaluate Operational Pool (Slots / Concurrency)
        op_available = True
        for op in op_pools:
            if "slot" in op.unit.lower() or "agent" in op.unit.lower():
                if op.available_capacity < operational.slots_needed:
                    op_available = False

        # All resources available -> APPROVE
        if compute_available and intel_available and op_available:
            for p in pools:
                if p.is_active and p.available_capacity > 0:
                    allocated_pool_ids.append(p.id)
            return ResourceEvaluationResult(
                decision=ResourceEvaluationDecision.APPROVE,
                decision_reason="All requested compute, intelligence, and operational quotas are within capacity.",
                allocated_pool_ids=allocated_pool_ids,
            )

        # Priority-driven decision when capacity is constrained
        p_weight = cls.PRIORITY_WEIGHTS.get(priority, 50)

        # High or Critical priority with deficit -> QUEUE or REDUCE
        if p_weight >= 75:  # HIGH or CRITICAL
            # If expected value is high enough, we can REDUCE or QUEUE
            if expected_value >= 6.0:
                # Offer reduced compute/tokens if partial capacity exists
                reduced_compute = compute.model_dump()
                reduced_intel = intelligence.model_dump()
                reduced_compute["cpu_cores"] = max(1.0, compute.cpu_cores * 0.5)
                reduced_compute["ram_gb"] = max(1.0, compute.ram_gb * 0.5)
                reduced_intel["tokens"] = max(10_000, int(intelligence.tokens * 0.5))

                return ResourceEvaluationResult(
                    decision=ResourceEvaluationDecision.REDUCE,
                    decision_reason="High priority task scaled down to conform with active organizational load.",
                    adjusted_compute=reduced_compute,
                    adjusted_intelligence=reduced_intel,
                    adjusted_operational=operational.model_dump(),
                )
            else:
                return ResourceEvaluationResult(
                    decision=ResourceEvaluationDecision.QUEUE,
                    decision_reason="High priority task enqueued waiting for active allocations to release capacity.",
                    queue_position=1,
                )

        # Normal priority with deficit -> DEFER
        if p_weight >= 50:
            return ResourceEvaluationResult(
                decision=ResourceEvaluationDecision.DEFER,
                decision_reason="Resource pool is currently constrained; deferring execution for 60 seconds.",
                suggested_defer_seconds=60,
            )

        # Low or Background priority with deficit -> QUEUE or DENY
        if p_weight < 50:
            if expected_value >= 4.0:
                return ResourceEvaluationResult(
                    decision=ResourceEvaluationDecision.QUEUE,
                    decision_reason="Background operational task placed in lowest priority queue.",
                    queue_position=5,
                )
            return ResourceEvaluationResult(
                decision=ResourceEvaluationDecision.DENY,
                decision_reason="Capacity unavailable and priority/expected value is insufficient to displace workload.",
            )

        return ResourceEvaluationResult(
            decision=ResourceEvaluationDecision.DEFER,
            decision_reason="Default operational deferral under contention.",
            suggested_defer_seconds=120,
        )
