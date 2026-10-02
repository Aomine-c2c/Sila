# NEIMAN — Autonomous Organization OS

> The AI-native platform for organizational intelligence and automation.

## Overview

NEIMAN is a full-stack platform that enables organizations to:
- Define operational workflows in natural language
- Delegate repetitive decisions to autonomous AI agents
- Surface real-time organizational intelligence into a unified interface
- Maintain full auditability of every AI-assisted action

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NEIMAN Platform                       │
│                                                         │
│   ┌──────────────┐     ┌──────────────────────────┐     │
│   │   Frontend   │────▶│     API Gateway (HTTPS)  │     │
│   │  (Next.js)   │◀────│     + Rate Limiting       │     │
│   └──────────────┘     └──────────┬───────────────┘     │
│                                   │                      │
│              ┌────────────────────┼───────────────┐      │
│              │                    │               │      │
│      ┌───────▼──────┐  ┌─────────▼──────┐  ┌────▼───┐  │
│      │  Core API    │  │  Agent API      │  │ WS Hub │  │
│      │  (FastAPI)   │  │  (FastAPI)      │  │(async) │  │
│      └───────┬──────┘  └─────────┬──────┘  └────┬───┘  │
│              │                    │               │      │
│      ┌───────▼────────────────────▼───────────────┘      │
│      │              Service Layer                        │
│      └───────┬──────────────┬────────────────────────┐   │
│              │               │                        │   │
│      ┌───────▼──────┐  ┌───▼──────────┐  ┌─────────▼─┐ │
│      │  PostgreSQL  │  │ Vector DB    │  │   Redis   │ │
│      │  (primary)   │  │ (pgvector)   │  │  (cache)  │ │
│      └──────────────┘  └──────────────┘  └───────────┘ │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │           LLM Adapter Layer                      │   │
│   │   OpenAI | Anthropic | Gemini | Local (Ollama)   │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend (API)
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 16 + pgvector
- **Cache/Queue**: Redis 7
- **ORM**: SQLAlchemy 2.0 + Alembic
- **Auth**: JWT (RS256) + Refresh Token Rotation
- **Validation**: Pydantic v2
- **Logging**: structlog + OpenTelemetry
- **Testing**: pytest + pytest-asyncio + httpx

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library
- **Components**: Storybook

### Infrastructure
- **Containerization**: Docker (multi-stage builds)
- **Orchestration**: docker-compose (dev), Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry

## Project Structure

```
NEIMAN/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── apps/
│   ├── api/                # FastAPI backend
│   │   ├── NEIMAN/
│   │   │   ├── agents/     # Agent definitions & runner
│   │   │   ├── auth/       # JWT, RBAC
│   │   │   ├── blueprints/ # Company templates
│   │   │   ├── councils/   # Agent councils & deliberation
│   │   │   ├── core/       # Base models, exceptions, deps
│   │   │   ├── decisions/  # Decision records
│   │   │   ├── governance/ # Approvals, escalations
│   │   │   ├── intelligence/ # Multi-provider LLM routing
│   │   │   ├── memory/     # Organizational memory
│   │   │   ├── organizations/ # Companies, departments, roles
│   │   │   ├── policies/   # Policy engine
│   │   │   ├── projects/   # Projects, tasks, milestones
│   │   │   ├── resources/  # Budget pools, allocation
│   │   │   └── workflows/  # Workflow engine
│   │   ├── tests/          # API tests (100 tests)
│   │   ├── alembic/        # Database migrations
│   │   ├── Dockerfile
│   │   └── pyproject.toml
│   └── web/                # Next.js frontend
│       ├── src/
│       │   ├── app/        # App Router pages
│       │   ├── components/ # React components
│       │   ├── hooks/      # Custom hooks
│       │   ├── lib/        # Utilities
│       │   ├── store/      # Zustand stores
│       │   └── types/      # TypeScript types
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml
├── Makefile
└── README.md
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for web development)
- Python 3.11+ (for API development)
- uv (Python package manager)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd NEIMAN

# Start all services
make dev

# Or manually:
docker-compose up --build
```

Services will be available at:
- **Web**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

### Local Development

#### Backend
```bash
cd apps/api
uv sync --extra dev
cp .env.example .env  # Edit with your values
make migrate
make dev-api
```

#### Frontend
```bash
cd apps/web
npm ci
cp .env.example .env.local  # Edit with your values
npm run dev
```

