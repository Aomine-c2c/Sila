# NEXORA ROADMAP — Implementation Plan
**Date:** 2026-09-25
**Version:** 1.0
**Status:** Implementation-Ready

---

## Vision

**NEXORA** is an AI-native Organization Operating System.

It gives organizations a unified platform to define their processes as AI-assisted workflows,
delegate decisions to autonomous agents, and maintain full observability and control over
every AI action taken on their behalf.

### North Star Metric
Time-to-value for a new agent deployed in a real organizational workflow < 30 minutes.

---

## Staged Migration Path

Since the project is a greenfield, "migration" here means: the staged build path from
zero code to a production-ready AI-native platform.

```
Phase 0: Foundation        ← You are here
Phase 1: Core Platform     ← MVP, first deployable NEXORA
Phase 2: AI Intelligence   ← Agents become capable and trustworthy
Phase 3: Scale & Enterprise ← Multi-region, enterprise auth, marketplace
```

---

## Phase 0: Foundation (Week 1–2)
**Goal:** A running, testable shell that all future work builds on.

### 0.1 — Repository Setup
- [ ] `git init` at `/home/sila/Projects/Sila`
- [ ] Create `.gitignore` (Python, Node, env files, IDE)
- [ ] Create `README.md` with project vision
- [ ] Set up branch strategy: `main` (production) + `develop` (integration) + `feature/*`
- [ ] Create `CONTRIBUTING.md`

### 0.2 — Monorepo Structure
```
Sila/
├── apps/
│   ├── api/        ← FastAPI backend
│   └── web/        ← Next.js frontend
├── packages/       ← Shared types/utils (optional)
├── infrastructure/
│   └── docker/
├── docker-compose.yml
├── .env.example
└── Makefile
```

### 0.3 — Docker Compose Local Environment
Services:
- `postgres:16` — primary database
- `redis:7` — cache + message broker
- `api` — FastAPI (hot-reload with `--reload`)
- `web` — Next.js (hot-reload)

### 0.4 — Backend Scaffold
- [ ] `pyproject.toml` with FastAPI, SQLAlchemy 2.0, asyncpg, Alembic, pydantic-settings, structlog, pytest
- [ ] App factory pattern (`create_app()`)
- [ ] Settings class (environment-aware)
- [ ] Health check endpoint (`GET /health`)
- [ ] Request ID middleware
- [ ] CORS middleware
- [ ] Structured logging setup
- [ ] Custom exception handlers
- [ ] Alembic initialized

### 0.5 — Frontend Scaffold
- [ ] `npx create-next-app@latest apps/web --typescript --app --tailwind`
- [ ] Design token system (colors, typography, spacing)
- [ ] Base layout (sidebar + topbar)
- [ ] Dark mode toggle
- [ ] OpenAPI client codegen setup (`openapi-typescript-codegen`)

### 0.6 — CI Pipeline
- [ ] GitHub Actions: on PR → lint + test + type-check
- [ ] Pre-commit: black, ruff, mypy, detect-secrets

**Exit Criteria:** `make dev` starts the full stack. `make test` runs and passes. Frontend renders a shell page.

---

## Phase 1: Core Platform MVP (Week 3–8)
**Goal:** A deployable multi-tenant platform with authentication, user management, and a basic agent chat interface.

### 1.1 — Database & Multi-Tenancy
- [ ] `Tenant` model + migration
- [ ] `Workspace` model + migration
- [ ] Base model mixin with `tenant_id`, `created_at`, `updated_at`, soft-delete
- [ ] Tenant context middleware (injects `tenant_id` into request state)
- [ ] Repository base class (always scopes queries to `tenant_id`)

### 1.2 — Authentication System
- [ ] `User` model (email, hashed password, status, role)
- [ ] `Role` model (name, permission_scopes)
- [ ] JWT service (RS256 keypair, access + refresh tokens)
- [ ] Token blacklist (Redis)
- [ ] `POST /api/v1/auth/register`
- [ ] `POST /api/v1/auth/login`
- [ ] `POST /api/v1/auth/refresh`
- [ ] `POST /api/v1/auth/logout`
- [ ] `GET /api/v1/auth/me`
- [ ] RBAC `Depends(require_permission(...))` decorator
- [ ] Rate limiting on auth endpoints
- [ ] Audit log for auth events
- [ ] Tests: full auth flow, token rotation, rate limiting, RBAC

