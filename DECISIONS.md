# Architecture Decisions

## ADR-001: Domain-oriented modular monolith

**Status:** Accepted. **Date:** 2026-09-30.

Keep the API as a modular monolith while domain boundaries and deployment needs are still evolving. Domain packages provide separation without introducing distributed consistency and operational costs prematurely.

## ADR-002: Provider-neutral intelligence boundary

**Status:** Accepted. **Date:** 2026-09-30.

Agents request capabilities and policy-compliant routing; provider adapters implement vendor-specific calls. Provider identity must not define organizational roles or agent identity.

## ADR-003: Defense-in-depth security helpers

**Status:** Accepted with limitations. **Date:** 2026-09-30.

Input sanitizers and tool validators are useful guardrails, but are not substitutes for OS/container isolation, network egress controls, authorization, or human review. Do not describe them as a complete sandbox.