#### Desktop App (Tauri)
```bash
# Run desktop app with automatic API orchestration & hot-reload:
make dev-desktop

# Or directly via the runner script:
./scripts/run-desktop.sh

# Build native production desktop binary:
make tauri-build
```

## Available Commands

```bash
make help           # Show all commands
make install        # Install all dependencies
make dev            # Start full stack (Docker)
make dev-api        # Start API only (hot reload)
make dev-web        # Start Web only (hot reload)
make test           # Run all tests
make test-api       # Run API tests only
make test-web       # Run Web tests only
make migrate        # Run database migrations
make migrate-new msg="description"  # Create new migration
make lint           # Run all linters
make format         # Format all code
```

## API Domains

| Domain | Description | Endpoints |
|--------|-------------|-----------|
| **Auth** | Authentication & authorization | `/api/v1/auth/*` |
| **Organizations** | Companies, departments, roles, DNA | `/api/v1/companies/*` |
| **Agents** | Agent lifecycle, execution, hierarchy | `/api/v1/companies/{id}/agents/*` |
| **Workflows** | Workflow definitions & executions | `/api/v1/companies/{id}/workflows/*` |
| **Councils** | Agent councils & deliberations | `/api/v1/companies/{id}/councils/*` |
| **Governance** | Approvals, escalations, constitution | `/api/v1/companies/{id}/governance/*` |
| **Decisions** | Decision records & outcomes | `/api/v1/companies/{id}/decisions/*` |
| **Intelligence** | Multi-provider LLM routing | `/api/v1/companies/{id}/intelligence/*` |
| **Memory** | Organizational memory & search | `/api/v1/companies/{id}/memory/*` |
| **Resources** | Budget pools & allocations | `/api/v1/companies/{id}/resources/*` |
| **Policies** | Policy engine & versioning | `/api/v1/companies/{id}/policies/*` |
| **Projects** | Projects, tasks, milestones | `/api/v1/companies/{id}/projects/*` |
| **Blueprints** | Company templates | `/api/v1/companies/{id}/blueprints/*` |

## UI Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Main dashboard with stats & activity |
| `/organizations` | Company & department management |
| `/agents` | Agent browser & configuration |
| `/workflows` | Workflow designer & observability |
| `/councils` | Council deliberation viewer |
| `/memory` | Knowledge base & search |
| `/governance` | Approvals, escalations, audit |
| `/resources` | Resource control center |
| `/blueprints` | Company blueprints & templates |
| `/settings` | Organization settings |

## Key Features Implemented

### Workflow Engine
- Sequential & parallel execution
- Conditional branching
- Human-in-the-loop approval gates
- Resource request evaluation
- Retries with backoff & timeouts
- Full state persistence & observability

### Agent Councils & Deliberation
- Multi-agent councils with heterogeneous models
- Structured deliberation: Proposal → Review → Objections → Discussion → Synthesis → Decision
- Dissent recording as organizational knowledge
- Decision ratification & memory integration

### Agent Execution Lifecycle
- 10-step execution: Context Assembly → Plan → Resource Check → Intelligence Selection → Tool Execution → Result → Validation → Report → Memory Update
- Policy enforcement at each step
- Budget & rate limiting per agent
- Full audit trail

### Organizational Memory
- 10 memory domains (Company, Department, Agent, Project, Customer, Decision, Policy, Experiment, Failure, Knowledge Base)
- Permission-aware context assembly
- Decision records with lessons learned
- Vector similarity search

### Resource Engine
- Priority-based allocation (Critical → Background)
- Request evaluation: Approve / Deny / Defer / Reduce / Queue
- Budget tracking with observed vs estimated telemetry
- Real-time capacity monitoring

## Testing

```bash
# API tests (100 tests)
cd apps/api
uv run pytest tests/ -v

# Web tests
cd apps/web
npm test

# All tests
make test
```

## Deployment

### Staging (Auto on main branch)
```bash
# Triggered automatically on push to main
# Deploys to staging environment
```

### Production (On version tags)
```bash
git tag v0.1.0
git push origin v0.1.0
# Triggers production deployment
```

## Environment Variables

### API (`apps/api/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `SECRET_KEY` | Yes | JWT signing key (RS256) |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic API key |
| `GOOGLE_API_KEY` | No | Google AI API key |

### Web (`apps/web/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_APP_NAME` | No | App display name |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `make lint` and `make test`
5. Submit a PR

## License

Proprietary — All rights reserved.