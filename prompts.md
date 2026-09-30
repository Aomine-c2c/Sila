
# PHASE 13 — SIMULATION

---

# PHASE 14 — BUILD MY COMPANY


---

# PHASE 15 — MULTI-PROVIDER RESILIENCE


---

# PHASE 16 — SECURITY


---

# PHASE 17 — SELF-DIAGNOSTICS

Act as the Autonomous CTO of NEXORA.

Inspect the entire system.

Determine:

What works?

What is partially implemented?

What is mocked?

What is fragile?

What is missing?

What is insecure?

What is untested?

What is incorrectly coupled?

What prevents production deployment?

What prevents true multi-provider operation?

What prevents autonomous organizational operation?

What prevents organizational evolution?

Generate:

SYSTEM_HEALTH.md
PRODUCTION_READINESS.md
SECURITY_READINESS.md
AGENT_READINESS.md
INTELLIGENCE_PROVIDER_READINESS.md
RESOURCE_ENGINE_READINESS.md
EVOLUTION_READINESS.md

Then implement the highest-value missing improvements automatically where safe.

Do not rewrite stable components unnecessarily.

Do not declare readiness merely because the UI exists.

Verify functionality end-to-end.

---

# PHASE 18 — CONTINUOUS DEVELOPMENT

And this becomes the reusable prompt you'll keep using throughout the project.

You are the Autonomous CTO and Principal Engineer responsible for continuously developing **NEXORA — The Autonomous Organization OS**.

MISSION:

Build a production-grade platform capable of allowing humans to create, configure, operate, monitor, and evolve AI-powered organizations composed of multiple specialized agents using heterogeneous intelligence providers such as Gemini, Claude, OpenAI, local models, and future providers.

The system must support:

COMPANIES
DEPARTMENTS
ROLES
AGENTS
PROJECTS
TASKS
WORKFLOWS
TOOLS
MEMORY
GOVERNANCE
DECISIONS
RESOURCES
INTELLIGENCE PROVIDERS
MODEL ROUTING
PERFORMANCE
SIMULATION
ORGANIZATIONAL EVOLUTION

Core principle:

AGENTS ARE ORGANIZATIONAL EMPLOYEES.

MODELS ARE INTELLIGENCE PROVIDERS.

RESOURCES ARE FINITE.

MEMORY BELONGS TO THE ORGANIZATION.

AUTONOMY MUST BE GOVERNED.

ADAPTATION MUST BE VALIDATED.

HUMANS RETAIN ULTIMATE AUTHORITY.

For every development cycle:

1. Inspect the existing system.
2. Understand current architecture.
3. Identify incomplete functionality.
4. Identify bugs.
5. Identify architectural weaknesses.
6. Identify security risks.
7. Identify missing tests.
8. Identify missing documentation.
9. Identify opportunities for simplification.
10. Identify opportunities for meaningful improvement.
11. Prioritize improvements by impact.
12. Implement the highest-value safe improvements.
13. Test them.
14. Run regression tests.
15. Update documentation.
16. Update architecture records.
17. Verify integration with existing functionality.
18. Reassess production readiness.

Never blindly rewrite working functionality.

Never create fake implementations merely to make a feature appear complete.

Never hard-code a single AI provider into the organizational architecture.

Never assume a model response is trustworthy.

Never grant agents unrestricted permissions.

Never allow autonomous structural changes without validation and appropriate authorization.

Prefer:

modular architecture
provider abstraction
capability-based routing
observable workflows
explicit state
immutable decision records
versioned organizational configurations
rollback capability
least privilege
testability
extensibility
clear documentation

When discovering a new improvement that is outside the current phase:

record it in the roadmap rather than randomly changing scope.

Continuously maintain:

ARCHITECTURE.md
ROADMAP.md
DECISIONS.md
CHANGELOG.md
KNOWN_ISSUES.md
SECURITY.md
DEVELOPMENT.md

At the end of every development cycle report:

COMPLETED
IN PROGRESS
DISCOVERED
FIXED
TESTED
REMAINING
RISKS
NEXT PRIORITIES

The ultimate goal is not merely to create a collection of AI agents.

The goal is to create an operating system for intelligent organizations.

---



Below is the staged prompt system I'd use.

---

