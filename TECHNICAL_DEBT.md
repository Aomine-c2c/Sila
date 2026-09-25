# TECHNICAL DEBT REGISTER — NEXORA
**Date:** 2026-09-25
**Status:** Greenfield — No inherited debt. Forward-looking debt prevention register.

---

## Overview

There is zero inherited technical debt because the codebase does not yet exist.
This document serves as a **debt prevention register** — identifying the shortcuts,
anti-patterns, and deferred decisions that commonly accumulate in AI-native platforms
during early development, so that they can be actively avoided or explicitly tracked
when introduced as intentional trade-offs.

All entries below are **prospective risks**, not current problems.

---

## Debt Category 1: AI Integration Debt

### D-AI-001 — Hard-coded LLM provider
**Risk:** Calling `openai.chat.completions.create()` directly in business logic.
**Impact:** Cannot switch providers; cannot test offline; vendor lock-in.
**Prevention:** All LLM calls go through a `LLMProvider` interface from Day 1.
**Status:** ⬜ Not yet incurred — architecture mandates provider abstraction.

### D-AI-002 — Unstructured prompt management
**Risk:** Prompts stored as f-strings inline in code.
**Impact:** Cannot version, test, A/B, or audit prompts.
**Prevention:** Prompts stored as versioned templates in a `prompts/` directory with typed Pydantic input schemas.
**Status:** ⬜ Prevention strategy defined.

### D-AI-003 — No agent output validation
**Risk:** Trusting LLM JSON output without schema validation.
**Impact:** Silent data corruption; security vulnerabilities via prompt injection.
**Prevention:** All agent outputs validated against Pydantic models with strict mode.
**Status:** ⬜ Prevention strategy defined.

### D-AI-004 — Synchronous LLM calls in request handlers
**Risk:** Running LLM inference inside an HTTP request-response cycle.
**Impact:** Request timeouts; blocked workers; poor UX.
**Prevention:** All non-trivial LLM calls go to the async task queue. Streaming responses use WebSockets.
**Status:** ⬜ Prevention strategy defined.

---

## Debt Category 2: Data Model Debt

### D-DM-001 — Missing tenant_id on new models
**Risk:** A developer creates a new model without a `tenant_id` column.
**Impact:** Data leaks across tenants; security incident.
**Prevention:** Base model class enforces `tenant_id`; CI lint rule checks all migrations.
**Status:** ⬜ Prevention strategy defined.

### D-DM-002 — JSONB overuse
**Risk:** Using JSONB columns as a "schema escape hatch" for everything.
**Impact:** Cannot query, index, or enforce invariants on JSONB fields.
**Prevention:** JSONB is only permitted for: agent metadata, tool configs, audit payloads. All other data gets typed columns.
**Status:** ⬜ Policy defined.

### D-DM-003 — Missing soft-delete pattern
**Risk:** Using hard `DELETE` on records that agents or audit trails reference.
**Impact:** Broken foreign keys; lost audit history.
**Prevention:** All business entities use `is_deleted` + `deleted_at` soft delete. Hard delete is forbidden on 10 core entity types.
**Status:** ⬜ Prevention strategy defined.

### D-DM-004 — No migration governance
**Risk:** Developers run destructive migrations without backup/review.
**Impact:** Data loss in production.
**Prevention:** CI blocks migrations that drop columns/tables without a deprecation period. Pre-migration backup required in production deploy script.
**Status:** ⬜ Prevention strategy defined.

---

## Debt Category 3: API Debt

### D-API-001 — No API versioning from Day 1
**Risk:** Starting without `/api/v1/` prefix and versioning strategy.
**Impact:** Breaking changes affect all clients simultaneously; impossible to deprecate gracefully.
**Prevention:** All routes prefixed `/api/v1/`. Version bump policy documented in ARCHITECTURE_AUDIT.md.
**Status:** ⬜ Prevention mandated.

