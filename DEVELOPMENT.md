# Development Guide

## Local setup

- API: Python 3.11+, `cd apps/api`, install the `dev` extra, and configure `DATABASE_URL` as needed.
- Web: Node.js 20+, `cd apps/web`, then `npm ci`.
- Local defaults are intended for development, not production deployment.

## Verification

From the repository root, `make test-api` runs API tests and `make test-web` runs frontend tests. `make lint` runs configured linters. Run the narrow affected test first, then the relevant regression suite. Provider integration tests may require live credentials and should not be assumed to have run unless explicitly reported.

## Change expectations

Preserve domain boundaries, provider neutrality, tenant isolation, least privilege, explicit state transitions, and human authority over consequential changes. Update architecture and operational records when behavior or risks change. Do not treat readiness claims as evidence without repeatable verification.

## Local frontend UI preview

The ignored local apps/web/.env.development.local file enables NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS for the Next.js development server. Open /dashboard to inspect protected UI routes without signing in.

AuthGuard allows this only when both NODE_ENV=development and the explicit flag are present. Production builds cannot enable the bypass. Every dashboard route uses the same read-only sample organization and route-specific fixtures, with a persistent synthetic-data notice. Fixtures live in `apps/web/src/lib/api/controlRoomPreview.ts` and `apps/web/src/lib/api/previewFixtures.ts`; they are not persisted, and preview API requests return locally without network access. Writes and sign-out are blocked in preview mode.

The Control Room presents this organization as an interactive office map. Select a room or employee to inspect it; the room console links to shared memory, governance, decisions, provider, and resource views. The floorplan maps the first three department records by ID. When an organization has additional departments or employees outside those rooms, the UI calls that out and points to the complete organization graph. The visualization is not a separate source of truth.
