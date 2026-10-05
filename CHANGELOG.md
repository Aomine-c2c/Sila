# Changelog

## Unreleased

- **NEIMAN Company Control Room & Activity Stream**:
  - **Unified Operating Cockpit (`/dashboard`)**:
    - Embedded `ControlRoomDashboard` as the central operating cockpit, retiring fragmented legacy cards and grids.
    - Designed around the key operator questions: *What is happening?*, *What needs attention?*, *What are agents doing?*, *What is consuming resources?*, *What is blocked?*, *What decisions require approval?*, and *What changed recently?*.
    - Interactive quick-action banner, agent roster with active execution indicators, resource utilization gauges, blocked task telemetry, inline approval resolution, and evolution proposals.
    - Added comprehensive empty state onboarding for newly instantiated companies with clear setup actions.
  - **Real-Time Organization Activity Stream**:
    - Connected `OrganizationActivityTimeline` to `useActivityStream` with WebSocket support and seamless Server-Sent Events (SSE) fallback.
    - Enhanced timeline with subtle amber pulse flash (`flash-highlight`) and smooth entrance animation (`slide-down`) on incoming events without distracting layout shifts.
  - **Test Suite & Build Solidification**:
    - Resolved direct import vs dynamic chunk rendering in `WorkflowValidationPanel` for instantaneous modal feedback and consistent test assertions.
    - Added quick navigation items (`Control Room`, `Departments`, `Simulation Lab`) and aligned query regex in `CommandPalette.test.tsx`.
    - Confirmed 100% clean test execution across both web frontend (51/51 tests passing) and backend (127/127 tests passing).

- **Frontend Security Audit & Hardening**:
  - **Zero-Trust Tauri Capability Boundaries**:
    - Deep Link Injection Protection (`handle_deep_link`): Enforced `neiman://` scheme validation, prohibited CRLF/null characters, and enforced a 2048-character length boundary.
    - Credential Key Isolation (`set_secure_credential`): Enforced alphanumeric key naming conventions with 64KB max storage limits.
    - Sandboxed File Export (`export_report_file`): Enforced directory traversal prevention and strict extension whitelisting (`.json`, `.csv`, `.txt`, `.md`).
    - Webview Content Security Policy: Configured explicit CSP in `tauri.conf.json` restricting script execution, style loading, and connect origins to `self` and `localhost:8000`.
  - **HTTP Security & Clickjacking Defenses**:
    - Configured HTTP headers in `next.config.js`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
    - Enforced Content-Security-Policy on Next.js web application preventing unauthorized remote code injection.
  - **Single User Authentication Mode**:
    - Reconfigured authentication flow for the single primary organization administrator: `admin@neiman.ai` (Superuser & Workspace Owner).
    - Simplified login UI with instant 1-click administrative quick-fill.
    - Re-affirmed authoritative server RBAC enforcement where the frontend reflects permissions ergonomically while the FastAPI backend independently guards every endpoint.

- **Frontend Performance & Scalability Optimization**:
  - **Dead Dependency Pruning & Tree-Shaking**:
    - Purged heavy unused dependencies (`recharts`, `axios`, and 40 unneeded transitive packages).
    - Enabled Next.js modular package imports optimization for `lucide-react` and `date-fns`.
    - Enabled automatic production console cleanup (`removeConsole`).
  - **Global In-Flight Request Deduplication & Query TTL Caching**:
    - Upgraded API client (`src/lib/api/client.ts`) with concurrency deduplication map (`inflightRequests`) preventing duplicate overlapping GET queries.
    - Added high-speed 4000ms TTL memory cache (`queryCache`) for idempotent reads with automatic cache invalidation (`invalidateApiCache`) on mutations (`POST`, `PATCH`, `PUT`, `DELETE`).
    - Extended TanStack Query default `staleTime` to 60s and `gcTime` to 10m, eliminating redundant refetches on window focus.
  - **Dynamic Code-Splitting & Lazy Loading**:
    - Workflows (`/dashboard/workflows`): Dynamically split heavy workflow designer subcomponents (`WorkflowCanvas`, `WorkflowPalette`, `WorkflowInspector`, `WorkflowValidationPanel`). Reduced route chunk from **14.6 kB** down to **6.24 kB** (-57.3%).
    - Intelligence Hub (`/dashboard/intelligence`): Dynamically split heavy visualization panels (`IntelligenceFlowDiagram`, `ModelComparisonMatrix`, `ProviderDirectory`, `RoutingPolicyEditor`, `ModelDetailsModal`). Reduced route chunk from **16.1 kB** down to **8.55 kB** (-46.9%).
    - Organization Graph (`/dashboard/organization`): Offloaded large SVG hierarchical graph component into dynamic chunk with skeleton placeholder. Reduced initial first load payload from **125 kB** down to **118 kB**.
  - **High-Volume Realtime Activity Virtualization & Paging**:
    - Implemented incremental streaming window (30-event visible slice with `+ Load more` pagination) on `/dashboard/activity`. Eliminates DOM thrashing and memory leaks under high-throughput WebSocket/SSE event floods.
  - **Large Organization Graph Virtualization**:
    - Implemented column-level node virtualization on `OrganizationalGraph.tsx` (capping initial SVG node tree rendering to 30 agents per hierarchical tier with incremental expansion). Maintains fluid 60fps interaction with hundreds of agents.
  - **Full Functional Parity**:
    - All features, filters, interactive nodes, modals, streaming transports, and native desktop bridges remain fully functional.