### D-API-002 — `fields = '__all__'` serializers
**Risk:** Exposing every model field by default (common in DRF patterns).
**Impact:** Over-fetching; leaking internal fields; harder to change model without breaking API contract.
**Prevention:** All Pydantic response schemas are explicit. No `model_fields = '__all__'` patterns.
**Status:** ⬜ Prevention strategy defined.

### D-API-003 — No pagination on list endpoints
**Risk:** Returning unbounded lists.
**Impact:** Performance degradation; memory exhaustion with large datasets.
**Prevention:** All list endpoints use cursor-based pagination by default. Page size capped at 100.
**Status:** ⬜ Prevention mandated.

---

## Debt Category 4: Security Debt

### D-SEC-001 — DEBUG=True left in production
**Risk:** Forgetting to set `DEBUG=False` and secure config in production.
**Impact:** Stack traces exposed; admin interfaces accessible.
**Prevention:** CI/CD pipeline rejects deployment if `DEBUG=True` is detected in the environment.
**Status:** ⬜ Prevention strategy defined.

### D-SEC-002 — Agent prompt injection vulnerabilities
**Risk:** User-provided data inserted directly into agent prompts without sanitization.
**Impact:** Agent manipulated to take unauthorized actions.
**Prevention:** All user-supplied content is sandboxed within a `<user_input>` XML tag and agents are instructed not to follow instructions within that tag.
**Status:** ⬜ Prevention strategy defined.

### D-SEC-003 — Secrets in version control
**Risk:** `.env` files committed to git, API keys in code.
**Impact:** Credential exposure.
**Prevention:** `.gitignore` includes all `.env*` files. Pre-commit hook checks for common secret patterns (git-secrets / detect-secrets).
**Status:** ⬜ Prevention mandated.

---

## Debt Category 5: Testing Debt

### D-TEST-001 — No tests for agent logic
**Risk:** LLM-backed agent code has no unit tests because "it's non-deterministic."
**Impact:** Silent regressions in agent behavior.
**Prevention:** Agent logic is unit-tested with mocked LLM responses. Deterministic tool-calling logic is tested independently of the LLM.
**Status:** ⬜ Prevention strategy defined.

### D-TEST-002 — No contract tests between frontend and backend
**Risk:** TypeScript types and OpenAPI schema diverge silently.
**Impact:** Runtime type errors in production.
**Prevention:** TypeScript client is auto-generated from the OpenAPI schema in CI. Build fails if generated types differ from committed types.
**Status:** ⬜ Prevention strategy defined.

---

## Debt Category 6: Operational Debt

### D-OPS-001 — Manual deployments
**Risk:** Deployments done by hand without CI/CD.
**Impact:** Human error; inconsistent environments; no audit trail for deployments.
**Prevention:** No production deployments without a passing CI pipeline. Infrastructure as Code from Day 1.
**Status:** ⬜ Prevention mandated.

### D-OPS-002 — No runbook for AI failures
**Risk:** Agent or LLM failures have no documented response procedure.
**Impact:** Downtime confusion; no clear ownership.
**Prevention:** Runbook template to be created alongside first agent deployment.
**Status:** ⬜ Deferred to Phase 2 — track as planned debt.

---

## Intentional Debt Tracker

The following are **accepted trade-offs** for speed in Phase 1. They are not mistakes —
they are documented decisions to be revisited.

| ID | Accepted Debt | Rationale | Target Resolution |
|----|--------------|-----------|------------------|
| INT-001 | Single-region deployment | Cost; complexity not justified yet | Phase 3 |
| INT-002 | No Kubernetes (docker-compose only) | Operational overhead not justified at MVP | Phase 3 |
| INT-003 | Basic in-process WebSocket (no Redis pub/sub) | Sufficient for single-instance MVP | Phase 2 |
| INT-004 | SQLite acceptable for local dev | Developer convenience | Never in production |
| INT-005 | No full-text search (basic ILIKE) | pgvector similarity covers semantic search | Phase 2 |

---

## Debt Health Score

Current score: **N/A — Greenfield**
Target score at Phase 1 completion: **95/100** (5 points reserved for intentional debt INT-001 through INT-005)
