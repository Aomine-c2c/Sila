
---

# PHASE 18 — REALTIME ACTIVITY


---

# PHASE 19 — TAURI DESKTOP


---

# PHASE 20 — TUI

And yes — **I absolutely think we should have this.**

Not everyone operating an AI organization wants a graphical interface.

The TUI becomes the **Nexora Operations Console**.

Build an optional NEIMAN Terminal User Interface.

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

┌─ NEIMAN OPERATIONS ──────────────────────────────────────┐
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

Perform a complete UX and accessibility pass across NEIMAN.

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

Optimize the entire NEIMAN frontend.

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

# PHASE 25 — THE NEIMAN FRONTEND POLISH

Finally:

Act as the Principal Product Designer and Senior Frontend Engineer for NEIMAN.

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

You are the NEIMAN Frontend CTO.

The current frontend consists of:

NEXT.JS / REACT
TAURI DESKTOP
OPTIONAL TUI

Your job is to continuously improve the existing frontend without unnecessarily rewriting stable functionality.

For every development cycle:

1. Inspect the current implementation.
2. Compare it against the NEIMAN blueprint.
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

A single coherent NEIMAN experience across Web, Desktop and Terminal.

The user should feel that they are operating one organization through different control surfaces—not using three separate applications.
Absolutely. For Nexora, I’d make the **frontend itself multi-surface** rather than treating Tauri as just a wrapper around a web app:

```text
                         NEIMAN FRONTEND
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Tauri Desktop      Next.js Web       TUI / CLI
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                       Shared Frontend Core
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
       Design System       API Client          State / Events
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                         NEIMAN BACKEND
```

The important part is **not to build three completely separate frontends**. Next.js should provide the main UI foundation, Tauri should provide the native desktop experience, and the TUI should expose the operational/control-plane experience for power users.

Below is the staged prompt system I'd use.

---

# NEIMAN FRONTEND DEVELOPMENT PROGRAM

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

And most importantly:

> **Nexora should feel like an operating system for an organization, not an AI chat application.**

---

# PHASE 0 — FRONTEND AUDIT

Start here.

You are the Lead Frontend Architect for NEIMAN, an AI-native Organization Operating System.

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

# PHASE 1 — NEIMAN DESIGN SYSTEM

This is important because we're building a large platform.

Build the foundational NEIMAN design system.

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

Build the main NEIMAN application shell.

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
│ NEIMAN                         Search   Alerts 👤 │
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


---

# PHASE 5 — ORGANIZATION MAP

This is one of the screens that can make Nexora visually distinctive.

Build the interactive NEIMAN Organization Map.

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

Build a visual workflow editor for NEIMAN.

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

Build the NEIMAN Intelligence Exchange interface.

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

Build the NEIMAN Resource Command Center.

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

Build the NEIMAN Evolution Center.

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

Build the NEIMAN Simulation Lab.

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

Build the NEIMAN global command system.

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

Package NEIMAN as a Tauri desktop application.

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

Build an optional NEIMAN Terminal User Interface.

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

┌─ NEIMAN OPERATIONS ──────────────────────────────────────┐
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

Perform a complete UX and accessibility pass across NEIMAN.

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

Optimize the entire NEIMAN frontend.

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

# PHASE 25 — THE NEIMAN FRONTEND POLISH

Finally:

Act as the Principal Product Designer and Senior Frontend Engineer for NEIMAN.

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

You are the NEIMAN Frontend CTO.

The current frontend consists of:

NEXT.JS / REACT
TAURI DESKTOP
OPTIONAL TUI

Your job is to continuously improve the existing frontend without unnecessarily rewriting stable functionality.

For every development cycle:

1. Inspect the current implementation.
2. Compare it against the NEIMAN blueprint.
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

A single coherent NEIMAN experience across Web, Desktop and Terminal.

The user should feel that they are operating one organization through different control surfaces—not using three separate applications.

### Recommended implementation order

I'd actually build these in **five major frontend releases**, rather than running 25 prompts randomly:

| Release                | Prompts                  | Result                                                      |
| ---------------------- | ------------------------ | ----------------------------------------------------------- |
| **F0 — Foundation**    | 0–3                      | Design system + shell + authentication                      |
| **F1 — Organization**  | 4–8                      | Control Room + organization + agents + projects + workflows |
| **F2 — Intelligence**  | 9–13                     | Models + resources + memory + approvals + councils          |
| **F3 — Evolution**     | 14–18                    | Evolution + simulation + realtime operations                |
| **F4 — Multi-Surface** | 19–24                    | Tauri + TUI + shared architecture + security/performance    |
| **F5 — Launch**        | 25 + continuous protocol | Product polish and continuous development                   |

The **TUI is especially worth keeping**. It gives Nexora a second identity: the graphical application can be the **executive/control interface**, while the TUI can become the **operations console** for someone SSH'd into a server at 2 AM managing hundreds of agents. That fits the "OS" concept much better than making Tauri the only alternative to the browser.


Yes. I think we should treat this as a **real platform**, not a demo, and build it incrementally so every prompt upgrades the existing system rather than repeatedly rebuilding it.

And I agree: it needs a name that feels like a **company/organization operating system**, not another "AgentGPT" product.

## First: the name

My strongest direction would be:

# **NEIMAN**

**NEIMAN — The Autonomous Organization OS**

The name suggests **nexus + organization + intelligence**, without tying the product to a particular AI provider or industry.

Other names worth keeping in the shortlist:

* **Nexora** — AI organization / operating system
* **Orvanta** — organization + advancement
* **Synora** — synchronized intelligence
* **Aevora** — adaptive/evolving organization
* **Veyra** — short, corporate, technology-oriented
* **Orgynex** — organization + nexus
* **Evolyn** — evolution-focused
* **Cognara** — cognition + organization
* **Omnora** — broad/general-purpose organizational intelligence
* **Nexis** — strong conceptually, though likely crowded as a name

I particularly like:

> **NEIMAN**
> *Build an organization. Give it intelligence. Let it evolve.*

And internally we could call the architecture:

**NEIMAN OS**

with:

* **Nexora Company** — an instantiated organization
* **Nexora Agents** — AI employees
* **Nexora Intelligence Exchange** — Gemini/Claude/OpenAI/local providers
* **Nexora Resource Engine** — CPU/RAM/GPU/tokens/etc.
* **Nexora Memory** — organizational knowledge
* **Nexora Governance** — policies/permissions
* **Nexora Evolution Engine** — adaptation
* **Nexora Control Room** — main dashboard

---

# Now the build plan

I wouldn't give you one enormous prompt.

We're going to progressively turn the existing project into this:

```text
NEIMAN
│
├── Company OS
│
├── Organization Engine
│   ├── Departments
│   ├── Agents
│   ├── Roles
│   ├── Projects
│   └── Workflows
│
├── Intelligence Exchange
│   ├── Gemini
│   ├── Claude
│   ├── OpenAI
│   ├── Local Models
│   └── Future Providers
│
├── Resource Engine
│   ├── CPU
│   ├── RAM
│   ├── GPU
│   ├── Storage
│   ├── Network
│   ├── Tokens
│   ├── API Credits
│   └── Human Attention
│
├── Memory
│
├── Governance
│
├── Tool System
│
├── Execution Engine
│
├── Evaluation
│
└── Evolution Engine
```

Below are the prompts I'd use with your coding agent.

---

# PHASE 0 — PROJECT AUDIT

Before changing anything.

You are now the lead architect and Autonomous CTO for a project that is being transformed into **NEIMAN — an AI-native Organization Operating System**.

Do NOT immediately rewrite or replace the existing project.

First inspect the entire repository and understand what already exists.

Your mission is to establish an accurate baseline before implementation.

Analyze:

1. Project structure
2. Frontend architecture
3. Backend architecture
4. Database architecture
5. Authentication and authorization
6. API architecture
7. Existing agent/model integrations
8. Existing UI/UX
9. State management
10. Configuration/environment management
11. Logging and observability
12. Testing
13. Deployment
14. Security
15. Documentation
16. Existing abstractions that can be reused
17. Technical debt
18. Missing infrastructure
19. Architectural risks
20. Features that conflict with the NEIMAN vision

