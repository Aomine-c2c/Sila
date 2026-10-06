# NEIMAN Gap Analysis

## 1. Blueprints — Fully Implemented

**Backend**: 11 system blueprints (Software Dev, Forex, Marketing, Social Media, Cybersecurity, Research, E-commerce, Game Studio, IT Services, Education, Mining Tech), 13 service methods, 14 REST endpoints, 308-line test suite.

**Frontend**: 1693-line page.tsx with 3 tabs (Catalog, Build My Company, Import/Export), all actions supported (CREATE FROM BLUEPRINT, CUSTOMIZE, DUPLICATE, IMPORT, EXPORT, SAVE AS TEMPLATE), human approval modal with confirmation checkbox.

**Tests**: 5 test methods covering all flows.

## 2. Release Readiness Gaps

| # | Gap | Severity | Location |
|---|-----|----------|----------|
| 1 | No CONTRIBUTING.md | LOW | repo root |
| 2 | No CHANGELOG.md | LOW | repo root |
| 3 | No CHANGELOG.md | LOW | repo root |
| 4 | Dockerfile references `NEIMAN/` but source dir is `nexora/` | HIGH | `apps/api/Dockerfile:27` |
| 5 | docker-compose.yml references `NEIMAN/` | HIGH | `docker-compose.yml` |
| 6 | No `KNOWN_ISSUES.md` referenced by SECURITY.md | MEDIUM | repo root |
| 7 | Release workflow has no test run step before build | MEDIUM | `.github/workflows/release.yml` |
| 8 | No `apps/web/Dockerfile` for web container deployment | MEDIUM | `apps/web/` |
| 9 | No `apps/web/package-lock.json` referenced in CI | LOW | `.github/workflows/ci.yml:24` |
| 10 | No `apps/api/uv.lock` referenced in CI | LOW | `.github/workflows/ci.yml` |
| 11 | No `apps/api/.env.example` referenced in CI | LOW | `apps/api/` |
| 12 | No `apps/web/src-tauri/src-tauri/Cargo.lock` check | LOW | `.github/workflows/release.yml` |

## 3. Documentation Gaps

| # | Doc | Status |
|---|-----|--------|
| 1 | CONTRIBUTING.md | MISSING |
| 2 | CHANGELOG.md | MISSING |
| 3 | KNOWN_ISSUES.md | MISSING (referenced by SECURITY.md) |
| 4 | API Swagger docs | PRESENT (`/docs`, `/redoc`) |
| 5 | Architecture diagram | PRESENT (README.md) |
| 6 | Security policy | PRESENT (SECURITY.md) |
| 7 | Deployment guide | MISSING |

## 4. Milestone Gaps

| # | Milestone | Status |
|---|-----------|--------|
| 1 | 0.1.0 release tag | NOT CREATED |
| 2 | Release notes auto-generation | NOT CONFIGURED |
| 3 | Staging environment deployment | NOT CONFIGURED |
| 4 | Production environment deployment | NOT CONFIGURED |
| 5 | Tauri desktop signing keys | NOT CONFIGURED |
| 6 | GitHub release assets | NOT CONFIGURED |

## 5. Test Coverage Gaps

| # | Area | Status |
|---|------|--------|
| 1 | Blueprint instantiation | COVERED |
| 2 | Build My Company synthesis | COVERED |
| 3 | Save As Template | COVERED |
| 4 | Import/Export JSON | COVERED |
| 5 | Duplicate | COVERED |
| 6 | Customize | COVERED |
| 7 | Simulation dry-run | COVERED |
| 8 | Human approval gate | COVERED |
| 9 | Real API key integration | NOT COVERED (uses mocks) |
| 10 | Real database migration | NOT COVERED (uses SQLite in-memory) |

## 6. Critical Fix Required

**File:** `apps/api/Dockerfile:27`
**Issue:** `COPY NEIMAN/ ./NEIMAN/` and `CMD ["uvicorn", "NEIMAN.main:app", ...]` reference the old directory name `NEIMAN/`. The actual source directory is `nexora/`. This will cause Docker builds to fail.

**Fix:**
- `COPY NEIMAN/ ./NEIMAN/` → `COPY nexora/ ./nexora/`
- `CMD ["uvicorn", "NEIMAN.main:app", ...]` → `CMD ["uvicorn", "nexora.main:app", ...]`

**File:** `docker-compose.yml`
**Issue:** Same directory name mismatch in service configuration.

**Fix:** Update any `NEIMAN/` references to `nexora/` in the docker-compose.yml file.

## 7. CSS Linter False Positive

**File:** `apps/web/src/app/globals.css:1-3`
**Issue:** `@tailwind base; @tailwind components; @tailwind utilities;` trigger "Unknown at rule @tailwind" from CSS linters that don't recognize Tailwind's at-rules.

**Root cause:** No `.stylelintrc.json` or equivalent linter config exists to whitelist Tailwind at-rules. The directives themselves are correct and required by Tailwind CSS.

**Fix options:**
1. Add `.stylelintrc.json` with:
   ```json
   {
     "rules": {
       "at-rule-no-unknown": null,
       "property-no-unknown": null
     }
   }
   ```
2. Or use `postcss-custom-properties` plugin in `postcss.config.js`

**Note:** This is a tooling configuration issue, not a code bug. The `@tailwind` directives are correct and necessary for Tailwind CSS to work.