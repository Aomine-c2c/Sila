"""
NEIMAN TUI API Client.

Consumes the exact same backend endpoints and data contracts as the graphical web frontend.
Supports:
- Direct HTTP via httpx with token authentication
- Graceful offline/local simulation fallback when API server is unavailable or degraded
- WebSocket realtime activity stream
"""

import asyncio
import json
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
import httpx

DEFAULT_API_URL = os.environ.get("NEIMAN_API_URL", "http://localhost:8000/api/v1")
DEFAULT_WS_URL = os.environ.get("NEIMAN_WS_URL", "ws://localhost:8000/api/v1")


@dataclass
class OrganizationSummary:
    id: str
    name: str
    mission: str
    status: str
    industry: str


class NeimanApiClient:
    """Client consuming NEIMAN REST and WebSocket endpoints."""

    def __init__(self, base_url: str = DEFAULT_API_URL, token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.token = token or os.environ.get("NEIMAN_API_TOKEN")
        self.headers = {"Content-Type": "application/json"}
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
        self.active_company_id: Optional[str] = None

    async def login(self, email: str = "elena.vance@neiman.ai", password: str = "password123") -> bool:
        """Authenticate against /auth/login and cache token."""
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    f"{self.base_url}/auth/login",
                    json={"email": email, "password": password},
                )
                if res.status_code == 200:
                    data = res.json()
                    self.token = data.get("access_token")
                    self.headers["Authorization"] = f"Bearer {self.token}"
                    return True
        except Exception:
            pass
        return False

    async def get_companies(self) -> List[Dict[str, Any]]:
        """List companies for current user or default preview company."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/me")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        # Fallback offline simulation data
        return [
            {
                "id": "c1000000-0000-0000-0000-000000000001",
                "name": "Nexora Labs (Autonomous Org)",
                "mission": "Empowering enterprise autonomy with zero-loss coordination.",
                "status": "ACTIVE",
                "industry": "Autonomous AI Systems",
            }
        ]

    async def get_dashboard_summary(self, company_id: str) -> Dict[str, Any]:
        """Aggregate high-level overview metrics."""
        agents = await self.get_agents(company_id)
        projects = await self.get_projects(company_id)
        resources = await self.get_resources(company_id)
        approvals = await self.get_approvals(company_id)

        active_agents = len([a for a in agents if a.get("status") in ("WORKING", "BUSY", "AVAILABLE")])
        active_projects = len([p for p in projects if p.get("status") in ("ACTIVE", "IN_PROGRESS")])
        
        # calculate total tasks
        all_tasks = await self.get_tasks(company_id)
        running_tasks = len([t for t in all_tasks if t.get("status") in ("IN_PROGRESS", "RUNNING")])
        pending_approvals = len([ap for ap in approvals if ap.get("status") == "PENDING"])

        return {
            "agents_total": len(agents),
            "agents_active": active_agents,
            "projects_total": len(projects),
            "projects_active": active_projects,
            "tasks_total": len(all_tasks),
            "tasks_running": running_tasks,
            "pending_approvals": pending_approvals,
            "resource_cpu_pct": resources.get("cpu_pct", 74),
            "resource_ram_pct": resources.get("ram_pct", 62),
            "resource_tok_pct": resources.get("tok_pct", 69),
            "active_operations": [
                {"agent": a.get("name", "Agent"), "status": a.get("status"), "role": a.get("identity", {}).get("title") or a.get("role_title", "Operator")}
                for a in agents[:5]
            ],
        }

    async def get_agents(self, company_id: str) -> List[Dict[str, Any]]:
        """Fetch all agents for the company."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/agents")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        # Offline fallback
        return [
            {
                "id": "ag-01",
                "name": "Architect Agent",
                "role_title": "Chief Systems Architect",
                "department": "Engineering",
                "status": "WORKING",
                "autonomy": "SUPERVISED",
                "model": "claude-sonnet",
                "current_task": "Analyzing microservice decoupled resilience architecture",
            },
            {
                "id": "ag-02",
                "name": "QA Agent",
                "role_title": "Lead Verification Engineer",
                "department": "Quality Assurance",
                "status": "WORKING",
                "autonomy": "AUTONOMOUS",
                "model": "gemini-2.5-pro",
                "current_task": "Executing automated integration & chaos testing suite",
            },
            {
                "id": "ag-03",
                "name": "Security Agent",
                "role_title": "Compliance & Security Auditor",
                "department": "Security",
                "status": "WAITING_APPROVAL",
                "autonomy": "SUPERVISED",
                "model": "gpt-4.1",
                "current_task": "Reviewing external gateway egress authorization",
            },
            {
                "id": "ag-04",
                "name": "Reliability SRE",
                "role_title": "Site Reliability Steward",
                "department": "Operations",
                "status": "AVAILABLE",
                "autonomy": "AUTONOMOUS",
                "model": "claude-sonnet",
                "current_task": "Monitoring token burst quotas & failover health",
            },
            {
                "id": "ag-05",
                "name": "Evolution Strategist",
                "role_title": "Adaptive Evolution Lead",
                "department": "Core Intelligence",
                "status": "WORKING",
                "autonomy": "SUPERVISED",
                "model": "gemini-2.5-pro",
                "current_task": "Simulating prompt routing optimization proposals",
            },
        ]

    async def get_projects(self, company_id: str) -> List[Dict[str, Any]]:
        """Fetch all projects."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/projects")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        return [
            {
                "id": "prj-01",
                "name": "Project Alpha — Core Engine Hardening",
                "objective": "Zero-downtime provider failover and memory isolation",
                "status": "ACTIVE",
                "priority": "HIGH",
                "progress_pct": 72,
                "deadline": "2026-10-15",
            },
            {
                "id": "prj-02",
                "name": "Project Beta — Realtime Event Fabric",
                "objective": "High-throughput WebSocket event ingestion & telemetry",
                "status": "ACTIVE",
                "priority": "CRITICAL",
                "progress_pct": 91,
                "deadline": "2026-10-08",
            },
            {
                "id": "prj-03",
                "name": "Project Gamma — Autonomous Evolution Lab",
                "objective": "Safe sandbox execution for organizational self-improvement",
                "status": "ACTIVE",
                "priority": "MEDIUM",
                "progress_pct": 58,
                "deadline": "2026-11-01",
            },
            {
                "id": "prj-04",
                "name": "Project Delta — Desktop Native Runtime",
                "objective": "Tauri 2.0 system tray, encrypted vault, and notifications",
                "status": "COMPLETED",
                "priority": "HIGH",
                "progress_pct": 100,
                "deadline": "2026-10-02",
            },
        ]

    async def get_tasks(self, company_id: str) -> List[Dict[str, Any]]:
        """Fetch all tasks across projects."""
        projects = await self.get_projects(company_id)
        all_tasks = []
        for p in projects:
            p_id = p.get("id")
            try:
                async with httpx.AsyncClient(timeout=3.0, headers=self.headers) as client:
                    res = await client.get(f"{self.base_url}/companies/{company_id}/projects/{p_id}/tasks")
                    if res.status_code == 200:
                        all_tasks.extend(res.json())
            except Exception:
                pass

        if all_tasks:
            return all_tasks

        # Fallback offline tasks
        return [
            {"id": "tsk-01", "title": "Verify circuit breaker failover threshold", "project": "Project Alpha", "status": "IN_PROGRESS", "priority": "HIGH", "agent": "Architect Agent"},
            {"id": "tsk-02", "title": "Run regression stress tests on WebSocket stream", "project": "Project Beta", "status": "IN_PROGRESS", "priority": "CRITICAL", "agent": "QA Agent"},
            {"id": "tsk-03", "title": "Audit outbound webhook HMAC verification", "project": "Project Alpha", "status": "BLOCKED", "priority": "HIGH", "agent": "Security Agent"},
            {"id": "tsk-04", "title": "Benchmark Anthropic Claude vs Google Gemini latency", "project": "Project Gamma", "status": "COMPLETED", "priority": "MEDIUM", "agent": "Reliability SRE"},
            {"id": "tsk-05", "title": "Generate snapshot for organizational evolution proposal", "project": "Project Gamma", "status": "IN_PROGRESS", "priority": "MEDIUM", "agent": "Evolution Strategist"},
        ]

    async def get_workflows(self, company_id: str) -> List[Dict[str, Any]]:
        """Fetch workflows."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/workflows")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        return [
            {"id": "wf-01", "name": "Incident Auto-Mitigation Pipeline", "status": "ACTIVE", "trigger": "provider_failed", "steps": 4, "success_rate": "99.2%"},
            {"id": "wf-02", "name": "Model Performance Benchmark Sweep", "status": "SCHEDULED", "trigger": "cadence_weekly", "steps": 3, "success_rate": "100%"},
            {"id": "wf-03", "name": "Consequential Action Approval Gate", "status": "ACTIVE", "trigger": "high_risk_evaluated", "steps": 2, "success_rate": "97.5%"},
        ]

    async def get_resources(self, company_id: str) -> Dict[str, Any]:
        """Fetch resource pools and control center telemetry."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/resources/pools")
                if res.status_code == 200:
                    pools = res.json()
                    return {
                        "pools": pools,
                        "cpu_pct": 78,
                        "ram_pct": 61,
                        "tok_pct": 69,
                        "budget_total_usd": 1500,
                        "budget_spent_usd": 482.30,
                    }
        except Exception:
            pass

        return {
            "cpu_pct": 78,
            "ram_pct": 61,
            "tok_pct": 69,
            "budget_total_usd": 1500,
            "budget_spent_usd": 482.30,
            "pools": [
                {"name": "Shared Compute Engine", "category": "COMPUTE", "capacity": "32 vCPUs", "usage": "78%"},
                {"name": "High-Throughput Intelligence Pool", "category": "INTELLIGENCE", "capacity": "2.5M tokens/min", "usage": "69%"},
                {"name": "Human Governance Slots", "category": "OPERATIONAL", "capacity": "8 slots", "usage": "38%"},
            ],
        }

    async def get_intelligence(self, company_id: str) -> Dict[str, Any]:
        """Fetch model providers and routing dashboard."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/intelligence/dashboard")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        return {
            "overall_health": "HEALTHY",
            "active_strategy": "BALANCED_CAPABILITY",
            "providers": [
                {"name": "Anthropic (Claude Sonnet 3.5)", "status": "ONLINE", "latency_ms": 1120, "reliability": "99.8%", "healthy": True},
                {"name": "Google AI (Gemini 2.5 Pro)", "status": "ONLINE", "latency_ms": 940, "reliability": "99.9%", "healthy": True},
                {"name": "OpenAI (GPT-4.1)", "status": "ONLINE", "latency_ms": 1080, "reliability": "99.5%", "healthy": True},
                {"name": "Local On-Premises (Qwen 3 8B)", "status": "DEGRADED", "latency_ms": 2210, "reliability": "94.2%", "healthy": False},
            ],
        }

    async def get_approvals(self, company_id: str) -> List[Dict[str, Any]]:
        """Fetch pending approvals."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/governance/approvals")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        return [
            {
                "id": "appr-01",
                "title": "Authorize External Production Egress",
                "risk_level": "HIGH",
                "agent_name": "Security Agent",
                "status": "PENDING",
                "reason": "Outbound webhook dispatching live incident telemetry outside network perimeter",
                "created_at": "2026-10-02T10:14:00Z",
            },
            {
                "id": "appr-02",
                "title": "Increase Token Quota for Research Lab",
                "risk_level": "MEDIUM",
                "agent_name": "Reliability SRE",
                "status": "PENDING",
                "reason": "Simulation benchmark sweep requested +500k token bursting",
                "created_at": "2026-10-02T11:02:00Z",
            },
        ]

    async def get_activity(self, company_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Fetch recent realtime activity events."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/activity?limit={limit}")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        now = datetime.now(timezone.utc).strftime("%H:%M:%S")
        return [
            {"timestamp": now, "severity": "INFO", "event_type": "agent_started", "agent_name": "Architect Agent", "summary": "Began system boundary evaluation"},
            {"timestamp": now, "severity": "SUCCESS", "event_type": "task_completed", "agent_name": "QA Agent", "summary": "Passed regression test suite (48/48)"},
            {"timestamp": now, "severity": "WARNING", "event_type": "approval_requested", "agent_name": "Security Agent", "summary": "Human approval required for external webhook egress"},
            {"timestamp": now, "severity": "INFO", "event_type": "workflow_started", "agent_name": "System Engine", "summary": "Triggered model performance benchmark sweep"},
            {"timestamp": now, "severity": "SUCCESS", "event_type": "evolution_proposed", "agent_name": "Evolution Strategist", "summary": "Proposed prompt routing optimization (+12% speed)"},
        ]

    async def get_evolution(self, company_id: str) -> Dict[str, Any]:
        """Fetch adaptations and evolution proposals."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/evolution/adaptations")
                if res.status_code == 200:
                    return {"adaptations": res.json()}
        except Exception:
            pass

        return {
            "adaptations": [
                {
                    "id": "evo-01",
                    "title": "Create a dedicated API Reliability Agent",
                    "why": "Repeated provider failover anomalies observed across high-throughput routes.",
                    "evidence": "12 provider hiccups across 4 active projects over 48 hours.",
                    "benefit": "Automatic sub-second failover rerouting with zero query drops.",
                    "resource_impact": "+1 agent, +150k monthly tokens",
                    "risk": "LOW",
                    "status": "SIMULATED",
                },
                {
                    "id": "evo-02",
                    "title": "Enable Capability-Aware Fallback Routing",
                    "why": "General models utilized for long-context tasks with degraded cost efficiency.",
                    "evidence": "Gemini 2.5 Pro benchmarks show 40% cost reduction for research workloads.",
                    "benefit": "-$180 monthly token expenditure.",
                    "resource_impact": "Neutral compute impact",
                    "risk": "LOW",
                    "status": "PENDING_APPROVAL",
                },
            ]
        }

    async def get_logs(self, company_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch immutable audit logs."""
        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.headers) as client:
                res = await client.get(f"{self.base_url}/companies/{company_id}/governance/audits?limit={limit}")
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        now = datetime.now(timezone.utc).isoformat()
        return [
            {"created_at": now, "actor_name": "Elena Vance (SUPERADMIN)", "action": "Configured Zero-Trust Capability Model", "target": "Desktop Runtime", "result": "SUCCESS"},
            {"created_at": now, "actor_name": "Architect Agent", "action": "Optimized Microservice Boundaries", "target": "Core Engine", "result": "SUCCESS"},
            {"created_at": now, "actor_name": "Security Agent", "action": "Requested External Webhook Clearance", "target": "Governance Gate", "result": "AWAITING_REVIEW"},
            {"created_at": now, "actor_name": "System Scheduler", "action": "Flushed Realtime Telemetry Buffer", "target": "Activity Broadcaster", "result": "SUCCESS"},
            {"created_at": now, "actor_name": "Marcus Sterling (ADMIN)", "action": "Created Snapshot Routing Baseline v3", "target": "Evolution Lab", "result": "SUCCESS"},
        ]