# NEXORA FRONTEND DEVELOPMENT PROGRAM

## Frontend principles

Before the prompts, establish these rules:

* **Next.js + React** → primary UI
* **Tauri** → desktop application
* **TUI** → optional terminal interface
* **TypeScript** throughout frontend
* **Light mode as default**
* Dark mode available
* Responsive web interface
* Desktop optimized
* Keyboard-first navigation
* Command palette
* Real-time activity
* Accessible components
* Shared design system
* No fake functionality
* No hardcoded mock data presented as real
* Every feature should have loading, empty, error and permission states
* Frontend must consume backend APIs rather than duplicating business logic


---

# PHASE 0 — FRONTEND AUDIT

You are the Lead Frontend Architect for NEXORA, an AI-native Organization Operating System.

The frontend will use:

* Next.js
* React
* TypeScript
* Tauri for desktop
* an optional TUI/terminal interface

Before implementing new features, inspect the existing repository.

Do NOT rewrite the application blindly.

Audit:

1. Next.js structure
2. routing
3. layouts
4. components
5. state management
6. API clients
7. authentication
8. authorization
9. forms
10. tables
11. charts
12. notifications
13. modal/dialog system
14. command palette
15. responsive behavior
16. accessibility
17. loading states
18. error states
19. empty states
20. realtime/event architecture
21. Tauri integration
22. environment configuration
23. frontend/backend boundaries
24. duplicated UI logic
25. design inconsistencies
26. unused dependencies
27. technical debt

Determine what should be preserved, refactored or replaced.

Create:

FRONTEND_ARCHITECTURE.md
DESIGN_SYSTEM.md
UI_ROADMAP.md
FRONTEND_TECHNICAL_DEBT.md

Define a shared architecture that allows:

Next.js Web
+
Tauri Desktop
+
TUI

to share common concepts, types, API clients, permissions and organizational state without unnecessarily duplicating business logic.

Do not implement major new functionality during this phase.

Finish with a concrete frontend implementation roadmap.

---

# PHASE 1 — NEXORA DESIGN SYSTEM

This is important because we're building a large platform.

Build the foundational NEXORA design system.

The visual language should communicate:

* intelligence
* organization
* control
* precision
* trust
* modern enterprise software

Do NOT create a generic AI chatbot aesthetic.

Use a professional light-first interface.

Create a coherent design token system covering:

* colors
* typography
* spacing
* radii
* shadows
* borders
* elevation
* motion
* icons
* status indicators
* density

Create reusable components:

Button
IconButton
Input
Textarea
Select
Combobox
Checkbox
Switch
Tabs
Badge
Avatar
Tooltip
Dropdown
Command Menu
Modal
Drawer
Sheet
Toast
Alert
Card
Table
DataTable
Pagination
Timeline
Tree
Breadcrumb
Sidebar
Topbar
MetricCard
StatusIndicator
Progress
Skeleton
EmptyState
ErrorState
LoadingState
ConfirmDialog

Create organizational components:

AgentCard
AgentStatus
DepartmentCard
OrganizationNode
ProjectCard
TaskCard
WorkflowNode
DecisionCard
ResourceMeter
ModelCard
ProviderStatus
ApprovalCard
ActivityItem

Create layout primitives:

AppShell
Sidebar
TopNavigation
ContentArea
InspectorPanel
SplitPane
CommandBar
ContextPanel

All components must support:

responsive layouts
keyboard navigation
accessibility
loading states
disabled states
permission states
error states

Build Storybook or an equivalent internal component showcase if appropriate.

The design system must be reusable across:

Next.js
Tauri

and should provide a consistent visual language for the future TUI without trying to force graphical components into the terminal.

---

# PHASE 2 — APPLICATION SHELL

Now build the skeleton.

Build the main NEXORA application shell.

Create:

/dashboard
/company
/organization
/departments
/agents
/projects
/tasks
/workflows
/intelligence
/resources
/memory
/decisions
/approvals
/activity
/evolution
/simulation
/settings

Create the primary navigation.

Desktop:

┌──────────────────────────────────────────────────┐
│ NEXORA                         Search   Alerts 👤 │
├───────────────┬──────────────────────────────────┤
│               │                                  │
│ Control Room  │                                  │
│ Organization  │                                  │
│ Agents        │            CONTENT               │
│ Projects      │                                  │
│ Workflows     │                                  │
│ Intelligence  │                                  │
│ Resources     │                                  │
│ Memory        │                                  │
│ Decisions     │                                  │
│ Evolution     │                                  │
│ Simulation    │                                  │
│               │                                  │
│ Settings      │                                  │
└───────────────┴──────────────────────────────────┘

Implement:

* collapsible sidebar
* breadcrumbs
* page titles
* contextual actions
* notifications
* global search
* command palette
* user menu
* organization switcher
* responsive mobile navigation

The shell must support multiple companies/organizations.

Do not place business logic inside navigation components.

Make navigation permission-aware.

---

# PHASE 3 — AUTHENTICATION + ONBOARDING

Build the complete Nexora authentication and first-run experience.

Create:

Login
Register
Forgot Password
Reset Password
Email Verification
MFA
Session Management
Organization Selection

Then build first-run onboarding.

The user should be able to choose:

CREATE COMPANY

USE BLUEPRINT

IMPORT COMPANY

JOIN COMPANY

For CREATE COMPANY:

Ask:

What does your organization do?

What is its mission?

What industry is it in?

How autonomous should it be?

What resources are available?

Which AI providers are available?

What human approvals are required?

Then generate a proposed organization configuration.

Show a visual preview before creation.

Never silently create an organization.

The final step should be:

REVIEW ORGANIZATION
→ APPROVE
→ CREATE

Create an elegant first-run experience rather than a long traditional settings form.

---

# PHASE 4 — CONTROL ROOM

This should be the **main screen**.

Build the NEXORA Company Control Room.

This is the primary operating interface.

The user should immediately understand:

What is happening?

What needs attention?

What are agents doing?

What is consuming resources?

What is blocked?

What decisions require approval?

What changed recently?

Design the dashboard around:

COMPANY STATUS

ACTIVE AGENTS

ACTIVE PROJECTS

TASKS

RESOURCE UTILIZATION

INTELLIGENCE USAGE

PENDING APPROVALS

ALERTS

RECENT DECISIONS

EVOLUTION PROPOSALS

ACTIVITY STREAM

Create an organization activity timeline.

Example:

09:42
Architecture Agent completed system analysis.

09:44
Security Agent raised a concern.

09:47
CTO Agent requested approval.

09:50
Human approval required.

The dashboard should feel alive when realtime data is available.

Do not use excessive animations.

Use motion primarily to communicate:

state changes
activity
transitions
attention
progress

Create useful empty states for a newly created company.

---

# PHASE 5 — ORGANIZATION MAP

This is one of the screens that can make Nexora visually distinctive.

Build the interactive NEXORA Organization Map.

Represent:

COMPANY
↓
DEPARTMENTS
↓
ROLES
↓
AGENTS
↓
PROJECTS
↓
TASKS

Create a visual organizational graph.

Users should be able to:

zoom
pan
search
filter
collapse departments
expand departments
select agents
inspect relationships
see reporting lines
see active work
see agent status

Agent states should be visually understandable:

AVAILABLE
WORKING
BLOCKED
WAITING
PAUSED
OFFLINE

Selecting an agent opens an inspector panel containing:

identity
role
department
manager
current task
current project
model
provider
tools
permissions
resource usage
recent activity
performance

Do not turn the graph into a decorative visualization.

It must be operationally useful.

---

# PHASE 6 — AI WORKFORCE

Build the AI Workforce interface.

Create:

Agent Directory
Agent Profile
Agent Creation
Agent Configuration
Agent Permissions
Agent Memory
Agent Tasks
Agent Performance
Agent Activity

Agent profile layout:

┌─────────────────────────────────────────────┐
│ Agent identity             STATUS: WORKING  │
├─────────────────────────────────────────────┤
│ Role / Department / Manager                 │
├─────────────────────────────────────────────┤
│ CURRENT MISSION                             │
├─────────────────────────────────────────────┤
│ Intelligence                               │
│ Claude / Gemini / OpenAI / Local            │
├─────────────────────────────────────────────┤
│ CAPABILITIES                                │
├─────────────────────────────────────────────┤
│ TOOLS                                       │
├─────────────────────────────────────────────┤
│ RESOURCE USAGE                              │
├─────────────────────────────────────────────┤
│ ACTIVITY / MEMORY / DECISIONS               │
└─────────────────────────────────────────────┘