### 1.3 — Organization Management API
- [ ] `POST /api/v1/orgs/` — create organization (creates tenant)
- [ ] `GET /api/v1/orgs/me` — current user's org
- [ ] `POST /api/v1/workspaces/` — create workspace
- [ ] `GET /api/v1/workspaces/` — list workspaces
- [ ] `POST /api/v1/workspaces/{id}/members/` — add member
- [ ] `DELETE /api/v1/workspaces/{id}/members/{user_id}` — remove member
- [ ] Tests: multi-tenant isolation (user A cannot see user B's data)

### 1.4 — Agent Definition System
- [ ] `Agent` model (name, description, system_prompt, tool_configs, autonomy_level)
- [ ] `AgentRun` model (agent, workspace, status, started_at, ended_at, cost_tokens)
- [ ] `AgentAction` model (run, action_type, tool_name, input, output, duration_ms, approved)
- [ ] `POST /api/v1/agents/` — define agent
- [ ] `GET /api/v1/agents/` — list workspace agents
- [ ] `PATCH /api/v1/agents/{id}` — update agent config
- [ ] `DELETE /api/v1/agents/{id}` — deactivate agent
- [ ] Tests: CRUD, permission gating, tenant isolation

### 1.5 — LLM Integration Layer
- [ ] `LLMProvider` abstract base class
- [ ] `OpenAIProvider` implementation (chat completions, tool calling, streaming)
- [ ] `LLMMessage` / `LLMResponse` typed models
- [ ] Token usage tracking
- [ ] Provider selection from agent config
- [ ] Tests: mocked provider, tool-calling loop, streaming output

### 1.6 — Agent Runner
- [ ] `AgentRunner` service class
- [ ] Tool registry (maps tool names to Python functions)
- [ ] Agentic loop: LLM → tool call → result → LLM → ...
- [ ] `SUPERVISED` mode: pause at each tool call, await human approval
- [ ] `AUTONOMOUS` mode: execute all tools within permitted scope
- [ ] Run creation, status transitions, action logging
- [ ] Cost accumulation per run
- [ ] `POST /api/v1/agents/{id}/runs` — start a run
- [ ] `GET /api/v1/runs/{run_id}` — get run status
- [ ] `GET /api/v1/runs/{run_id}/actions` — get action log
- [ ] `POST /api/v1/runs/{run_id}/approve` — approve pending action (SUPERVISED mode)
- [ ] Tests: full mock LLM run, tool execution, approval gate

### 1.7 — Real-time Streaming
- [ ] WebSocket connection manager (per-user channel)
- [ ] `GET /api/v1/ws` — WebSocket upgrade
- [ ] Agent run output streaming (token by token)
- [ ] Agent status updates (thinking / calling tool / waiting / complete)
- [ ] Frontend: streaming chat UI with status indicators

### 1.8 — Document Knowledge Base
- [ ] `Document` model (title, content, file_type, metadata)
- [ ] `DocumentChunk` model (document, chunk_index, content, embedding vector)
- [ ] Document upload endpoint
- [ ] Chunking service (recursive character splitter)
- [ ] Embedding generation (async, via background task)
- [ ] Semantic search API (`POST /api/v1/search`)
- [ ] `read_document` tool implementation (for agents)
- [ ] Tests: upload, chunk, embed, search

### 1.9 — Frontend: Core UI
- [ ] Login / register pages
- [ ] Dashboard (workspace overview)
- [ ] Agent library (list, create, configure)
- [ ] Agent chat page (start run, stream output, approve actions)
- [ ] Document library (upload, browse, search)
- [ ] Audit log viewer
- [ ] Settings (user profile, workspace)

### 1.10 — Observability & Deployment
- [ ] Sentry integration (backend + frontend)
- [ ] Prometheus metrics endpoint
- [ ] PostgreSQL automated backup script (daily cron)
- [ ] `Dockerfile` for API and Web (multi-stage build)
- [ ] Production `docker-compose.prod.yml`
- [ ] Deployment runbook (`DEPLOYMENT.md`)
- [ ] Environment variable documentation

**Exit Criteria:** A user can register, create an org, configure an agent, upload a document,
start an agent run, watch it stream in real-time, and approve or reject its tool calls.
Full audit trail persisted. All tests pass. Deployable to a Linux VPS.

---

## Phase 2: AI Intelligence (Week 9–16)
**Goal:** Agents become genuinely useful. Workflows emerge. Knowledge management matures.

### 2.1 — Workflow Engine
- [ ] `Workflow` model (name, trigger, steps definition JSON)
- [ ] `WorkflowRun` model (execution state machine)
- [ ] Step types: `agent_run`, `human_approval`, `condition`, `delay`, `webhook`
- [ ] Trigger types: `manual`, `schedule` (cron), `webhook`, `event`
- [ ] Workflow runner service (Celery-backed)
- [ ] Workflow API + frontend workflow builder (basic)

### 2.2 — Enhanced Agent Memory
- [ ] Long-term memory: agent-scoped vector memory (remember past interactions)
- [ ] Procedural memory: cache tool results with TTL
- [ ] Memory retrieval: inject relevant memories into system prompt

### 2.3 — Tool Ecosystem Expansion
- [ ] `web_search` tool (SerpAPI or Tavily integration)
- [ ] `query_data` tool (safe, sandboxed SQL on workspace data)
- [ ] `send_notification` tool (in-app + email)
- [ ] `create_event` tool (calendar API stub)
- [ ] Custom tool definition UI (no-code tool builder)

### 2.4 — Agent Analytics
- [ ] Cost dashboard (token spend per agent, per workspace, per period)
- [ ] Performance dashboard (run success rate, avg duration, tool hit rate)
- [ ] Anomaly detection (agents spending more than expected)

### 2.5 — Multiple LLM Providers
- [ ] Anthropic (Claude 3.5+) provider
- [ ] Local / Ollama provider (privacy-sensitive workloads)
- [ ] Provider routing (prefer local for classification, remote for reasoning)

### 2.6 — Collaboration
- [ ] Shared workspaces with real-time presence
- [ ] Agent run annotations (humans can comment on agent actions)
- [ ] Member invitation by email

---

## Phase 3: Scale & Enterprise (Week 17+)
**Goal:** NEXORA is production-grade for enterprise customers.

### 3.1 — Enterprise Authentication
- [ ] SAML 2.0 SSO (Okta, Azure AD, Google Workspace)
- [ ] SCIM provisioning
- [ ] MFA (TOTP + hardware key)
- [ ] API keys for service-to-service

### 3.2 — Scale Infrastructure
- [ ] Kubernetes deployment (Helm charts)
- [ ] Horizontal pod autoscaling
- [ ] Multi-region database (read replicas)
- [ ] CDN for static assets
- [ ] Rate limiting at infrastructure level (Cloudflare / Kong)

### 3.3 — Agent Marketplace
- [ ] Public agent templates (HR, Finance, Engineering, etc.)
- [ ] One-click agent install to workspace
- [ ] Agent versioning and publishing

### 3.4 — Compliance & Governance
- [ ] GDPR data export / deletion
- [ ] SOC 2 Type II audit readiness
- [ ] Data residency controls
- [ ] AI action immutable audit log (append-only)

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 0: Foundation | 2 weeks | Working dev environment, CI, scaffolds |
| 1: Core Platform | 6 weeks | Deployable MVP with auth, agents, streaming |
| 2: AI Intelligence | 8 weeks | Workflows, rich tools, analytics |
| 3: Scale & Enterprise | Ongoing | Enterprise-grade, marketplace |

---

## What Must Not Be Built Before What

This sequence is non-negotiable:

```
1. Multi-tenancy data model (tenant_id) 
   BEFORE any other models
   
2. Authentication + RBAC 
   BEFORE any agent endpoints
   
3. LLMProvider abstraction 
   BEFORE first LLM call
   
4. AgentRunner + action audit log 
   BEFORE any autonomous tool execution
   
5. WebSocket streaming 
   BEFORE frontend agent chat UI
   
6. Tests for auth + RBAC 
   BEFORE any deployment
```

---

## What Should Be Refactored vs Kept vs Added

| Item | Decision | Reason |
|------|----------|--------|
| Everything | ADD (greenfield) | Nothing exists to refactor or keep |
| Patterns from `/home/sila/Projects/swms` | REFERENCE, don't port | Different domain, but good patterns |
| RBAC factory pattern (from swms) | REFERENCE → adapt for NEXORA | Clean permission architecture |
| Audit mixin pattern (from swms) | REFERENCE → adapt | Auto-logging create/update/delete |
| Service layer separation (from swms) | ADOPT | Clean architecture principle |
| Backup engine adapter (from swms) | REFERENCE | Good adapter pattern example |

---

## Implementation-Readiness Checklist

Before Phase 1 begins, the following must be true:

- [ ] Tech stack confirmed (FastAPI + Next.js + PostgreSQL + Redis)
- [ ] Repository initialized with branch strategy
- [ ] Docker Compose running all services locally
- [ ] CI pipeline green (even with empty tests)
- [ ] Design system tokens defined
- [ ] Data model for Phase 1 entities reviewed
- [ ] LLM provider API keys available (OpenAI minimum)
- [ ] Deployment target decided (VPS, cloud, on-prem)

This checklist constitutes the **Phase 0 exit gate**.
Phase 1 does not begin until all boxes are checked.
