# NEXORA Architecture

## Current structure

NEXORA is a monorepo with a FastAPI service in `apps/api` and a Next.js application in `apps/web`. The API is organized by organizational domain (agents, organizations, workflows, intelligence, governance, memory, resources, and related domains). SQLAlchemy models and repositories own persisted state; service and engine modules implement domain behavior. Provider adapters normalize model calls behind intelligence routing. The frontend uses the API through typed clients and dashboard routes.

## Trust and authority boundaries

- Agents are organizational records with capabilities and governance constraints; a model is only an intelligence provider.
- External inputs and model output are untrusted. Validate outputs before they trigger tools or state changes.
- Tool access must be capability-scoped and bounded to approved resources. Humans retain approval authority for consequential organizational changes.
- Tenant ownership is checked at API/repository boundaries. Persisted decisions and workflow state should remain attributable and auditable.

## Runtime and persistence

The current default database is SQLite for local development; PostgreSQL support is configured through `DATABASE_URL`. Long-running work currently executes in-process. Production deployment therefore requires a durable worker strategy and operational database configuration.

## Known architectural gaps

See [ROADMAP.md](ROADMAP.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md), and [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md). In particular, the security helpers are defensive checks, not an operating-system sandbox or a complete SSRF defense against DNS rebinding.

## Frontend presentation boundary

The frontend visual system is defined by shared CSS variables in `apps/web/src/app/globals.css` and Tailwind mappings. Its current graphite/lime palette, grouped command navigation, and CSS-only organization constellation express NEXORA's people/agents/governance model without coupling product meaning to one provider. Operational status copy should be computed from loaded API state; presentation must not invent health or provider availability.

The control room reads tasks from each organization's real project task endpoints and memory from the organization memory API. Missing telemetry is nullable and surfaced as unavailable; successful empty responses are shown as empty states. Rejected domain requests are listed so empty data is not confused with missing data.
