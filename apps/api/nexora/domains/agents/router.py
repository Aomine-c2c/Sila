"""Agent API router."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.permissions import require_manager, require_member, require_viewer
from nexora.database import get_db
from nexora.domains.auth.router import get_current_user
from nexora.domains.auth.models import User
from nexora.domains.agents.schemas import AgentCreate, AgentResponse, AgentUpdate
from nexora.domains.agents.service import AgentService

router = APIRouter(prefix="/companies/{company_id}/agents", tags=["Agents"])

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    company_id: uuid.UUID, body: AgentCreate, current_user: CurrentUser, db: DB,
    _: None = Depends(require_manager()),
):
    svc = AgentService(db)
    return await svc.create(company_id=company_id, **body.model_dump())


@router.get("", response_model=list[AgentResponse])
async def list_agents(
    company_id: uuid.UUID, current_user: CurrentUser, db: DB,
    _: None = Depends(require_viewer()),
):
    return await AgentService(db).list(company_id)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    company_id: uuid.UUID, agent_id: uuid.UUID, current_user: CurrentUser, db: DB,
    _: None = Depends(require_viewer()),
):
    return await AgentService(db).get(agent_id, company_id)


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    company_id: uuid.UUID, agent_id: uuid.UUID, body: AgentUpdate,
    current_user: CurrentUser, db: DB, _: None = Depends(require_manager()),
):
    return await AgentService(db).update(agent_id, company_id, **body.model_dump(exclude_none=True))


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    company_id: uuid.UUID, agent_id: uuid.UUID, current_user: CurrentUser, db: DB,
    _: None = Depends(require_manager()),
):
    await AgentService(db).delete(agent_id, company_id)