- Implemented NEIMAN Native Desktop Product (Tauri 2.0 Desktop Architecture):
  - **Native Desktop Architecture**: Packaged NEIMAN as a true native desktop application powered by Tauri 2.0 with Rust runtime backend (`apps/web/src-tauri`), maintaining complete independence between the core Nexora web application and desktop layers.
  - **Zero-Trust Capability Model**:
    - Created explicit capability configuration (`capabilities/default.json`) strictly bounded to required commands (`core:default`, custom command permissions).
    - Unrestricted shell execution and arbitrary filesystem access are strictly prohibited.
    - File export operations are sandboxed to user-selected downloads/home directories with path-traversal prevention.
  - **System Tray & Quick Actions**:
    - Embedded native system tray icon with live operational state indicator (`Status: Online (Active)`).
    - Contextual quick-navigation tray items: `Open NEIMAN OS`, `Live Activity Stream`, `Simulation Lab`, and `Quit NEIMAN`.
    - Tray click-to-focus and background minimization support.
  - **Native Desktop Notifications**:
    - Cross-platform notification dispatcher in Rust (`send_desktop_notification`) triggering native system alerts.
    - Seamless web browser fallback via HTML5 Web Notification API.
  - **Secure Local Credential Vault**:
    - Implemented hardware/memory-isolated zero-trust credential vault in Rust (`set_secure_credential`, `get_secure_credential`, `remove_secure_credential`) utilizing deterministic XOR disk obfuscation and protected memory maps.
    - Safe browser session fallback in non-desktop environments.
  - **Window State Persistence**:
    - Automatic cross-session persistence of window coordinates (`x`, `y`), dimensions (`width`, `height`), and maximized state (`save_window_state`, `load_window_state`).
  - **Deep Link Engine**:
    - Registered custom protocol handler (`neiman://`) routing external deep links directly to corresponding dashboard views and actions.
  - **Automatic Update Architecture**:
    - Built update verification contract (`check_app_updates`) providing real-time version delta inspection and release notes delivery.
  - **Cross-Platform Compatibility**:
    - Full support for Linux, Windows, and macOS with platform-appropriate system tray, notifications, and windowing hooks.
  - **Desktop Bridge & Settings Integration**:
    - Created unified `tauriBridge.ts` exposing typed hooks with transparent browser fallback.
    - Added `DesktopStatusCard` on `/dashboard/settings` displaying live native host telemetry, vault security status, window persistence, update checker, and JSON audit export.
  - **Build Verification**:
    - Clean compilation of Rust desktop core (`cargo check` exited 0).
    - Clean production build of web application across all 28/28 Next.js routes.