Then create:

* CURRENT_STATE.md
* ARCHITECTURE_AUDIT.md
* TECHNICAL_DEBT.md
* NEIMAN_ROADMAP.md
* MISSING_CAPABILITIES.md

Do not invent capabilities that do not exist.

Do not delete working functionality merely because you would implement it differently.

Preserve good existing work.

Identify what should be refactored, what should remain, and what must be added.

Define a staged migration path toward NEIMAN.

The final result of this phase should be an implementation-ready architectural assessment.

Do not begin Phase 1 until the audit is complete.

---

# PHASE 1 — ESTABLISH NEIMAN CORE

Now create the actual platform foundation.

Transform the existing project into the foundational architecture of **NEIMAN — The Autonomous Organization OS**.

Do not build industry-specific functionality yet.

Build the reusable organizational core.

Introduce these primary concepts:

COMPANY

* id
* name
* description
* mission
* vision
* industry
* organizational DNA
* status
* owner
* created_at
* updated_at

ORGANIZATIONAL DNA

* operating philosophy
* innovation level
* autonomy level
* risk tolerance
* quality threshold
* decision style
* communication style
* resource strategy

DEPARTMENT

* company
* name
* purpose
* parent department
* manager
* status

ROLE

* department
* title
* responsibilities
* capabilities
* authority
* required skills
* autonomy level

AGENT

* role
* identity
* system instructions
* capabilities
* permissions
* autonomy
* status
* intelligence configuration
* performance metadata

PROJECT

* company
* owner
* objective
* priority
* status
* milestones
* deadlines

TASK

* project
* assigned agent
* priority
* status
* dependencies
* resource requirements
* expected outcome

WORKFLOW

* trigger
* steps
* agents
* tools
* conditions
* approvals
* completion criteria

POLICY

* company
* scope
* rules
* enforcement level

DECISION

* problem
* proposals
* evidence
* participants
* decision
* rationale
* expected outcome
* actual outcome
* timestamp

Build the relationships between these entities.

Establish clean domain boundaries.

Create APIs/services/repositories as appropriate for the existing stack.

Add migrations.

Add validation.

Add permission checks.

Add tests for the core domain.

Do not yet implement autonomous evolution.

The objective is to create a stable organizational operating system that future phases can build upon.

---

# PHASE 2 — THE AI EMPLOYEE SYSTEM

Now we make agents actual organizational entities.

Upgrade NEIMAN into a true multi-agent organizational platform.

An agent is NOT simply a chatbot.

An agent represents an organizational employee with:

* identity
* role
* department
* responsibilities
* goals
* capabilities
* permissions
* memory
* tools
* intelligence provider
* resource limits
* autonomy level
* reporting hierarchy
* performance history

Implement:

1. Agent lifecycle

CREATED
→ CONFIGURED
→ AVAILABLE
→ WORKING
→ BLOCKED
→ PAUSED
→ RETIRED

2. Agent hierarchy

Agents must be able to:

* report to another agent
* delegate tasks
* request information
* request approval
* escalate problems
* review another agent's work
* collaborate

3. Agent task execution

Implement a robust execution lifecycle:

TASK RECEIVED
→ CONTEXT ASSEMBLY
→ PLAN
→ RESOURCE CHECK
→ INTELLIGENCE SELECTION
→ TOOL EXECUTION
→ RESULT
→ VALIDATION
→ REPORT
→ MEMORY UPDATE

4. Agent permissions

Agents must never automatically gain unrestricted system access.

Implement capability-based permissions.

5. Agent profiles

Create a UI allowing users to inspect:

* role
* responsibilities
* current task
* department
* manager
* intelligence provider
* tools
* permissions
* memory
* resource usage
* performance
* recent decisions

6. Agent communication

Create structured agent-to-agent communication.

Support:

* requests
* responses
* delegation
* escalation
* reviews
* notifications

7. Agent audit trail

Every meaningful action must be traceable.

Do not create fake autonomy.

Every autonomous action must pass through explicit execution services.