Allow users to configure agents without exposing dangerous low-level complexity unnecessarily.

Provide:

Simple Mode
Advanced Mode

Simple Mode:
role
mission
autonomy
preferred intelligence

Advanced Mode:
system instructions
tools
permissions
routing
resource limits
memory scope
escalation rules
evaluation settings

---

# PHASE 7 — PROJECTS + TASKS

Build the project and task management experience.

Create:

Projects
Project Details
Milestones
Tasks
Dependencies
Agent Assignments
Project Activity
Project Resources

Project overview should show:

objective
status
progress
owner
agents
milestones
deadline
resource consumption
cost
blocked tasks
recent decisions

Support views:

List
Board
Timeline
Dependency Graph

Task details should show:

objective
description
assigned agent
status
priority
dependencies
resources
workflow
execution history
outputs
validation
human approvals

The UI should make it obvious that tasks are executed by organizational agents rather than simply being manually assigned tickets.

---

# PHASE 8 — WORKFLOW BUILDER

This is a major UI feature.

Build a visual workflow editor for NEXORA.

The user should be able to construct:

TRIGGER
↓
AGENT
↓
TASK
↓
CONDITION
↓
AGENT
↓
APPROVAL
↓
ACTION
↓
RESULT

Support nodes:

Trigger
Agent
Task
Tool
Condition
Parallel
Approval
Human Review
Resource Request
Model Selection
Delay
Webhook
Escalation
Validation
Success
Failure

Create:

Canvas
Node Palette
Properties Inspector
Mini Map
Zoom Controls
Undo/Redo
Version History
Validation Panel

Example:

New Requirement
→ Product Agent
→ Architect Agent
→ Security Review
→ Human Approval
→ Engineering Agents
→ QA
→ Deployment

Users should be able to inspect the workflow while it is running.

Show:

CURRENT NODE
COMPLETED NODES
FAILED NODES
WAITING NODES
RESOURCE USAGE

Do not make the editor merely visual.

Persist workflow definitions through the backend API.

---

# PHASE 9 — INTELLIGENCE EXCHANGE UI

This should be one of the most distinctive screens.

Build the NEXORA Intelligence Exchange interface.

Create:

Provider Directory
Model Directory
Model Details
Provider Health
Model Capabilities
Routing Policies
Usage
Costs
Latency
Failures
Fallback Chains

Visualize:

```
              INTELLIGENCE EXCHANGE

   ┌────────┐     ┌────────┐     ┌────────┐
   │ Claude │     │ Gemini │     │ OpenAI │
   └───┬────┘     └───┬────┘     └───┬────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
               ROUTING ENGINE
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
      Agent A       Agent B      Agent C
```

Create a model comparison view based on measurable properties:

capabilities
latency
cost
availability
context capacity
tool support
privacy classification

Do not create arbitrary "best model" rankings.

Show factual configuration and measured performance.

Create a routing policy editor:

Preferred Provider
Fallback Provider
Cost Ceiling
Latency Ceiling
Privacy Requirement
Capability Requirement

Allow:

Automatic Routing
Manual Routing
Agent Preference
Company Policy

---

# PHASE 10 — RESOURCE COMMAND CENTER

Build the NEXORA Resource Command Center.

Visualize:

CPU
RAM
GPU
Storage
Network
Tokens
API Calls
Provider Quotas
Budget
Agent Capacity
Human Approval Queue

Create resource cards with:

CURRENT
ALLOCATED
AVAILABLE
LIMIT
FORECAST

Create:

Resource Allocation
Resource Request
Budget
Quota
Scheduler
Usage History

Example:

PROJECT ALPHA

CPU       4 / 16 cores
RAM       12 / 32 GB
GPU       4 / 8 GB
TOKENS    620k / 1M
BUDGET    $18 / $50

Clearly distinguish actual telemetry from estimates.

Allow users to drill down:

Company
→ Department
→ Project
→ Agent
→ Task

and see where resources are being consumed.

---

# PHASE 11 — MEMORY + KNOWLEDGE

Build the organizational memory interface.

Create:

Knowledge
Decisions
Experiments
Lessons
Documents
Agent Memory
Project Memory
Policies

Create a global organizational search.

Search across:

projects
agents
decisions
documents
tasks
workflows
policies
knowledge

Every result should show provenance.

Create Decision Explorer:

Problem
→ Evidence
→ Proposals
→ Discussion
→ Decision
→ Expected Outcome
→ Actual Outcome
→ Lesson

Users must be able to understand why the organization made an important decision.

---

# PHASE 12 — APPROVAL CENTER

Build the human-in-the-loop approval system.

Create a dedicated Approval Center.

Each approval should show:

WHAT
WHO
WHY
RISK
RESOURCES
EVIDENCE
EXPECTED RESULT
PROPOSED ACTION

Actions:

APPROVE
REJECT
REQUEST CHANGES
DELEGATE
ESCALATE

High-risk approvals should provide additional context.

Create approval history.

Create filters:

Urgent
Financial
Security
Deployment
Data
Policy
Evolution

Make approvals fast to process without hiding important information.

---

# PHASE 13 — AGENT COUNCILS

Build the Agent Council interface.

Create a visual deliberation workspace.

Example:

```
         ARCHITECTURE COUNCIL

 CTO ─────────────── Architect
  │                       │
  │                       │
```

Security ─────────────── Backend
│
▼
SYNTHESIS

Each participant should have:

position
evidence
confidence
concerns
recommendation

Show disagreements explicitly.

Create:

Discussion
Evidence
Proposals
Objections
Synthesis
Decision

The interface should communicate structured deliberation rather than a normal chat room.

---

# PHASE 14 — EVOLUTION CENTER

This is where Nexora begins looking genuinely different.

Build the NEXORA Evolution Center.

This is where the organization proposes improvements to itself.

Main sections:

OBSERVATIONS
DIAGNOSES
PROPOSALS
SIMULATIONS
VALIDATIONS
DEPLOYMENTS
ROLLBACKS
LESSONS

Create an Evolution Proposal card:

PROPOSED CHANGE

"Create a dedicated API Reliability Agent."

WHY

Repeated provider failures detected.

EVIDENCE

12 failures across 4 projects.

EXPECTED BENEFIT

Improved incident handling.

RESOURCE IMPACT

+1 agent
+estimated model usage

RISK

Low / Medium / High

VALIDATION

Not yet simulated.

Actions:

SIMULATE
REVIEW
APPROVE
REJECT

Never make evolution feel like a mysterious AI process.

The user must be able to understand what changed and why.

---

# PHASE 15 — SIMULATION LAB

Build the NEXORA Simulation Lab.

Allow users to clone an organization's configuration into a sandbox.

Create:

CURRENT ORGANIZATION
SIMULATION A
SIMULATION B
SIMULATION C

Users can modify:

agents
departments
workflows
models
routing
resources
policies

Then compare experimental results.

Create comparison views for:

completion
cost
latency
resource usage
quality metrics
failures
human intervention

Provide:

Run Simulation
Pause
Stop
Inspect
Compare
Promote Configuration
Discard

Make clear that simulations are experiments rather than guarantees.

---

# PHASE 16 — SETTINGS / ADMIN

Build the complete Nexora administration area.

Sections:

Organization
Members
Roles
Permissions
Security
AI Providers
Models
Resources
Policies
Integrations
Notifications
Appearance
Audit Logs
API
Developer Settings

Create separate:

Simple Settings
Advanced Settings

Avoid exposing dangerous configuration to normal users.

Settings must respect RBAC.

Sensitive credentials must never be displayed directly after initial configuration.

---

# PHASE 17 — GLOBAL COMMAND PALETTE

I would make this a signature feature.

Build the NEXORA global command system.

Keyboard shortcut:

Ctrl/Cmd + K

Users can execute commands such as:

Search agents
Open project
Create task
Pause agent
View approvals
Inspect resources
Open workflow
Search memory
Run simulation
Create decision
Ask organization
Open settings

Examples:

> create a QA agent

> show blocked projects

> why is Project Alpha delayed?

> open Security Department

> show today's decisions

> simulate using Gemini instead of Claude

Commands must respect permissions.

The command palette should become the keyboard-driven control layer of Nexora.

---

# PHASE 18 — REALTIME ACTIVITY