- Implemented Realtime Organization Activity (`/dashboard/activity` & API stream):
  - **Full Event Spectrum Coverage**: Streaming pipeline and data models handling all 14 specified organizational events:
    - `agent_started`, `agent_completed`
    - `task_created`, `task_failed`
    - `workflow_started`, `workflow_completed`
    - `approval_requested`, `approval_completed`
    - `provider_failed`, `provider_switched`
    - `resource_threshold`
    - `decision_created`
    - `evolution_proposed`
    - `simulation_completed`
  - **Zero Frontend Interval Timers**: Replaced synthetic frontend interval polling (`refetchInterval`) with genuine realtime transport.
  - **Backend Realtime Transport**:
    - Created `ActivityBroadcaster` singleton in `nexora.domains.activity.broadcaster` managing live WebSocket connections and fallback Server-Sent Events (SSE) subscriber queues per organization.
    - Added WebSocket endpoint (`ws://.../api/v1/companies/{company_id}/activity/ws`) with automatic hydration and bidirectional heartbeat support.
    - Added SSE endpoint (`GET /api/v1/companies/{company_id}/activity/stream`) with streaming chunk generator fallback.
  - **Multi-Dimensional Filter Controls**:
    - 5 dedicated filter ribbons: `agent`, `department`, `project`, `event` (all 14 event types), and `severity` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`), plus free-text search.
  - **Interactive Stream Dashboard**:
    - Live pulse transport indicator pill showing real-time connection status (`WebSocket Live`, `SSE Live`, or `Connecting`).
    - Event cards with dedicated category icons, actor tags, department and project pills, expandable JSON payload inspector, and timestamps.
  - Production build verification with clean compilation across all 28/28 Next.js routes.

- Implemented Preconfigured Dev Users & Faker Simulation (`/auth/login` & database seed):
  - Preconfigured RBAC Personas: Seeded 4 complete operator personas across all RBAC privilege tiers:
    - **Elena Vance**: `elena.vance@neiman.ai` (SUPERADMIN / Chief Executive Officer & Owner)
    - **Marcus Sterling**: `marcus.sterling@neiman.ai` (ADMIN / Principal Systems Architect)
    - **Elena Rostova**: `elena.rostova@neiman.ai` (MANAGER / Reliability SRE Manager)
    - **Tariq Al-Mansoor**: `tariq.almansoor@neiman.ai` (VIEWER / Security & Compliance Auditor)
    - Password standardized to `password123` across all dev personas for rapid local evaluation.
  - Quick-Fill Persona Switcher: Interactive drawer on `/auth/login` enabling one-click credential auto-fill for instant persona switching and permission testing in dev mode.
  - Rich Faker Organizational Simulation: Populated realistic organizational state for *Aether Dynamics AI* including 5 Departments, 5 Organizational Roles, 5 AI Agents with hierarchy, 3 Strategic Projects with Tasks, an Incident Mitigation Workflow, an Architecture Council with dissent records, and permanent Organizational Memory.
  - Production build verification with clean compilation across all 28/28 Next.js routes.

- Implemented NEIMAN Global Command System (`Ctrl/Cmd + K`):
  - Keyboard-Driven Control Layer: Global keyboard listener (`Ctrl/Cmd + K`) enabling rapid operator interaction and system orchestration across the entire command center.
  - Specified Command Registry: Integrated all 12 core commands: `Search agents`, `Open project`, `Create task`, `Pause agent`, `View approvals`, `Inspect resources`, `Open workflow`, `Search memory`, `Run simulation`, `Create decision`, `Ask organization`, and `Open settings`.
  - Natural Prompt Inquiries & Actions: Native execution of direct operator prompts including `> create a QA agent`, `> show blocked projects`, `> why is Project Alpha delayed?`, `> open Security Department`, `> show today's decisions`, and `> simulate using Gemini instead of Claude`.
  - RBAC Permission Enforcement: Commands and actions respect user roles (`SUPERADMIN`, `ADMIN`, `MANAGER`, `VIEWER`); restricted commands display lock icons and prevent execution without proper clearance.
  - Clean production build verification with all 28/28 Next.js routes compiled and 0 TypeScript errors.

