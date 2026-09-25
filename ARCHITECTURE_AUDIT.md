# ARCHITECTURE AUDIT — NEXORA
**Audit Date:** 2026-09-25
**Status:** Greenfield — Prescriptive Architecture (no existing architecture to audit)

---

## Summary

Because the project is a greenfield, this document is not a retroactive audit of existing
architecture — it is a **prescriptive architecture blueprint** that establishes the target
state and the reasoning behind each decision. Every decision made here should be treated as
an Architectural Decision Record (ADR).

---

## System Identity

**NEXORA** — an AI-native Organization Operating System.

NEXORA is not a feature-set. It is a platform that allows organizations to:
- Define their operational workflows in natural language
- Delegate repetitive decisions to autonomous AI agents
- Surface real-time organizational intelligence into a unified interface
- Maintain full auditability of every AI-assisted action

---

## Recommended System Architecture

### Topology

```
┌─────────────────────────────────────────────────────────┐
│                    NEXORA Platform                       │
│                                                         │
│   ┌──────────────┐     ┌──────────────────────────┐     │
│   │   Frontend   │────▶│     API Gateway (HTTPS)  │     │
│   │  (Next.js)   │◀────│     + Rate Limiting       │     │
│   └──────────────┘     └──────────┬───────────────┘     │
│                                   │                      │
│              ┌────────────────────┼───────────────┐      │
│              │                    │               │      │
│      ┌───────▼──────┐  ┌─────────▼──────┐  ┌────▼───┐  │
│      │  Core API    │  │  Agent API      │  │ WS Hub │  │
│      │  (FastAPI)   │  │  (FastAPI)      │  │(async) │  │
│      └───────┬──────┘  └─────────┬──────┘  └────┬───┘  │
│              │                    │               │      │
│      ┌───────▼────────────────────▼───────────────┘      │
│      │              Service Layer                        │
│      └───────┬──────────────┬────────────────────────┐   │
│              │               │                        │   │
│      ┌───────▼──────┐  ┌───▼──────────┐  ┌─────────▼─┐ │
│      │  PostgreSQL  │  │ Vector DB    │  │   Redis   │ │
│      │  (primary)   │  │ (pgvector /  │  │  (cache + │ │
│      │              │  │  Qdrant)     │  │   queue)  │ │
│      └──────────────┘  └──────────────┘  └───────────┘ │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              Worker Pool (Celery)                │   │
│   │   Agent Runner │ Embedding Jobs │ Report Engine  │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │           LLM Adapter Layer                      │   │
│   │   OpenAI | Anthropic | Gemini | Local (Ollama)   │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ADR-001: Backend Framework — FastAPI

**Decision:** Use FastAPI (Python) as the primary API framework.

**Rationale:**
- Native async (asyncio) — critical for non-blocking LLM calls
- Python is the dominant language for AI/ML tooling (LangChain, LlamaIndex, OpenAI SDK, etc.)
- Auto-generates OpenAPI/JSON Schema — enables TypeScript type generation
- Pydantic v2 models enforce strict typing at the boundary
- Excellent DI system via `Depends()`
- SQLAlchemy + Alembic ecosystem is mature and production-tested

**Alternatives considered:**
- Django + DRF: Synchronous by default, heavier for AI workloads (though good RBAC patterns from swms)
- Node.js (Express/Hono): Weaker AI ecosystem; splitting language from frontend adds cognitive overhead
- Go (Gin/Chi): Fastest, but AI library ecosystem is immature

---

## ADR-002: Frontend Framework — Next.js (App Router)

**Decision:** Use Next.js 14+ with the App Router.

**Rationale:**
- Server Components allow AI-generated content to be rendered server-side with zero client bundle impact
- Streaming RSC enables real-time AI output rendering (token-by-token)
- Built-in API routes for lightweight BFF (Backend for Frontend) patterns
- Strong TypeScript support
- Vercel or self-hosted deployment flexibility

**Alternatives considered:**
- Vite + React SPA: No SSR; streaming is harder; more infra to set up
- Remix: Good but smaller ecosystem and fewer AI-specific patterns

---

## ADR-003: Database — PostgreSQL + pgvector

**Decision:** PostgreSQL as the primary relational store, with the `pgvector` extension for embeddings.

**Rationale:**
- Single database for both relational data AND vector similarity search reduces operational complexity
- pgvector supports HNSW indexes for high-performance ANN search
- JSONB columns for flexible AI metadata without sacrificing query-ability
- Full ACID guarantees for transactional operations
- SQLAlchemy + Alembic for ORM and migrations

**When to add Qdrant:**
If vector search becomes a performance bottleneck (>10M vectors, complex filtering), Qdrant can be
added as a dedicated vector store without changing the relational schema.

---

## ADR-004: Authentication — JWT + Refresh Token Rotation

**Decision:** JWT access tokens (15-minute TTL) + rotating refresh tokens (7-day TTL) stored HttpOnly.

**Rationale:**
- Stateless access tokens enable horizontal API scaling
- Rotating refresh tokens (blacklist on use) prevent replay attacks
- HttpOnly cookie for refresh token prevents XSS theft
- Future: OAuth2 / SAML SSO integration for enterprise tenants

**Implementation:**
- `python-jose` for JWT signing (RS256 with key pair)
- Refresh token stored in PostgreSQL with `jti` claim for revocation
- Rate limiting on token endpoints (5 req/min anon)

---

## ADR-005: Authorization — Hierarchical RBAC + Permission Scopes

**Decision:** Role-Based Access Control with fine-grained permission scopes.

**Rationale:**
- Organizations need role templates (Admin, Member, Viewer, Agent-only)
- Individual permission overrides needed for complex orgs
- Permission checks must be tenant-scoped (cannot leak across organizations)

**Design:**
```
Tenant → Workspace → Role → PermissionSet → User
                           ↓
                    Agent PermissionScope (subset)
