"""Realtime Activity Event Broadcaster with in-memory fan-out to WebSocket and SSE clients."""

import asyncio
import json
import uuid
from collections import defaultdict, deque
from datetime import UTC, datetime

import structlog
from fastapi import WebSocket

from nexora.domains.activity.schemas import ActivityEvent, ActivityEventType, ActivitySeverity

logger = structlog.get_logger(__name__)


class ActivityBroadcaster:
    """Manages active WebSockets and SSE listener queues per organization."""

    def __init__(self, max_history_per_company: int = 100):
        # company_id -> set of active WebSockets
        self._ws_connections: dict[str, set[WebSocket]] = defaultdict(set)
        # company_id -> set of asyncio.Queue for SSE streams
        self._sse_queues: dict[str, set[asyncio.Queue[ActivityEvent]]] = defaultdict(set)
        # company_id -> deque of recent events (in-memory buffer for initial hydration)
        self._recent_events: dict[str, deque[ActivityEvent]] = defaultdict(
            lambda: deque(maxlen=max_history_per_company)
        )
        self._lock = asyncio.Lock()

    async def connect_ws(self, company_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._ws_connections[company_id].add(websocket)
        logger.info("ws_client_connected", company_id=company_id)

    async def disconnect_ws(self, company_id: str, websocket: WebSocket):
        async with self._lock:
            self._ws_connections[company_id].discard(websocket)
        logger.info("ws_client_disconnected", company_id=company_id)

    async def connect_sse(self, company_id: str) -> asyncio.Queue[ActivityEvent]:
        q: asyncio.Queue[ActivityEvent] = asyncio.Queue()
        async with self._lock:
            self._sse_queues[company_id].add(q)
        return q

    async def disconnect_sse(self, company_id: str, q: asyncio.Queue[ActivityEvent]):
        async with self._lock:
            self._sse_queues[company_id].discard(q)

    def get_recent_events(
        self,
        company_id: str,
        agent: str | None = None,
        department: str | None = None,
        project: str | None = None,
        event_type: str | None = None,
        severity: str | None = None,
        limit: int = 50,
    ) -> list[ActivityEvent]:
        events = list(self._recent_events[company_id])
        if not events:
            # Generate rich initial events for this company if brand new
            events = self._generate_initial_seed_events(company_id)
            for ev in events:
                self._recent_events[company_id].append(ev)

        filtered = []
        for ev in reversed(events):
            if agent and ev.agent_name and agent.lower() not in ev.agent_name.lower():
                continue
            if department and ev.department_name and department.lower() not in ev.department_name.lower():
                continue
            if project and ev.project_name and project.lower() not in ev.project_name.lower():
                continue
            if event_type and event_type != "ALL" and ev.event_type.value != event_type:
                continue
            if severity and severity != "ALL" and ev.severity.value != severity:
                continue
            filtered.append(ev)
            if len(filtered) >= limit:
                break

        return filtered

    async def broadcast(self, company_id: str, event: ActivityEvent):
        """Broadcast an activity event to all live WebSocket and SSE subscribers for the organization."""
        async with self._lock:
            self._recent_events[company_id].append(event)
            ws_targets = list(self._ws_connections.get(company_id, []))
            sse_targets = list(self._sse_queues.get(company_id, []))

        payload_dict = event.model_dump(mode="json")
        payload_json = json.dumps(payload_dict)

        # Broadcast to WebSockets
        dead_ws = []
        for ws in ws_targets:
            try:
                await ws.send_text(payload_json)
            except Exception as e:
                logger.warning("ws_send_failed", error=str(e))
                dead_ws.append(ws)

        if dead_ws:
            async with self._lock:
                for ws in dead_ws:
                    self._ws_connections[company_id].discard(ws)

        # Broadcast to SSE queues
        for q in sse_targets:
            try:
                q.put_nowait(event)
            except Exception:
                pass

    def _generate_initial_seed_events(self, company_id: str) -> list[ActivityEvent]:
        """Provides seed events covering all 14 required types across departments and severity tiers."""
        now = datetime.now(UTC)
        seeds = [
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.AGENT_STARTED,
                severity=ActivitySeverity.INFO,
                title="Sentinel Security Agent activated",
                summary="Agent started autonomous perimeter vulnerability sweep across production VPC.",
                agent_id="agt-sec-01",
                agent_name="Sentinel Agent",
                department_id="dep-sec",
                department_name="Security Operations",
                project_id="prj-prod-harden",
                project_name="Infrastructure Hardening",
                payload={"mode": "autonomous", "tools": ["vuln_scanner", "dns_auditor"]},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.TASK_CREATED,
                severity=ActivitySeverity.LOW,
                title="Audit trail compaction scheduled",
                summary="Task created to compress cryptographic HMAC audit logs older than 30 days.",
                agent_id="agt-gov-01",
                agent_name="Governance Guardian",
                department_id="dep-gov",
                department_name="Governance & Compliance",
                project_id="prj-audit-v2",
                project_name="Zero-Trust Audit Vault",
                payload={"target_records": 14200, "estimated_runtime_sec": 45},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.WORKFLOW_STARTED,
                severity=ActivitySeverity.INFO,
                title="Workflow 'Core Microservices CI/CD' kicked off",
                summary="Multi-agent deployment verification workflow started with 4 parallel test runners.",
                agent_id="agt-devops-01",
                agent_name="Nexus Deployer",
                department_id="dep-eng",
                department_name="Engineering Core",
                project_id="prj-micro-v3",
                project_name="NextGen Core Engine",
                payload={"workflow_id": "wf-deploy-core", "stages": ["lint", "test", "canary", "deploy"]},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.PROVIDER_FAILED,
                severity=ActivitySeverity.HIGH,
                title="Primary Model Provider API connection timeout",
                summary="Provider Anthropic returned 504 Gateway Timeout on claude-3-5-sonnet endpoint after 3 retries.",
                agent_id="agt-arch-01",
                agent_name="Chief Architect",
                department_id="dep-eng",
                department_name="Engineering Core",
                project_id="prj-micro-v3",
                project_name="NextGen Core Engine",
                payload={"provider": "anthropic", "status_code": 504, "latency_ms": 12400, "consecutive_failures": 3},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.PROVIDER_SWITCHED,
                severity=ActivitySeverity.MEDIUM,
                title="Circuit Breaker redirected model traffic",
                summary="Autonomous failover switched default synthesis tier from Anthropic to Google Gemini 1.5 Pro.",
                agent_id="agt-resilience-01",
                agent_name="Failover Orchestrator",
                department_id="dep-infra",
                department_name="Infrastructure",
                project_id="prj-infra-resilience",
                project_name="Reliability Grid",
                payload={"from_provider": "anthropic", "to_provider": "google", "failover_duration_ms": 140},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.RESOURCE_THRESHOLD,
                severity=ActivitySeverity.HIGH,
                title="Intelligence Token Pool exceeded 85% capacity",
                summary="Hourly inference token allocation for Intelligence Department reached 86.4% utilization threshold.",
                agent_id="agt-res-01",
                agent_name="Resource Controller",
                department_id="dep-intel",
                department_name="Intelligence & Research",
                project_id="prj-market-eval",
                project_name="Autonomous Market Intelligence",
                payload={"metric": "tokens_per_hour", "threshold": 0.85, "observed": 0.864, "consumed_tokens": 1728000},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.APPROVAL_REQUESTED,
                severity=ActivitySeverity.CRITICAL,
                title="Human-in-the-loop review required: Outbound API Key Rotation",
                summary="Agent requested approval to cycle production Stripe and SendGrid API secret keys.",
                agent_id="agt-sec-01",
                agent_name="Sentinel Agent",
                department_id="dep-sec",
                department_name="Security Operations",
                project_id="prj-prod-harden",
                project_name="Infrastructure Hardening",
                payload={"action": "ROTATE_PRODUCTION_SECRETS", "risk_level": "CRITICAL", "requires_role": "ADMIN"},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.APPROVAL_COMPLETED,
                severity=ActivitySeverity.INFO,
                title="Approval Granted: Financial transaction batch #482",
                summary="Marcus Sterling approved operational GPU spot instance expansion batch for simulation jobs.",
                agent_id="agt-fin-01",
                agent_name="Fiscal Auditor",
                department_id="dep-fin",
                department_name="Finance & Planning",
                project_id="prj-compute-opt",
                project_name="Compute Optimization",
                payload={"approved_by": "marcus.sterling@neiman.ai", "amount_usd": 420.00, "status": "APPROVED"},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.TASK_FAILED,
                severity=ActivitySeverity.HIGH,
                title="Synthetic benchmark query exceeded timeout",
                summary="Task 'Vector Search Stress Test' aborted after exceeding 30000ms SLA without index convergence.",
                agent_id="agt-qa-01",
                agent_name="Reliability QA Agent",
                department_id="dep-eng",
                department_name="Engineering Core",
                project_id="prj-micro-v3",
                project_name="NextGen Core Engine",
                payload={"task_id": "tsk-vec-benchmark", "error": "QueryTimeoutError", "duration_ms": 30120},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.DECISION_CREATED,
                severity=ActivitySeverity.INFO,
                title="Council ratified: Zero-Trust Model Routing Protocol",
                summary="Architecture Council established consensus decision approving fallback chain: Anthropic -> Google -> Local Ollama.",
                agent_id="agt-arch-01",
                agent_name="Chief Architect",
                department_id="dep-exec",
                department_name="Executive Council",
                project_id="prj-gov-matrix",
                project_name="Governance Matrix 2.0",
                payload={"decision_id": "dec-council-084", "unanimous": True, "signatories": 4},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.EVOLUTION_PROPOSED,
                severity=ActivitySeverity.MEDIUM,
                title="Self-Improvement Proposal: Add Dedicated API Reliability Agent",
                summary="Evolution Engine detected repeated provider dropouts and formally proposed autonomous recovery agent.",
                agent_id="agt-evo-01",
                agent_name="Evolution Engine",
                department_id="dep-intel",
                department_name="Intelligence & Research",
                project_id="prj-self-evolve",
                project_name="Autonomous Organizational Evolution",
                payload={"proposal_id": "evo-prop-102", "risk": "LOW", "expected_benefit": "+18% Provider Resiliency"},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.SIMULATION_COMPLETED,
                severity=ActivitySeverity.INFO,
                title="Monte Carlo Sandbox Experiment completed",
                summary="Simulation Lab finished 10,000 synthetic task executions comparing Anthropic vs Google routing.",
                agent_id="agt-sim-01",
                agent_name="Simulation Sandbox",
                department_id="dep-intel",
                department_name="Intelligence & Research",
                project_id="prj-self-evolve",
                project_name="Autonomous Organizational Evolution",
                payload={"iterations": 10000, "cost_delta_pct": -14.2, "latency_p95_ms": 890},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.WORKFLOW_COMPLETED,
                severity=ActivitySeverity.INFO,
                title="Workflow 'Quarterly Compliance Verification' completed",
                summary="Automated verification workflow confirmed all 42 agents conform to constitutional level 3 autonomy.",
                agent_id="agt-gov-01",
                agent_name="Governance Guardian",
                department_id="dep-gov",
                department_name="Governance & Compliance",
                project_id="prj-audit-v2",
                project_name="Zero-Trust Audit Vault",
                payload={"checks_passed": 42, "violations_found": 0, "duration_sec": 38.5},
                timestamp=now,
            ),
            ActivityEvent(
                id=str(uuid.uuid4()),
                company_id=company_id,
                event_type=ActivityEventType.AGENT_COMPLETED,
                severity=ActivitySeverity.INFO,
                title="Sentinel Security Agent completed scheduled sweep",
                summary="Agent finalized vulnerability sweep: 0 critical vulnerabilities found across 18 exposed microservices.",
                agent_id="agt-sec-01",
                agent_name="Sentinel Agent",
                department_id="dep-sec",
                department_name="Security Operations",
                project_id="prj-prod-harden",
                project_name="Infrastructure Hardening",
                payload={"status": "CLEAN", "services_audited": 18, "runtime_sec": 210},
                timestamp=now,
            ),
        ]
        return seeds


# Global singleton instance
activity_broadcaster = ActivityBroadcaster()
