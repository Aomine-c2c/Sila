# MISSING CAPABILITIES — NEXORA
**Date:** 2026-09-25
**Scope:** Everything required to reach a production-ready NEXORA MVP

---

## Overview

Since the project is a greenfield, every capability is "missing." This document catalogs
them by system layer and classifies each by phase (MVP, Growth, Scale) and type
(Infrastructure, Feature, AI, Platform).

---

## Layer 1: Foundation Infrastructure

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| Git repository + branch strategy | Infrastructure | MVP | main + develop + feature branches |
| `.gitignore` for Python/Node/env files | Infrastructure | MVP | |
| Monorepo workspace config (pnpm workspaces or turborepo) | Infrastructure | MVP | |
| `docker-compose.yml` for local dev | Infrastructure | MVP | Postgres + Redis + API + Web |
| `Makefile` / task runner for common commands | Infrastructure | MVP | `make dev`, `make test`, `make migrate` |
| Pre-commit hooks (lint, format, secret scan) | Infrastructure | MVP | |
| GitHub Actions CI pipeline | Infrastructure | MVP | Test + lint on every PR |
| Environment variable schema + `.env.example` | Infrastructure | MVP | |

---

## Layer 2: Backend — Core API

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| FastAPI application scaffold | Feature | MVP | Router, middleware, lifespan |
| Pydantic v2 settings management | Feature | MVP | Environment-aware config |
| PostgreSQL connection pool (asyncpg) | Infrastructure | MVP | |
| SQLAlchemy 2.0 async ORM setup | Feature | MVP | |
| Alembic migration system | Infrastructure | MVP | |
| Custom exception handlers + error response schema | Feature | MVP | |
| Health check endpoint (`/health`) | Infrastructure | MVP | DB + Redis liveness |
| OpenAPI schema configuration | Feature | MVP | Title, version, tags |
| Request ID middleware | Infrastructure | MVP | Traceability |
| CORS middleware | Infrastructure | MVP | |
| Structured logging (structlog) | Infrastructure | MVP | |
| Async context per request (tenant injection) | Feature | MVP | Critical for multi-tenancy |

---

## Layer 3: Authentication & Authorization

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| User model (email, hashed password, status) | Feature | MVP | |
| JWT access token generation (RS256) | Feature | MVP | 15-minute TTL |
| JWT refresh token with rotation | Feature | MVP | HttpOnly cookie |
| Token blacklist (Redis) | Feature | MVP | On logout / rotation |
| `/auth/register` endpoint | Feature | MVP | |
| `/auth/login` endpoint | Feature | MVP | |
| `/auth/refresh` endpoint | Feature | MVP | |
| `/auth/logout` endpoint | Feature | MVP | |
| `/auth/me` endpoint | Feature | MVP | Current user + permissions |
| Rate limiting on auth endpoints | Infrastructure | MVP | 5 req/min anon |
| Role model (Admin, Member, Viewer, Agent) | Feature | MVP | |
| Permission scope registry | Feature | MVP | |
| RBAC dependency (`Depends(require_permission(...))`) | Feature | MVP | |
| Tenant isolation middleware | Feature | MVP | Inject tenant_id into every request |
| OAuth2 / SAML SSO integration | Feature | Growth | Enterprise readiness |
| MFA (TOTP) | Feature | Growth | |
| API keys for service-to-service auth | Feature | Growth | |
| Audit log for all auth events | Feature | MVP | Login, logout, failed attempts |

---

## Layer 4: Organization & Workspace Management

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| Tenant model | Feature | MVP | Top-level isolation |
| Tenant creation / provisioning | Feature | MVP | |
| Workspace model (team/project area) | Feature | MVP | |
| Workspace CRUD | Feature | MVP | |
| Workspace membership + roles | Feature | MVP | |
| Member invitation (email-based) | Feature | Growth | |
| Workspace settings (AI budget, autonomy caps) | Feature | Growth | |
| Organization-level billing model | Platform | Scale | |

---

## Layer 5: AI Agent System

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| `LLMProvider` abstract interface | AI | MVP | Provider-agnostic |
| OpenAI provider implementation | AI | MVP | GPT-4o, o1 |
| Anthropic provider implementation | AI | Growth | Claude 3.5+ |
| Local/Ollama provider implementation | AI | Growth | Privacy-sensitive deployments |
| Agent definition model (name, tools, config, autonomy) | AI | MVP | |
| Agent CRUD API | Feature | MVP | |
| `AgentRun` model (execution session) | AI | MVP | |
| `AgentAction` model (individual tool call) | AI | MVP | Full audit trail |
| `AgentRunner` service (orchestrates tool-calling loop) | AI | MVP | |
| Tool registry (list of available tools per agent) | AI | MVP | |
| Built-in tools: web_search | AI | Growth | |
| Built-in tools: read_document | AI | MVP | Knowledge base access |
| Built-in tools: write_draft | AI | MVP | Content generation |
| Built-in tools: query_data | AI | Growth | SQL-safe data queries |
| Built-in tools: send_notification | AI | Growth | |
| Human-in-the-loop approval gate | AI | MVP | For SUPERVISED autonomy mode |
| Agent memory: short-term (session context) | AI | MVP | |
| Agent memory: long-term (vector store) | AI | Growth | |
| Agent memory: procedural (tool result cache) | AI | Growth | |
| Prompt template system (versioned) | AI | MVP | |
| Streaming response support (SSE / WebSocket) | AI | MVP | Token-by-token output |
| Agent cost tracking (token usage) | AI | MVP | Per run, per workspace |
| Agent output validation (Pydantic strict) | AI | MVP | |
| Prompt injection protection | AI | MVP | Input sandboxing |
| Agent scheduling (cron-triggered runs) | AI | Growth | |
| Multi-agent workflows (agent-calls-agent) | AI | Scale | |