Build the architecture so external AI models can later be swapped without changing organizational logic.

---

# PHASE 3 — THE INTELLIGENCE EXCHANGE

This is where Gemini, Claude, OpenAI and others become first-class citizens.

Build the **NEIMAN Intelligence Exchange**.

Critical architectural rule:

NEIMAN agents are organizational identities.

AI models are intelligence providers.

Never couple an organizational agent directly to a single AI vendor.

Create a provider abstraction capable of supporting multiple providers.

Initial provider architecture must support providers such as:

* Google Gemini
* Anthropic Claude
* OpenAI
* local/self-hosted models
* future providers through plugins/adapters

Create:

MODEL_PROVIDER
MODEL
CAPABILITY
MODEL_ROUTING_POLICY
MODEL_REQUEST
MODEL_RESPONSE
MODEL_USAGE
MODEL_PERFORMANCE

Each model should expose metadata including:

* provider
* model identifier
* capabilities
* context capacity
* modalities
* tool support
* structured output support
* estimated cost
* latency
* availability
* privacy classification

Implement a model adapter interface.

Agents should request capabilities rather than specific providers whenever possible.

Example:

"Need high-quality architectural reasoning with large context."

The Intelligence Router determines the appropriate model.

Implement:

1. capability matching
2. provider selection
3. cost-aware routing
4. latency-aware routing
5. privacy-aware routing
6. fallback routing
7. rate-limit handling
8. provider failure handling
9. model availability monitoring
10. usage tracking

Allow explicit user overrides.

Example:

Agent preference:
Claude preferred

Fallback:
Gemini

Emergency:
Local model

Never hard-code vendor-specific logic throughout the application.

Create an Intelligence Exchange dashboard showing:

* available providers
* available models
* current usage
* cost
* latency
* failures
* model capabilities
* routing decisions

The architecture must make adding another provider straightforward without modifying the organizational engine.

---

# PHASE 4 — RESOURCE ENGINE

This is one of the parts I think will make Nexora special.

Build the **NEIMAN Resource Engine**.

Resources are not limited to financial budgets.

Treat organizational resources as finite operational assets.

Support:

COMPUTE

* CPU
* RAM
* GPU
* storage
* network bandwidth

INTELLIGENCE

* model tokens
* API requests
* provider quotas
* inference capacity

FINANCIAL

* API spending
* cloud spending
* project budgets

OPERATIONAL

* agent capacity
* execution slots
* human approval capacity
* time

Create:

RESOURCE
RESOURCE_POOL
RESOURCE_ALLOCATION
RESOURCE_REQUEST
RESOURCE_LIMIT
RESOURCE_USAGE
RESOURCE_BUDGET

Agents and tasks must be able to request resources.

Example:

Task:
Run large research analysis.

Request:

* 4 CPU cores
* 8GB RAM
* 200k tokens
* 30 minutes
* $2 maximum inference cost

The Resource Engine evaluates:

* availability
* priority
* policy
* budget
* expected value
* existing allocations

Then:

APPROVE
DENY
DEFER
REDUCE
QUEUE

Implement resource scheduling.

Implement resource priorities:

CRITICAL
HIGH
NORMAL
LOW
BACKGROUND

Track real usage rather than only estimated usage whenever possible.

Create a Resource Control Center showing:

* total capacity
* allocated capacity
* available capacity
* utilization
* expensive tasks
* resource bottlenecks
* budget consumption
* provider usage

The architecture must support both physical resources and abstract organizational resources.

Do not fake CPU/RAM/GPU metrics when the platform cannot access them.

Clearly distinguish:

OBSERVED
ESTIMATED
ALLOCATED
LIMITED
AVAILABLE

---

# PHASE 5 — MEMORY + ORGANIZATIONAL KNOWLEDGE

Build NEIMAN's organizational memory system.

Do not treat memory as simple chat history.

Implement separate memory domains:

1. Company memory
2. Department memory
3. Agent memory
4. Project memory
5. Customer memory
6. Decision memory
7. Policy memory
8. Experiment memory
9. Failure memory
10. Knowledge base

Implement appropriate metadata:

* source
* owner
* scope
* permissions
* confidence
* timestamp
* relevance
* provenance
* retention policy

Agents should receive only the context they are authorized to access.

Implement context assembly:

TASK
→ identify required knowledge
→ retrieve relevant memories
→ apply permissions
→ rank relevance
→ construct context
→ send minimal necessary context to model

Important:

External model providers must not automatically receive the entire company memory.

Only authorized, task-relevant context should be transmitted.

Create a searchable organizational knowledge interface.

Create decision records that preserve:

* problem
* options
* evidence
* decision
* rationale
* participants
* expected outcome
* actual outcome
* lessons learned

Build the foundation for future organizational learning.

---

# PHASE 6 — GOVERNANCE

Implement NEIMAN's organizational governance layer.

Every company must have a configurable:

COMPANY CONSTITUTION

containing:

* mission
* values
* operating principles
* prohibited actions
* approval requirements
* security rules
* financial rules
* data rules
* autonomy boundaries
* escalation rules

Implement:

POLICIES
PERMISSIONS
APPROVALS
ESCALATIONS
AUDIT LOGS
DECISION RECORDS

Create autonomy levels:

LEVEL 0 — OBSERVE
LEVEL 1 — RECOMMEND
LEVEL 2 — EXECUTE WITH APPROVAL
LEVEL 3 — EXECUTE WITHIN POLICY
LEVEL 4 — AUTONOMOUS
LEVEL 5 — AUTONOMOUS + ADAPTIVE

Autonomy must be configurable per:

* company
* department
* role
* agent
* tool
* task type
* action

High-risk operations should require explicit approval unless the user has deliberately configured otherwise.

Every consequential action must have:

* actor
* authority
* timestamp
* action
* target
* reason
* result

Build an audit viewer.

Users must be able to understand why an action happened.

---

# PHASE 7 — COMPANY BLUEPRINTS

Now solve the problem you mentioned:nstantiate it.

---

# PHASE 8 — COMPANY CONTROL ROOM

Now make it feel like a real product.

Build the NEIMAN Company Control Room.

The Control Room is the primary interface for operating an AI organization.

Create:

1. Company overview
2. Organization map
3. Agent workforce
4. Departments
5. Projects
6. Tasks
7. Resource utilization
8. Intelligence usage
9. Decisions
10. Approvals
11. Alerts
12. Company memory
13. Policies
14. Performance
15. Activity timeline

The dashboard should immediately answer:

What is the company doing?

What are agents doing?

What is blocked?

What requires human attention?

What resources are being consumed?

Which projects are progressing?

Which decisions are pending?

Which providers/models are being used?

What problems have appeared?

What has changed recently?

Create an interactive organizational graph.

Users should be able to navigate:

Company
→ Department
→ Agent
→ Project
→ Task
→ Decision
→ Evidence

Avoid creating a generic chatbot dashboard.

NEIMAN should visually communicate that the user is operating an organization.

---

# PHASE 9 — WORKFLOW ENGINE

Build the NEIMAN Workflow Engine.

Workflows must support:

TRIGGERS
CONDITIONS
AGENTS
TOOLS
TASKS
APPROVALS
RESOURCE REQUESTS
DECISIONS
ESCALATIONS
RETRIES
FALLBACKS
COMPLETION CONDITIONS

Example:

New software requirement
→ Product Agent analyzes
→ Architect reviews
→ CTO approves
→ Engineers implement
→ QA tests
→ Security reviews
→ Documentation updates
→ Deployment approval
→ Deployment
→ Monitoring
→ Project completion

Workflows must be observable.

Users must be able to see exactly where an operation currently is.

Support:

* sequential execution
* parallel execution
* conditional branching
* retries
* timeouts
* human-in-the-loop
* agent delegation
* failure handling

Persist workflow state.

Never rely solely on model conversation state for workflow execution.

---

# PHASE 10 — AGENT COUNCILS

This is where multi-model collaboration becomes powerful.

Implement organizational deliberation.

Create an Agent Council mechanism.

A council is a temporary or permanent group of agents assembled to evaluate a problem.

Example:

