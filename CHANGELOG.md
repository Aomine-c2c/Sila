# Changelog

## Unreleased

- Implemented AI Workforce Interface (`/dashboard/agents` and `AgentProfileDrawer`):
  - Agent Directory: Fleet summary telemetry counters (`Total Fleet`, `Available`, `Working`, `Blocked`), real-time search, Department & Status filtering (`AVAILABLE`, `WORKING`, `BLOCKED`, `WAITING`, `PAUSED`, `OFFLINE`), and responsive Grid/Table view toggles.
  - Agent Profile Spec Layout: Implemented the exact 7-row profile specification matching enterprise operational cards:
    1. Identity header & Status badge with live transition controls (`STATUS: WORKING`, etc.).
    2. Role / Department / Manager hierarchy badges.
    3. CURRENT MISSION & OKRs with key responsibilities tags.
    4. Intelligence mesh provider badges (`Claude`, `Gemini`, `OpenAI`, `Local`).
    5. CAPABILITIES matrix.
    6. TOOLS execution whitelist.
    7. RESOURCE USAGE & quotas (tokens consumed, cumulative spend, daily budget cap).
    8. ACTIVITY / MEMORY / DECISIONS provenance preview.
  - Dual-Mode Agent Creation & Configuration:
    - Simple Mode: intuitive, low-friction configuration of role, mission, autonomy level, and preferred intelligence mesh without dangerous low-level complexity.
    - Advanced Mode: granular control over system instructions & constraints, tools, permissions, routing, daily budgets & token limits, memory scope, escalation rules, and evaluation benchmarks.
  - Telemetry & Tracing: Deep drawer tabs for 10-step autonomous task execution traces, persistent organizational memory items, performance metrics, and consequential activity logs.
  - Test Verification: Added unit test suite `apps/web/src/app/dashboard/agents/page.test.tsx`; 10/10 test suites and 36/36 tests passing cleanly.

- Implemented Interactive NEXORA Organization Map:
  - 6-Tier Operational Hierarchy: `COMPANY` $\to$ `DEPARTMENTS` $\to$ `ROLES` $\to$ `AGENTS` $\to$ `PROJECTS` $\to$ `TASKS`.
  - Interactive Canvas: Smooth mouse drag-to-pan, zoom in/out with boundary clamping, 100% reset, and persistent telemetry counters.
  - Search & Filters: Real-time query search matching nodes across all tiers, filter dropdown by Department, and filter by Agent Status (`AVAILABLE`, `WORKING`, `BLOCKED`, `WAITING`, `PAUSED`, `OFFLINE`).
  - Tree Management: Expandable/collapsible departments hiding/revealing subordinate roles and agents with dynamic agent count tags.
  - Distinct Operational States: Visually distinct agent statuses with pulse animations for active work (`WORKING`), alert indicators for blockers (`BLOCKED`), and custom badges for `WAITING`, `PAUSED`, `OFFLINE`, and `AVAILABLE`.
  - Agent Inspector Panel: Deep operational drawer rendering Identity, Role, Department, Manager link, Active Task & Project, Intelligence Provider & Model, Tools list, Permissions matrix, Daily Budget & Token Usage, and Recent Activity audit stream.
  - Unit Tests: Added comprehensive Jest test suite verifying full hierarchy rendering, search filtering, status filtering, department collapse/expansion, and agent inspector panel interactions. 30/30 frontend tests passing cleanly.

- Implemented Phase 2 Application Shell:
  - Canonical topbar with global search trigger, Command Palette (`Cmd/Ctrl+K`) for rapid keyboard-first navigation across all domains, Organization Switcher with multi-company dropdown selection, and real-time Alerts/Notifications drawer.
  - Collapsible and mobile-responsive Sidebar covering all organizational domains: Control Room, Organizations, Departments, Agents, Projects, Tasks, Workflows, Councils, Provider Mesh, Org Memory, Evolution Lab, Simulation Lab, Decisions, Approvals, Governance, Resources, Blueprints, and Settings.
  - Implemented missing route views: `/dashboard/departments` (hierarchy tree and creation), `/dashboard/projects` (roadmaps and budgets), `/dashboard/tasks` (backlog and Kanban), `/dashboard/simulation` (Monte Carlo lab benchmarks), and `/dashboard/approvals` (Human-in-the-Loop executive review queue).
  - Added TypeScript API client `projectsApi` for Projects and Tasks endpoints (`/api/v1/companies/{company_id}/projects` and `/tasks`).
  - Added unit test `CommandPalette.test.tsx`; all 24 frontend tests across 9 suites and 30 backend regression tests pass cleanly.

- Added an explicit local development-only auth bypass for UI review; production auth remains guarded. The Control Room now renders a clearly labeled, synthetic organization with representative operational records. Its approval controls are read-only, fixtures are not persisted, and the fixture path makes no API requests.
- Refreshed NEXORA's frontend identity with graphite/lime design tokens, grouped command navigation, and a CSS organizational constellation on sign-in and registration.
- Removed synthetic control-room tasks, providers, memory, and resource telemetry from live/API mode; added real task and memory loading, explicit unavailable states, and data-led status presentation. Synthetic examples are available only in the explicit local UI preview.
- Aligned project/task status and provider mappings with backend response schemas; removed seeded graph nodes, unsupported progress percentages, and the hard-coded fallback-chain illustration.
- Removed a hard-coded demo company ID from the legacy intelligence view. Frontend verification before the synthetic preview change: lint and TypeScript pass, 12 Jest tests pass, and the optimized Next.js production build completes. Desktop and mobile login compositions inspected in the production browser.
- Synthetic preview verification: TypeScript, lint, and all 13 frontend tests pass; the optimized production build completes; the local dashboard was visually reviewed with populated organization records. Sample approvals are disabled, sample performance metrics are labeled, and unavailable performance data is no longer presented as live in API mode.
- Reframed the Control Room as a navigable isometric headquarters: department rooms, selectable employee tokens, a human review suite, provider switchboard, shared memory and policy links, and a capacity console. Added a shared grain and route-aware workspace strip across dashboard pages. Room names and employee assignment now follow department records by ID; additional teams are disclosed instead of being misrouted into a pictured room. Reduced-motion support remains in place and no runtime dependency was added.
- Frontend verification after the office and data-mapping updates: TypeScript, ESLint, all 20 Jest tests, `git diff --check`, and the optimized Next.js production build pass.

- Hardened filesystem path containment against sibling-prefix escapes and disabled filesystem access when no allowed roots are configured.
- Hardened outbound URL parsing and exact hostname allowlist matching to reject malformed URLs and allowlist suffix spoofing.
- Preserved provider-reported token usage and measured latency, adding estimates only when providers omit usage values (including local models).
- Added focused regression cases for these boundary failures and adapter accounting behavior.
- Added canonical architecture, roadmap, decision, security, development, and known-issues records.
- Verification: focused security/adapter/intelligence groups passed (26 tests); full API suite passed (125 tests).
- Corrected security readiness wording to document source-defined audit-key and network/runtime isolation limitations.
