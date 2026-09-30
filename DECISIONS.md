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

## ADR-004: Data-led operational interface

**Status:** Accepted. **Date:** 2026-09-30.

Use an organization-first graphite/lime design system with named navigation zones. Operational summaries derive their claims from API state; a polished interface must not imply healthy execution, model availability, or completed governance when those facts are not available. Keep visual treatments CSS-native and shared across routes so product identity remains provider-neutral.

## ADR-005: Development-only authentication bypass for UI review

**Status:** Accepted. **Date:** 2026-09-30.

Allow the local Next.js development server to render protected routes only when an explicit preview flag is set and NODE_ENV is development. Keep API authorization intact and show a persistent preview notice. The bypass must remain impossible in production builds and must not invent a user. For explicitly requested design review, permit a synthetic dashboard fixture behind this same local-only gate; keep it read-only, unpersisted, conspicuously labeled, and outside every API path.
