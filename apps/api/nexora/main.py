"""
NEXORA API — Main Application Entry Point.

Wires together all domain routers, middleware, and lifecycle events.
"""
import structlog
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nexora.config import get_settings
from nexora.database import engine, Base
from nexora.exceptions import NexoraError, nexora_exception_handler, register_exception_handlers
from nexora.middleware import RequestIDMiddleware

# Domain routers
from nexora.domains.auth.router import router as auth_router
from nexora.domains.organizations.router import router as org_router
from nexora.domains.agents.router import router as agent_router
from nexora.domains.projects.router import router as project_router
from nexora.domains.workflows.router import router as workflow_router
from nexora.domains.policies.router import router as policy_router
from nexora.domains.decisions.router import router as decision_router
from nexora.domains.intelligence.router import router as intelligence_router
from nexora.domains.resources.router import router as resource_router
from nexora.domains.memory.router import router as memory_router
from nexora.domains.governance.router import router as governance_router
from nexora.domains.blueprints.router import router as blueprint_router

# Import all models so Alembic/SQLAlchemy can discover them
import nexora.domains.auth.models  # noqa: F401
import nexora.domains.organizations.models  # noqa: F401
import nexora.domains.agents.models  # noqa: F401
import nexora.domains.projects.models  # noqa: F401
import nexora.domains.workflows.models  # noqa: F401
import nexora.domains.policies.models  # noqa: F401
import nexora.domains.decisions.models  # noqa: F401
import nexora.domains.intelligence.models  # noqa: F401
import nexora.domains.resources.models  # noqa: F401
import nexora.domains.memory.models  # noqa: F401
import nexora.domains.governance.models  # noqa: F401
import nexora.domains.blueprints.models  # noqa: F401

settings = get_settings()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("nexora_startup", environment=settings.ENVIRONMENT, version=settings.APP_VERSION)
    yield
    logger.info("nexora_shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "NEXORA — Autonomous Organization OS\n\n"
            "The AI-native platform for organizational intelligence and automation."
        ),
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware ─────────────────────────────────────────────────────────
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ─────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── API Routes ─────────────────────────────────────────────────────────
    API_PREFIX = "/api/v1"

    app.include_router(auth_router, prefix=API_PREFIX)
    app.include_router(org_router, prefix=API_PREFIX)
    app.include_router(agent_router, prefix=API_PREFIX)
    app.include_router(project_router, prefix=API_PREFIX)
    app.include_router(workflow_router, prefix=API_PREFIX)
    app.include_router(policy_router, prefix=API_PREFIX)
    app.include_router(decision_router, prefix=API_PREFIX)
    app.include_router(intelligence_router, prefix=API_PREFIX)
    app.include_router(resource_router, prefix=API_PREFIX)
    app.include_router(memory_router, prefix=API_PREFIX)
    app.include_router(governance_router, prefix=API_PREFIX)
    app.include_router(blueprint_router, prefix=API_PREFIX)

    # ── UI Route ───────────────────────────────────────────────────────────
    from pathlib import Path
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    static_dir = Path(__file__).parent / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

        @app.get("/ui/agents", tags=["UI"], summary="Agent Profile Inspector UI")
        async def agent_profile_ui():
            return FileResponse(static_dir / "agent_profile.html")

        @app.get("/ui/intelligence", tags=["UI"], summary="Intelligence Exchange Dashboard UI")
        async def intelligence_dashboard_ui():
            return FileResponse(static_dir / "intelligence_dashboard.html")

        @app.get("/ui/resources", tags=["UI"], summary="Resource Control Center UI")
        async def resource_control_center_ui():
            return FileResponse(static_dir / "resource_control_center.html")

        @app.get("/ui/memory", tags=["UI"], summary="Organizational Knowledge & Memory UI")
        async def memory_ui():
            return FileResponse(static_dir / "organizational_memory.html")

        @app.get("/ui/governance", tags=["UI"], summary="Organizational Governance & Audit Viewer UI")
        async def governance_ui():
            return FileResponse(static_dir / "governance_dashboard.html")

        @app.get("/ui/blueprints", tags=["UI"], summary="Company Blueprints & Build My Company UI")
        async def blueprints_ui():
            return FileResponse(static_dir / "company_blueprints.html")

    # ── Health Check ───────────────────────────────────────────────────────
    @app.get("/health", tags=["System"], summary="Health check")
    async def health():
        return {
            "status": "ok",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": "NEXORA API", "docs": "/api/docs", "ui": "/ui/agents"}

    return app


app = create_app()
