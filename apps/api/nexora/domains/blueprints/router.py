"""
REST API Router for NEXORA Company Blueprints and 'Build My Company'.
Endpoints:
- GET /blueprints (List all 10 core + custom templates)
- GET /blueprints/{id_or_key} (Inspect blueprint)
- POST /blueprints (Create custom blueprint)
- PATCH /blueprints/{id} (Customize blueprint before activation)
- POST /blueprints/{id}/instantiate (Activate into a live company)
- POST /blueprints/{id}/duplicate (Duplicate blueprint)
- GET /blueprints/{id}/export (Export JSON)
- POST /blueprints/import (Import JSON)
- POST /blueprints/save-template (Save company as reusable template)
- POST /blueprints/build-my-company (Natural language synthesis proposal)
- GET /blueprints/build-my-company/{proposal_id} (Inspect proposal)
- POST /blueprints/build-my-company/{proposal_id}/instantiate (Approve & instantiate)
"""
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.database import get_db
from nexora.domains.auth.models import User
from nexora.domains.auth.router import get_current_user
from nexora.domains.blueprints.schemas import (
    BuildMyCompanyProposalResponse,
    BuildMyCompanyRequest,
    CompanyBlueprintCreate,
    CompanyBlueprintResponse,
    CompanyBlueprintUpdate,
    InstantiateBlueprintRequest,
    InstantiateBlueprintResponse,
    SaveAsTemplateRequest,
)
from nexora.domains.blueprints.service import BlueprintService

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]

router = APIRouter(prefix="/blueprints", tags=["Company Blueprints"])


@router.get("", response_model=list[CompanyBlueprintResponse])
async def list_blueprints(
    db: DB,
    category: str | None = Query(None, description="Filter by category"),
):
    """List available organizational blueprints (all 10 system templates + custom templates)."""
    service = BlueprintService(db)
    return await service.list_blueprints(category=category)


@router.post("", response_model=CompanyBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def create_blueprint(
    data: CompanyBlueprintCreate,
    current_user: CurrentUser,
    db: DB,
):
    """Create a new custom organizational blueprint."""
    service = BlueprintService(db)
    return await service.create_blueprint(data, user_id=current_user.id)


@router.get("/{id_or_key}", response_model=CompanyBlueprintResponse)
async def get_blueprint(
    id_or_key: str,
    db: DB,
):
    """Inspect full specification of a blueprint by UUID or key."""
    service = BlueprintService(db)
    return await service.get_blueprint(id_or_key)


@router.patch("/{blueprint_id}", response_model=CompanyBlueprintResponse)
async def customize_blueprint(
    blueprint_id: uuid.UUID,
    data: CompanyBlueprintUpdate,
    current_user: CurrentUser,
    db: DB,
):
    """Customize an existing blueprint before activation."""
    service = BlueprintService(db)
    return await service.update_blueprint(blueprint_id, data)


@router.post("/{id_or_key}/instantiate", response_model=InstantiateBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def instantiate_blueprint(
    id_or_key: str,
    req: InstantiateBlueprintRequest,
    current_user: CurrentUser,
    db: DB,
):
    """
    CREATE FROM BLUEPRINT:
    Instantiates a blueprint into a real, operational Company with:
    - Departments, roles, and autonomous employee agents
    - Workflows, policies, and company constitution
    - Autonomy levels, governance approval rules, and resource quotas.
    """
    service = BlueprintService(db)
    return await service.instantiate_blueprint(id_or_key, current_user, req)


@router.post("/{blueprint_id}/duplicate", response_model=CompanyBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_blueprint(
    blueprint_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
):
    """Duplicate an existing blueprint for customization."""
    service = BlueprintService(db)
    return await service.duplicate_blueprint(blueprint_id, user_id=current_user.id)


@router.get("/{blueprint_id}/export")
async def export_blueprint(
    blueprint_id: uuid.UUID,
    db: DB,
):
    """Export blueprint specification as standard JSON."""
    service = BlueprintService(db)
    return await service.export_blueprint_json(blueprint_id)


@router.post("/import", response_model=CompanyBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def import_blueprint(
    payload: dict[str, Any],
    current_user: CurrentUser,
    db: DB,
):
    """Import a blueprint from a JSON specification."""
    service = BlueprintService(db)
    return await service.import_blueprint_json(payload, user_id=current_user.id)


@router.post("/save-template", response_model=CompanyBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def save_company_as_template(
    req: SaveAsTemplateRequest,
    current_user: CurrentUser,
    db: DB,
):
    """SAVE AS TEMPLATE: Harvests a running company's structure into a reusable blueprint."""
    service = BlueprintService(db)
    return await service.save_company_as_template(req, current_user)


# ==========================================
# BUILD MY COMPANY (NATURAL LANGUAGE SYNTHESIS)
# ==========================================

@router.post("/build-my-company", response_model=BuildMyCompanyProposalResponse, status_code=status.HTTP_201_CREATED)
async def build_my_company(
    req: BuildMyCompanyRequest,
    current_user: CurrentUser,
    db: DB,
):
    """
    BUILD MY COMPANY:
    Natural language organizational synthesis.
    Generates a proposed blueprint with departments, agents, workflows,
    estimated operating costs, risks, and missing capabilities.
    Does NOT immediately activate it until user reviews and approves.
    """
    service = BlueprintService(db)
    return await service.generate_company_proposal(req, user=current_user)


@router.get("/build-my-company/{proposal_id}", response_model=BuildMyCompanyProposalResponse)
async def get_generation_proposal(
    proposal_id: uuid.UUID,
    db: DB,
):
    """Inspect a synthesized company generation proposal."""
    service = BlueprintService(db)
    return await service.get_proposal(proposal_id)


@router.post("/build-my-company/{proposal_id}/instantiate", response_model=InstantiateBlueprintResponse, status_code=status.HTTP_201_CREATED)
async def instantiate_generation_proposal(
    proposal_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
):
    """Approve and instantiate a synthesized company generation proposal into a real Company."""
    service = BlueprintService(db)
    return await service.instantiate_proposal(proposal_id, user=current_user)
