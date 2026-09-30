# Development Guide

## Local setup

- API: Python 3.11+, `cd apps/api`, install the `dev` extra, and configure `DATABASE_URL` as needed.
- Web: Node.js 20+, `cd apps/web`, then `npm ci`.
- Local defaults are intended for development, not production deployment.

## Verification

From the repository root, `make test-api` runs API tests and `make test-web` runs frontend tests. `make lint` runs configured linters. Run the narrow affected test first, then the relevant regression suite. Provider integration tests may require live credentials and should not be assumed to have run unless explicitly reported.

## Change expectations

Preserve domain boundaries, provider neutrality, tenant isolation, least privilege, explicit state transitions, and human authority over consequential changes. Update architecture and operational records when behavior or risks change. Do not treat readiness claims as evidence without repeatable verification.