ARCHITECTURE COUNCIL

CTO
Architect
Backend Engineer
Security Engineer
QA Engineer

Each participant receives the appropriate task context.

Each produces:

* proposal
* evidence
* risks
* assumptions
* confidence
* objections

Then a synthesis agent produces a decision proposal.

Implement:

PROPOSAL
→ INDEPENDENT REVIEW
→ OBJECTIONS
→ DISCUSSION
→ SYNTHESIS
→ DECISION
→ RECORD

Support multiple intelligence providers.

For example:

Claude can produce one architectural analysis.

Gemini can produce an alternative.

Another model can perform security analysis.

A final model or designated decision agent synthesizes the evidence.

Do not assume that disagreement means one model is wrong.

Record disagreements as organizational knowledge.

---

# PHASE 11 — ORGANIZATIONAL PERFORMANCE

Build the NEIMAN organizational performance system.

Track performance at:

* company
* department
* project
* workflow
* role
* agent
* model/provider
* task

Metrics may include:

* completion rate
* failure rate
* cycle time
* resource efficiency
* cost
* rework
* quality
* human intervention
* escalation frequency
* provider reliability
* task success

Do not reduce organizational performance to a single arbitrary score.

Provide multidimensional evidence.

Allow users to define custom KPIs per company and industry.

Track expected versus actual outcomes.

This data will later feed the Evolution Engine.

---

# PHASE 12 — EVOLUTION ENGINE

This is the big one.

Build the NEIMAN Evolution Engine.

The purpose is not unrestricted self-modification.

The purpose is controlled organizational improvement.

The Evolution Engine observes:

* failures
* bottlenecks
* resource waste
* repeated tasks
* successful strategies
* provider performance
* workflow performance
* agent performance
* organizational structure
* changing workload
* environmental changes

It identifies potential adaptations.

Possible adaptations include:

* change agent configuration
* change system prompt
* change model provider
* change model routing
* create specialization
* create new agent
* retire agent
* modify workflow
* modify resource allocation
* create temporary department
* modify strategy
* propose policy changes

Every adaptation must follow:

OBSERVE
→ DIAGNOSE
→ PROPOSE
→ SIMULATE
→ EVALUATE
→ VALIDATE
→ APPROVE
→ DEPLOY
→ MONITOR
→ ROLLBACK IF NECESSARY

Never allow arbitrary self-modification of the core system.

Create immutable snapshots before organizational changes.

Record:

* previous state
* proposed state
* reason
* evidence
* expected improvement
* risk
* validation result
* approval
* actual result

The organization must be able to learn from failed adaptations.

Rollback must be treated as information, not merely failure.

Build an Evolution Lab where proposed organizational changes can be inspected and simulated before deployment.

---

# PHASE 13 — SIMULATION

Build the NEIMAN Simulation Lab.

Allow users to create a simulated copy of an organization.

The simulation must allow:

* alternative agent structures
* alternative model routing
* alternative workflows
* resource allocation changes
* policy changes
* strategy changes

Example:

CURRENT ORGANIZATION

50 agents
$100 monthly intelligence budget

SIMULATION A

35 agents
different routing strategy

SIMULATION B

50 agents
higher premium-model usage

SIMULATION C

70 agents
more parallel execution

Allow controlled workloads to run against these configurations.

Compare results using measurable metrics.

Do not present simulation results as guaranteed future outcomes.

Clearly label them as experimental results.

Allow users to promote a validated configuration into the real organization after approval.

---

# PHASE 14 — BUILD MY COMPANY

This is the magic onboarding experience.

Build the NEIMAN natural-language organization generator.

Create a workflow:

USER DESCRIPTION
→ REQUIREMENT ANALYSIS
→ INDUSTRY IDENTIFICATION
→ ORGANIZATIONAL DESIGN
→ DEPARTMENT GENERATION
→ ROLE GENERATION
→ AGENT GENERATION
→ WORKFLOW GENERATION
→ POLICY GENERATION
→ RESOURCE MODEL
→ INTELLIGENCE REQUIREMENTS
→ RISK ANALYSIS
→ COMPANY BLUEPRINT