---

## Layer 6: Knowledge & Document System

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| Document model (title, content, metadata) | Feature | MVP | |
| Document upload (text, PDF, markdown) | Feature | MVP | |
| Document chunking strategy | AI | MVP | Recursive character splitter |
| Embedding generation (async job) | AI | MVP | OpenAI text-embedding-3-small |
| Vector storage (pgvector) | Infrastructure | MVP | |
| Semantic search API | Feature | MVP | |
| Document versioning | Feature | Growth | |
| Document permission scoping | Feature | Growth | |
| Web crawl / URL ingestion | Feature | Growth | |

---

## Layer 7: Workflow Engine

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| Workflow definition model (steps, triggers, agents) | Feature | Growth | |
| Step types: agent run, human approval, condition, delay | Feature | Growth | |
| Workflow trigger: manual, schedule, webhook, event | Feature | Growth | |
| Workflow run model (execution state) | Feature | Growth | |
| Workflow visual editor (frontend) | Feature | Scale | |

---

## Layer 8: Real-time & Notifications

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| WebSocket connection manager | Infrastructure | MVP | Per-user channels |
| Agent output streaming (WebSocket) | AI | MVP | Token streaming |
| Agent status push (thinking/acting/done) | AI | MVP | |
| In-app notifications model | Feature | Growth | |
| Notification delivery (WebSocket push) | Feature | Growth | |
| Email notification (transactional) | Feature | Growth | |

---

## Layer 9: Frontend

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| Next.js 14+ app scaffold (App Router) | Feature | MVP | |
| Design system (tokens, typography, colors) | Feature | MVP | |
| Authentication UI (login, register) | Feature | MVP | |
| Organization / workspace switcher | Feature | MVP | |
| Dashboard (home) — org at a glance | Feature | MVP | |
| Agent library — browse, configure agents | Feature | MVP | |
| Agent chat interface (streaming output) | Feature | MVP | |
| Document library UI | Feature | MVP | |
| Workflow builder UI (basic) | Feature | Growth | |
| Audit log viewer | Feature | MVP | |
| Settings pages (user, workspace, org) | Feature | MVP | |
| Dark mode | Feature | MVP | |
| Responsive layout (desktop-first) | Feature | MVP | |
| Real-time status indicators | Feature | MVP | Agent active, thinking, error |
| TypeScript client (auto-generated from OpenAPI) | Infrastructure | MVP | |

---

## Layer 10: Observability & Operations

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| Structured JSON logging (structlog) | Infrastructure | MVP | |
| Log levels (DEBUG/INFO/WARNING/ERROR) | Infrastructure | MVP | |
| Request tracing (correlation IDs) | Infrastructure | MVP | |
| Sentry error tracking (backend + frontend) | Infrastructure | MVP | |
| Prometheus metrics endpoint | Infrastructure | Growth | |
| Grafana dashboard | Infrastructure | Growth | |
| OpenTelemetry traces | Infrastructure | Growth | |
| Automated backups (PostgreSQL dump) | Infrastructure | MVP | Daily cron |
| Database connection health checks | Infrastructure | MVP | |
| Deployment runbook | Documentation | MVP | |

---

## Layer 11: Testing

| Capability | Type | Phase | Notes |
|-----------|------|-------|-------|
| pytest setup with async support | Infrastructure | MVP | |
| Test database (isolated per test) | Infrastructure | MVP | |
| Factory Boy fixtures | Infrastructure | MVP | |
| Unit tests: auth system | Feature | MVP | |
| Unit tests: RBAC / permission checks | Feature | MVP | |
| Unit tests: agent runner (mocked LLM) | AI | MVP | |
| Unit tests: tool execution | AI | MVP | |
| Unit tests: embedding pipeline | AI | Growth | |
| Integration tests: API endpoints | Feature | MVP | |
| E2E tests: critical user flows (Playwright) | Feature | Growth | |
| CI test gate (no merge without green tests) | Infrastructure | MVP | |

---

## Summary Counts

| Phase | Total Capabilities |
|-------|-------------------|
| MVP (Phase 1) | ~75 capabilities |
| Growth (Phase 2) | ~40 capabilities |
| Scale (Phase 3) | ~15 capabilities |
| **Total** | **~130 capabilities** |

The MVP phase alone represents a substantial engineering effort.
Strict scope discipline is required to reach it within a reasonable timeline.