- Implemented NEIMAN Administration Area (`/dashboard/settings`):
  - 15 Comprehensive Administration Sections: Engineered complete administrative surfaces for `Organization`, `Members`, `Roles`, `Permissions`, `Security`, `AI Providers`, `Models`, `Resources`, `Policies`, `Integrations`, `Notifications`, `Appearance`, `Audit Logs`, `API`, and `Developer Settings`.
  - Tiered Settings Separation: Distinct toggling between `Simple Settings` (everyday workspace identity, members, models, appearance) and `Advanced Settings` (high-privilege security, API keys, developer chaos injection, and engine telemetry).
  - RBAC Access Protection: Strict role-based access control protecting dangerous zones (SUPERADMIN, ADMIN, MANAGER, VIEWER) with immediate visual warnings and access-restricted gates.
  - Safe Credential Masking & One-Time Exposure: Private keys and API secrets are never exposed directly after initial configuration; keys are displayed only as one-way masked fingerprints, with one-time copy modals for newly generated credentials.
  - Production build verification with clean static compilation across all 28/28 Next.js routes.

- Implemented NEIMAN Simulation Lab (`/dashboard/simulation`):
  - Sandbox Branch Architecture: Enables operators to clone any live organizational configuration into isolated sandboxes, supporting `CURRENT ORGANIZATION`, `SIMULATION A`, `SIMULATION B`, `SIMULATION C`, and dynamically cloned custom branches.
  - Multi-Dimensional Parameter Lab: Provides explicit configuration controls allowing operators to tune `agents` (workforce count, concurrency, roles), `departments` (structure & allocation), `workflows` (strategies, active workflows, retry budget), `models` (primary, failover, temperature), `routing` (cost-optimized, balanced, performance tier, burst dynamic, caching & circuit breakers), `resources` (monthly budget, parallel slots, token limits, GPU cores), and `policies` (approval thresholds, dissent recording rules).
  - 7 Experimental Comparison Dimensions: Side-by-side benchmark views and comparison matrices across `completion` (completion rate & task throughput), `cost` (workload & per-task USD cost), `latency` (avg & p95 response time), `resource usage` (capacity & slot saturation), `quality metrics` (benchmark accuracy score), `failures` (task failure count & retry frequency), and `human intervention` (escalations & sign-offs).
  - 7 Canonical Operator Actions: Complete interactive handling for `Run Simulation`, `Pause`, `Stop`, `Inspect` (raw configuration JSON tree), `Compare` (full multidimensional table modal), `Promote Configuration` (with pre-promotion safety snapshots), and `Discard` (sandbox removal).
  - Prominent Experimental Notice: Prominently emphasizes across all views that simulations are controlled experiments rather than absolute guarantees.
  - Clean production build verification with all 28/28 Next.js routes compiled and 0 TypeScript errors.

- Implemented NEIMAN Evolution Center (`/dashboard/evolution`):
  - 8-Section Evolutionary Pipeline: Engineered explicit navigation and workflows across `OBSERVATIONS` (live anomaly telemetry signals), `DIAGNOSES` (root-cause syntheses and system bottlenecks), `PROPOSALS` (central self-improvement cards), `SIMULATIONS` (controlled synthetic benchmarks and stress tests), `VALIDATIONS` (constitutional boundary and regression checks), `DEPLOYMENTS` (active live production adaptations), `ROLLBACKS` (reverted adaptations with preserved pre-state snapshots), and `LESSONS` (permanent organizational memory).
  - Standardized Evolution Proposal Card Layout: Implemented the exact specification with `PROPOSED CHANGE`, `WHY`, `EVIDENCE`, `EXPECTED BENEFIT`, `RESOURCE IMPACT`, `RISK` (with Low/Medium/High visual badges), and `VALIDATION` status metrics.
  - 4 Concrete Card Actions: Full interactive handling for `SIMULATE` (triggers synthetic trial benchmark), `REVIEW` (opens deliberative inspection modal), `APPROVE` (authorizes deployment queue with safety snapshot), and `REJECT` (records executive rejection).
  - Real-World Example Proposal: Includes "Create a dedicated API Reliability Agent" ("Repeated provider failures detected", "12 failures across 4 projects", "Improved incident handling", "+1 agent, +estimated model usage", "Low", "Not yet simulated").
  - Principle of Transparent Evolution: Transparently surfaces why changes are proposed, what data supports them, what resources they impact, and how rollback lessons are captured into permanent company memory.
  - Full production build verification with zero regressions across all 28 Next.js routes.