Example user input:

"I want to create a software company that builds agricultural management systems for small farmers in Africa."

Generate a proposed organization.

Display:

Company mission
Departments
Roles
Agents
Workflows
Tools
Policies
Intelligence requirements
Resource requirements
Estimated operational complexity
Potential risks
Human approval requirements

Allow the user to modify everything.

Then:

SIMULATE
→ REVIEW
→ APPROVE
→ INSTANTIATE

Never silently create a fully autonomous organization from a single natural-language instruction.

---

# PHASE 15 — MULTI-PROVIDER RESILIENCE

This deserves its own stage because we're explicitly using different AI providers.

Harden the Intelligence Exchange for real-world multi-provider operation.

Implement:

Provider health monitoring
Model availability monitoring
Rate-limit detection
Timeout handling
Retry policies
Circuit breakers
Fallback models
Provider failover
Cost ceilings
Token ceilings
Context-size handling
Capability mismatch detection
Structured-output validation

A task must never silently fail because one provider becomes unavailable.

Implement:

PRIMARY
→ FALLBACK
→ SECONDARY FALLBACK
→ LOCAL/DEGRADED MODE

Record every routing decision.

Example:

Task:
Security analysis

Primary:
Claude

Failure:
Timeout

Fallback:
Gemini

Result:
Completed

Store this event for future routing optimization.

Never assume provider APIs behave identically.

Normalize their differences behind the provider adapter layer.

---

# PHASE 16 — SECURITY

Perform a full security hardening pass across NEIMAN.

Focus on:

* authentication
* authorization
* tenant isolation
* secrets management
* API keys
* model provider credentials
* agent permissions
* tool permissions
* filesystem access
* terminal access
* browser access
* database access
* external API access
* prompt injection
* malicious tool instructions
* untrusted model output
* data leakage
* excessive autonomy
* audit integrity
* sensitive context transmission

Implement least privilege.

Treat model-generated instructions as untrusted input.

Create explicit permission boundaries between:

COMPANY
DEPARTMENT
AGENT
MODEL
TOOL
RESOURCE

External AI providers must receive only the minimum authorized context required for a task.

Add security tests and adversarial tests.

Do not claim the system is secure without evidence.

---

# PHASE 17 — SELF-DIAGNOSTICS

Act as the Autonomous CTO of NEIMAN.

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


---

## The build philosophy I'd use

Don't execute all 18 prompts at once.

Use them as **versioned upgrades**:

```text
NEIMAN
│
├── v0.1 Foundation
│
├── v0.2 Organization
│
├── v0.3 AI Employees
│
├── v0.4 Intelligence Exchange
│
├── v0.5 Resource Economy
│
├── v0.6 Memory
│
├── v0.7 Governance
│
├── v0.8 Industry Blueprints
│
├── v0.9 Control Room
│
├── v1.0 Workflow Engine
│
├── v1.1 Agent Councils
│
├── v1.2 Performance
│
├── v1.3 Evolution Engine
│
├── v1.4 Simulation Lab
│
├── v1.5 Company Generator
│
├── v1.6 Provider Resilience
│
├── v1.7 Security
│
└── v2.0 Autonomous Organization OS
```

And **v2.0 isn't "the AI runs wild."**

It's the point where the whole loop exists:

```text
       HUMAN
         │
         ▼
      MISSION
         │
         ▼
    ORGANIZATION
         │
         ▼
       AGENTS
         │
         ▼
   INTELLIGENCE POOL
 Gemini / Claude / OpenAI / Local
         │
         ▼
      EXECUTION
         │
         ▼
      RESULTS
         │
         ▼
      MEMORY
         │
         ▼
    EVALUATION
         │
         ▼
     EVOLUTION
         │
         ▼
    NEW STRATEGY
         │
         └───────────────►
```

**That loop is the heart of Nexora.**

And the really nice thing is that we don't have to decide today exactly how sophisticated the final evolution system will be. We can build the **interfaces, records, abstractions, permissions, resource system and feedback loops now**, so the increasingly intelligent parts can be upgraded later without tearing the platform apart.