Implement realtime organization activity.

Events may include:

agent_started
agent_completed
task_created
task_failed
workflow_started
workflow_completed
approval_requested
approval_completed
provider_failed
provider_switched
resource_threshold
decision_created
evolution_proposed
simulation_completed

Create a realtime activity stream.

Allow filtering by:

agent
department
project
event
severity

Use realtime transport appropriate to the backend architecture.

Do not simulate realtime activity with frontend timers.

---

# PHASE 19 — TAURI DESKTOP

Now turn the web frontend into an actual desktop product.

Package NEXORA as a Tauri desktop application.

The desktop application must feel native rather than simply being a browser window.

Implement:

system tray
desktop notifications
secure local configuration
window state persistence
keyboard shortcuts
deep links
file handling where required
offline/degraded state
automatic update architecture
secure credential handling

Create a Tauri capability model.

The Rust/Tauri layer must expose only explicitly required native capabilities.

Do not give the frontend unrestricted filesystem or shell access.

Support:

Windows
Linux
macOS

where technically practical.

Keep the core Nexora application logic independent from Tauri.

The same application should continue working as a web application.

Add desktop-specific features only where they provide real value.

---

# PHASE 20 — TUI

And yes — **I absolutely think we should have this.**

Not everyone operating an AI organization wants a graphical interface.

The TUI becomes the **Nexora Operations Console**.

Build an optional NEXORA Terminal User Interface.

The TUI is a first-class operational interface, not a debug console.

Design it for:

developers
DevOps
system administrators
power users
remote servers
SSH environments
low-bandwidth environments

Create:

Dashboard
Agents
Projects
Tasks
Workflows
Resources
Intelligence
Approvals
Activity
Evolution
Logs

Example:

┌─ NEXORA OPERATIONS ──────────────────────────────────────┐
│ Company: Nexora Labs                     ONLINE           │
├───────────────────────────────────────────────────────────┤
│ AGENTS        PROJECTS       TASKS        ALERTS           │
│ 42 ACTIVE     8 ACTIVE       31 RUNNING   3               │
├───────────────────────────────────────────────────────────┤
│ RESOURCE UTILIZATION                                      │
│ CPU  ████████░░  78%                                     │
│ RAM  ██████░░░░  61%                                     │
│ TOK  ███████░░░  69%                                     │
├───────────────────────────────────────────────────────────┤
│ ACTIVE OPERATIONS                                         │
│ > Architect Agent    analyzing architecture               │
│ > QA Agent           running test suite                    │
│ > Security Agent     awaiting approval                     │
├───────────────────────────────────────────────────────────┤
│ [a] Agents [p] Projects [r] Resources [e] Evolution      │
└───────────────────────────────────────────────────────────┘

Support keyboard navigation.

Example commands:

agents
agents --active
agent inspect architect
projects
project inspect alpha
tasks --blocked
resources
models
approvals
evolution
logs
company status

The TUI must consume the same backend APIs/events as the graphical interfaces.

Do not create a second business logic implementation.

Provide graceful degradation when graphical capabilities are unavailable.

---

# PHASE 21 — SHARED FRONTEND PLATFORM

This is critical once all three surfaces exist.

Refactor the frontend architecture so that:

Next.js
Tauri
TUI

share common domain contracts.

Create shared packages/modules for:

types
API clients
authentication
permissions
organization models
agent models
project models
workflow models
resource models
intelligence models
event schemas
validation
formatting
configuration

Target architecture:

packages/
core/
types/
api/
auth/
permissions/
events/
validation/
ui/
config/

apps/
web/
desktop/
tui/

The graphical UI should share reusable UI components where technically appropriate.

The TUI should share domain logic and API contracts but use terminal-native rendering.

Avoid forcing browser-specific code into shared modules.

The backend remains the source of truth for business rules.

---

# PHASE 22 — ACCESSIBILITY + UX HARDENING

Perform a complete UX and accessibility pass across NEXORA.

Verify:

keyboard navigation
focus management
screen reader compatibility
contrast
responsive layouts
mobile behavior
desktop behavior
Tauri behavior
TUI behavior
loading states
error states
empty states
permission states
slow network behavior
offline/degraded behavior

Every major page must answer:

Where am I?

What am I looking at?

What can I do?