```

Agents have their own permission scopes — they can be granted narrower permissions than the
user who spawned them. This is the "principle of least privilege" for AI agents.

---

## ADR-006: AI Agent Architecture — Tool-Calling with Human-in-the-Loop

**Decision:** Agents are stateful, tool-calling entities with configurable autonomy levels.

**Core concepts:**
- **Agent Definition:** YAML/JSON config (name, tools, permissions, autonomy level)
- **Agent Run:** A single execution session with full audit trail
- **Tool:** A typed function the agent can invoke (API call, DB query, web search, file write)
- **Autonomy Level:** `SUPERVISED` (every action needs approval) → `AUTONOMOUS` (acts freely within scope)
- **Memory:** Short-term (session), Long-term (vector store), Procedural (tool results)

**Framework:** Start with direct OpenAI/Anthropic tool-calling APIs.
Abstract behind a provider-agnostic `AgentRunner` interface.
Do not adopt LangChain/LlamaIndex as a hard dependency initially — they add complexity.
Add only what the codebase needs.

---

## ADR-007: Real-time Layer — WebSockets via FastAPI

**Decision:** Use FastAPI's native WebSocket support for real-time agent output streaming.

**Use cases:**
- Token-by-token LLM response streaming
- Agent status updates (thinking → acting → done)
- Live dashboard metric updates
- Collaborative workspace notifications

**Pattern:**
- FastAPI WebSocket endpoint per "room" (agent run, workspace, user session)
- Redis Pub/Sub as the broadcast backbone (multiple API workers)
- Client reconnect logic with exponential backoff

---

## ADR-008: Background Tasks — Celery + Redis

**Decision:** Celery with Redis as broker for all async/long-running work.

**Workloads:**
- LLM inference jobs (when not streaming)
- Document ingestion and chunking
- Embedding generation
- Scheduled agent runs
- Report generation
- Notification delivery

**Alternative:** If the workload is lightweight, FastAPI's `BackgroundTasks` suffices for MVP.
Celery is the P1 addition, not P0.

---

## ADR-009: Multi-Tenancy — Schema-per-Tenant with Shared Infrastructure

**Decision:** Logical multi-tenancy via a `tenant_id` foreign key on all resource tables,
with row-level security enforced at the service layer.

**Rationale:**
- True schema-per-tenant is operationally complex at scale
- `tenant_id` columns with SQLAlchemy session-level filtering are simpler and sufficient for early stage
- RLS (Row Level Security) at PostgreSQL level as a defense-in-depth measure

**Tenant isolation rules:**
- Every model that is not global MUST have a `tenant_id` column
- The base repository class MUST always inject `tenant_id` into every query
- Cross-tenant queries are forbidden and must raise an exception

---

## ADR-010: Observability — Structured Logging + OpenTelemetry

**Decision:** Structured JSON logging via `structlog` + OpenTelemetry for distributed tracing.

**Stack:**
- `structlog` for structured Python logs
- OpenTelemetry SDK for traces and metrics
- Prometheus metrics endpoint (`/metrics`)
- Grafana dashboards (self-hosted or Grafana Cloud)
- Sentry for exception tracking (both frontend and backend)

---

## Monorepo Structure (Recommended)

```
/home/sila/Projects/Sila/
├── .github/
│   └── workflows/          ← CI/CD pipelines
├── apps/
│   ├── api/                ← FastAPI backend
│   │   ├── nexora/
│   │   │   ├── agents/     ← Agent definitions and runner
│   │   │   ├── auth/       ← JWT, RBAC
│   │   │   ├── core/       ← Base models, exceptions, dependencies
│   │   │   ├── orgs/       ← Tenant/org management
│   │   │   ├── workflows/  ← Workflow engine
│   │   │   └── ...
│   │   ├── tests/
│   │   ├── alembic/
│   │   └── pyproject.toml
│   └── web/                ← Next.js frontend
│       ├── app/            ← App Router pages
│       ├── components/
│       ├── lib/
│       └── package.json
├── packages/               ← Shared code (if needed)
├── infrastructure/
│   ├── docker/
│   └── k8s/
├── docker-compose.yml
└── README.md
```

---

## Data Model Core Entities (Phase 1)

```
Tenant          — top-level isolation boundary
  └── Workspace — project/team area within a tenant
        └── Member       — user membership + role in workspace
        └── Agent        — AI agent definition
        └── AgentRun     — single execution instance
              └── AgentAction  — individual tool call or message
        └── Workflow     — multi-step process definition
        └── Document     — knowledge base item
              └── Chunk  — embedding-ready text chunk
```

---

## Security Architecture

| Layer | Control |
|-------|---------|
| Transport | TLS 1.3 enforced; HSTS |
| Authentication | JWT RS256; refresh token rotation |
| Authorization | RBAC + tenant isolation on every query |
| Input validation | Pydantic strict mode on all API boundaries |
| Agent safety | Tool allowlist per agent; action confirmation for SUPERVISED agents |
| Rate limiting | Token bucket per IP and per user |
| Secrets | Environment variables; never hardcoded; .env.example only |
| Dependencies | Dependabot / pip-audit in CI |
| Logging | No PII in logs; structured and queryable |