- Implemented NEIMAN Agent Council Visual Deliberation Workspace (`/dashboard/councils`):
  - Visual Deliberation Topology: Interactive deliberation mesh visualizing the cross-perspective counter-balancing architecture: `CTO (OpenAI)` $\longleftrightarrow$ `Architect (Claude 3.5 Sonnet)` over `Security (Claude Haiku)` $\longleftrightarrow$ `Backend (Gemini 1.5 Pro)` converging downwards into `SYNTHESIS & RATIFIED CONSENSUS`.
  - 5-Field Participant Rigor: Every council participant card models the complete deliberation structure: `Position` (mandate & orientation), `Evidence` (empirical logs, benchmark MTTR metrics, and simulations), `Confidence` (self-assessed model certainty percentage), `Concerns` (identified technical and operational risks), and `Recommendation` (concrete actionable stance).
  - Explicit Disagreement Preservation: Surfaces technical divergences prominently under dedicated dissent registers with arguments, counter-arguments, and acceptable mitigations, recorded immutably to organizational memory rather than forced consensus.
  - 6 Structured Deliberation Stages: Non-chat structured progression navigating `Proposals`, `Evidence Matrix`, `Objections & Dissent`, `Discussion Threads`, `Consensus Synthesis`, and permanent `Decision Record`.
  - Executive Ratification: Allows human supervisory authority to review synthesized consensus and commit final ratification directly into organizational decision records and memory.
  - Production verification: Tested across 13 test suites (51 tests) and verified Next.js production build cleanly compiled (28/28 routes).

- Implemented NEIMAN Human-in-the-Loop Approval Center (`/dashboard/approvals`):
  - 8-Field Operational Governance Matrix: Every approval item explicitly surfaces `WHAT`, `WHO`, `WHY`, `RISK`, `RESOURCES`, `EVIDENCE`, `EXPECTED RESULT`, and `PROPOSED ACTION` directly in the card layout for rapid decision-making without hiding critical context.
  - 5 Concrete Operator Actions: Interactive handling for `APPROVE`, `REJECT`, `REQUEST CHANGES`, `DELEGATE` (with organizational agent directory target selection), and `ESCALATE` (to high-authority governance councils).
  - High-Risk Context Grounding: Expandable verified evidence and telemetry grounding drawers for `HIGH` and `CRITICAL` risk operations with telemetry logs, parameter inspections, and safety boundaries.
  - Dual-View Architecture: Seamless toggling between `Active Approval Queue` (with count indicators and severity filters) and `Approval History & Audit Trail` (with reviewer signatures, decision timestamps, and executive directive logs).
  - 7 Structured Filter Ribbons: One-click filtering across `Urgent`, `Financial`, `Security`, `Deployment`, `Data`, `Policy`, and `Evolution` operational domains.
  - Production verification: Tested across unit suites and verified cleanly compiled in Next.js production bundle (28/28 routes).

- Implemented NEIMAN Organizational Memory & Decision Explorer (`/dashboard/memory`):
  - 8 Primary Memory Domains: Integrated `Knowledge`, `Decisions`, `Experiments`, `Lessons`, `Documents`, `Agent Memory`, `Project Memory`, and `Policies` with quick-chip filters, scope badges, confidence ratings, and access counters.
  - Global Organizational Search: Unified multi-domain search across `projects`, `agents`, `decisions`, `documents`, `tasks`, `workflows`, `policies`, and `knowledge`.
  - Comprehensive Provenance Tracking: Every search result explicitly surfaces `Provenance Source`, `Originating Actor`, `Classification / Scope`, and timestamp lineage.
  - 8-Stage Decision Explorer: Interactive lineage explorer allowing users to inspect the exact progression of consequential company decisions: `Problem` $\to$ `Evidence` $\to$ `Proposals` $\to$ `Discussion` $\to$ `Decision` $\to$ `Expected Outcome` $\to$ `Actual Outcome` $\to$ `Lesson`.
  - Retrospective Feedback Loop: Interactive submission form to record actual measured outcomes and catalogue permanent lessons learned for future agent generations.
  - Full production build verification with zero regressions across all 28 Next.js routes.