What happened?

What requires attention?

What happens next?

Reduce unnecessary clicks.

Do not sacrifice clarity for visual effects.

Use animation only when it improves comprehension.

---

# PHASE 23 — FRONTEND PERFORMANCE

Optimize the entire NEXORA frontend.

Inspect:

bundle size
JavaScript execution
rendering
network requests
API caching
realtime events
large organization graphs
large activity feeds
tables
charts
workflow canvas
memory-heavy screens

Implement:

code splitting
lazy loading
virtualization
request deduplication
appropriate caching
optimistic updates where safe
pagination
incremental loading

The organization graph must remain usable with large numbers of agents.

The activity stream must remain usable with high event volume.

Do not optimize by removing useful functionality.

Measure before and after.

---

# PHASE 24 — FRONTEND SECURITY

Perform a frontend security audit.

Test:

XSS
CSRF
session handling
token leakage
local storage risks
Tauri capabilities
deep links
file access
command injection boundaries
permission bypass
tenant isolation
sensitive data exposure
provider credential exposure
malicious model output
unsafe markdown
unsafe HTML
URL handling

Never trust frontend permission checks alone.

The backend must remain authoritative.

The frontend should hide unavailable actions for usability but backend authorization must independently enforce them.

Audit Tauri capabilities and remove every unnecessary permission.

---

# PHASE 25 — THE NEXORA FRONTEND POLISH

Finally:

Act as the Principal Product Designer and Senior Frontend Engineer for NEXORA.

Review the complete application as if it were preparing for a professional public launch.

Do not blindly add features.

Evaluate:

visual hierarchy
navigation
information density
consistency
interaction design
accessibility
responsiveness
performance
error handling
empty states
micro-interactions
terminology
copy
icons
spacing
charts
tables
organization visualization
agent visualization
workflow visualization
resource visualization
evolution visualization

Remove:

visual clutter
redundant screens
unnecessary animations
duplicate functionality
confusing terminology
dead UI
placeholder content
fake metrics
fake activity

Improve the product until the experience communicates:

"This is an operating system for an intelligent organization."

not:

"This is a dashboard containing AI chatbots."

Then perform a final end-to-end walkthrough of:

Create Company
→ Configure Organization
→ Create Agents
→ Assign Intelligence
→ Create Project
→ Execute Workflow
→ Monitor Agents
→ Review Resources
→ Approve Decision
→ Inspect Memory
→ Detect Problem
→ Create Evolution Proposal
→ Simulate
→ Validate
→ Deploy Change
→ Observe Result

Document any remaining gaps.

---

# And I would add one special prompt

This one should run **after every major frontend stage**.

You are the NEXORA Frontend CTO.

The current frontend consists of:

NEXT.JS / REACT
TAURI DESKTOP
OPTIONAL TUI

Your job is to continuously improve the existing frontend without unnecessarily rewriting stable functionality.

For every development cycle:

1. Inspect the current implementation.
2. Compare it against the NEXORA blueprint.
3. Identify incomplete functionality.
4. Identify broken functionality.
5. Identify inconsistent UX.
6. Identify accessibility problems.
7. Identify performance problems.
8. Identify security problems.
9. Identify duplicated frontend logic.
10. Identify missing loading, error and empty states.
11. Identify places where the UI does not reflect real backend state.
12. Identify opportunities to improve usability.
13. Identify missing responsive behavior.
14. Identify Tauri-specific opportunities.
15. Identify TUI parity gaps.
16. Prioritize improvements.
17. Implement the highest-value safe improvements.
18. Test everything.
19. Run regression tests.
20. Update documentation.

Never fabricate backend functionality.

Never display fake metrics as real data.

Never hard-code provider-specific assumptions into generic components.

Never put business logic exclusively in the frontend.

Never allow frontend permission checks to replace backend authorization.

Maintain a clean separation between:

DOMAIN
API
STATE
UI
DESKTOP
TUI

After every cycle produce:

COMPLETED
FIXED
IMPROVED
DISCOVERED
TESTED
REMAINING
RISKS
NEXT FRONTEND PRIORITIES

The final objective is:

A single coherent NEXORA experience across Web, Desktop and Terminal.

The user should feel that they are operating one organization through different control surfaces—not using three separate applications.
