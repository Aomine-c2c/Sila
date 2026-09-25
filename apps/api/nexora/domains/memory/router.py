"""
REST API Router for NEXORA Organizational Memory System.
Endpoints for:
- 10-domain memory items management
- Searchable Knowledge Base interface
- Context Assembly Engine (Task -> Authorized -> Relevant -> Minimal prompt)
- Decision Records (deliberation, options, evidence, outcomes, lessons learned)
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.permissions import require_admin, require_member, require_viewer
from nexora.database import get_db
from nexora.domains.auth.models import User
from nexora.domains.auth.router import get_current_user
from nexora.domains.memory.schemas import (
    ContextAssemblyRequest,
    ContextAssemblyResponse,
    DecisionRecordCreate,
    DecisionRecordOutcomeUpdate,
    DecisionRecordResponse,
    MemoryItemCreate,
    MemoryItemResponse,
    MemorySearchQuery,
)
from nexora.domains.memory.service import MemoryService

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]

router = APIRouter(prefix="/companies/{company_id}/memory", tags=["Organizational Memory"])


@router.get("/items", response_model=list[MemoryItemResponse])
async def list_memories(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    domain: str | None = Query(None, description="COMPANY | DEPARTMENT | AGENT | PROJECT | CUSTOMER | DECISION | POLICY | EXPERIMENT | FAILURE | KNOWLEDGE_BASE"),
    scope: str | None = Query(None, description="PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED | PRIVATE"),
    department_id: uuid.UUID | None = None,
    agent_id: uuid.UUID | None = None,
    project_id: uuid.UUID | None = None,
    limit: int = Query(50, ge=1, le=100),
    _: None = Depends(require_member()),
):
    service = MemoryService(db)
    return await service.list_memories(
        company_id=company_id,
        domain=domain,
        scope=scope,
        department_id=department_id,
        agent_id=agent_id,
        project_id=project_id,
        limit=limit,
    )


@router.post("/items", response_model=MemoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_memory_item(
    company_id: uuid.UUID,
    data: MemoryItemCreate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    service = MemoryService(db)
    return await service.create_memory(company_id, data, owner_id=current_user.id)


@router.get("/items/{memory_id}", response_model=MemoryItemResponse)
async def get_memory_item(
    company_id: uuid.UUID,
    memory_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    service = MemoryService(db)
    return await service.get_memory(company_id, memory_id)


@router.get("/search", response_model=list[MemoryItemResponse])
async def search_knowledge_base(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    q: str = Query(..., min_length=1, description="Search keywords"),
    domain: str | None = Query(None),
    scope: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    _: None = Depends(require_member()),
):
    """
    Searchable organizational knowledge base interface across all 10 memory domains.
    """
    service = MemoryService(db)
    return await service.search_memories(company_id, query=q, domain=domain, scope=scope, limit=limit)


@router.post("/assemble-context", response_model=ContextAssemblyResponse)
async def assemble_context(
    company_id: uuid.UUID,
    data: ContextAssemblyRequest,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    """
    Task Context Assembly Engine:
    TASK -> identify required knowledge -> retrieve memories -> apply permissions -> rank relevance -> construct minimal prompt.
    Ensures external AI models never receive unauthorized or excess company memory.
    """
    service = MemoryService(db)
    return await service.assemble_context_for_task(company_id, data)


# ==========================================
# DECISION RECORDS
# ==========================================

@router.get("/decisions", response_model=list[DecisionRecordResponse])
async def list_decision_records(
    company_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    limit: int = Query(50, ge=1, le=100),
    _: None = Depends(require_member()),
):
    service = MemoryService(db)
    return await service.list_decision_records(company_id, limit=limit)


@router.post("/decisions", response_model=DecisionRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_decision_record(
    company_id: uuid.UUID,
    data: DecisionRecordCreate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    service = MemoryService(db)
    return await service.create_decision_record(company_id, data, user_id=current_user.id)


@router.post("/decisions/{decision_id}/outcome", response_model=DecisionRecordResponse)
async def record_decision_outcome(
    company_id: uuid.UUID,
    decision_id: uuid.UUID,
    data: DecisionRecordOutcomeUpdate,
    current_user: CurrentUser,
    db: DB,
    _: None = Depends(require_member()),
):
    """
    Record actual outcome and lessons learned to enable ongoing organizational learning.
    """
    service = MemoryService(db)
    return await service.record_decision_outcome(company_id, decision_id, data)