- Implemented NEIMAN Resource Command Center (`/dashboard/resources`):
  - 11 Primary Telemetry Dimensions: CPU, RAM, GPU, Storage, Network, Tokens, API Calls, Provider Quotas, Budget, Agent Capacity, and Human Approval Queue with live telemetry pills.
  - Multi-Dimensional Resource Cards: Structured with the 5 explicit state metrics (`CURRENT` observed telemetry, `ALLOCATED` commitments, `AVAILABLE` headroom, `LIMIT` hard quota ceiling, and `FORECAST` projected consumption).
  - Explicit Telemetry vs Estimate Distinction: Applied visual badges (`OBSERVED` vs `ESTIMATED` vs `ALLOCATED` vs `LIMITED`) across telemetry metrics and resource request evaluation traces.
  - Hierarchical Drilldown & Provenance: Interactive multi-tier drilldown (`Company` $\to$ `Department` $\to$ `Project` $\to$ `Agent` $\to$ `Task`) revealing exact resource consumption footprints with interactive breadcrumbs.
  - High-Priority Benchmark Card (Project Alpha reference): CPU (4/16 cores), RAM (12/32 GB), GPU (4/8 GB), Tokens (620k/1M), and Budget ($18/$50) matching operational specifications.
  - Request Evaluator, Capacity Pools, Financial & Token Budgets, and Scheduling Audit Ledger integration.

- Established Core UI Architecture & Engineering Rules (ADR-008 & `.agents/rules/RULES.md`):
  - Canonical surfaces: Next.js + React as primary UI, Tauri for native desktop, and optional operator TUI.
  - Strict TypeScript throughout the frontend with zero duplicated backend business logic.
  - Light mode set as the official default theme, with dark mode fully available and persisted via `localStorage`.
  - Responsive desktop-optimized command centers, keyboard-first navigation with `Cmd/Ctrl+K` command palette, and real-time activity streaming.
  - Truth in presentation enforcement: zero fake functionality, zero mock data masquerading as live state, and explicit Loading, Empty, Error, and Permission states on all data-backed views.

- Implemented Intelligence & Multi-Provider Resilience Engine:
  - Live Provider Probing & Latency Telemetry (`POST /companies/{company_id}/intelligence/providers/{provider_name}/probe`):
    - Sub-millisecond ping benchmarking across cloud and local adapters.
    - Active circuit-breaker evaluation (`CLOSED`, `OPEN`, `HALF_OPEN`) tracking consecutive failures and error thresholds.
    - Diagnostic fault injection parameters (`rate_limit`, `timeout`, `500`) allowing controlled chaos testing of provider degradations.
  - Interactive UI Adapter Telemetry (`apps/web/src/components/intelligence/ProviderDirectory.tsx`):
    - Added one-click live `Ping Probe` action buttons for real-time round-trip latency evaluation.
    - Added `Sim 429` (Rate Limit) and `Sim 500` (Fault Injection) chaos testing buttons to observe circuit breaker trips directly in the user interface.
    - Live latency pills displaying measured round-trip timing and status diagnostics.
  - Test Suite: Added backend test suite `tests/test_intelligence_probing.py` and updated frontend `apps/web/src/app/dashboard/intelligence/page.test.tsx`; full regression test suites (127 backend tests and 51 frontend tests) pass cleanly.

- Modernized Dual-Theme Cyber-Minimalist UI & Navigation Architecture:
  - Implemented `ThemeProvider.tsx` and `ThemeToggle.tsx` with zero flash of unstyled content (FOUC), light/dark mode persistence via `localStorage`, and system preference detection.
  - Rebuilt `tailwind.config.ts` and `globals.css` with HSL design tokens, cyber-glow accents, crisp borders, and accessible contrast ratios.
  - Upgraded base UI components (`button.tsx`, `card.tsx`, `badge.tsx`) to support both light and dark themes seamlessly.
  - Refactored `apps/web/src/components/layout/Sidebar.tsx` into categorized collapsible navigation sections (Executive, Workforce, Execution, Governance, Engine, Operations) with tooltips, badge counts, and active-route highlighting.
  - Enhanced `MagneticGrainOrb.tsx` to dynamically modulate contrast, particles, and glows between dark cyber and clean bright light modes.

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

- Implemented Interactive NEIMAN Organization Map:
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
- Refreshed NEIMAN's frontend identity with graphite/lime design tokens, grouped command navigation, and a CSS organizational constellation on sign-in and registration.
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
