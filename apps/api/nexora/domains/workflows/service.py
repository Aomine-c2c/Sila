"""Workflow service."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.workflows.models import Workflow
from nexora.domains.workflows.repository import WorkflowRepository
from nexora.exceptions import BusinessRuleError, NotFoundError
from nexora.core.enums import WorkflowStatus


class WorkflowService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = WorkflowRepository(db)

    async def create(self, company_id: uuid.UUID, **kwargs) -> Workflow:
        return await self.repo.create(company_id=company_id, **kwargs)

    async def get(self, workflow_id: uuid.UUID, company_id: uuid.UUID) -> Workflow:
        wf = await self.repo.get_by_id(workflow_id)
        if not wf or wf.company_id != company_id:
            raise NotFoundError(f"Workflow {workflow_id} not found.")
        return wf

    async def list(self, company_id: uuid.UUID) -> list[Workflow]:
        return await self.repo.list_by_company(company_id)

    async def update(self, workflow_id: uuid.UUID, company_id: uuid.UUID, **kwargs) -> Workflow:
        wf = await self.get(workflow_id, company_id)
        if wf.status == WorkflowStatus.ARCHIVED:
            raise BusinessRuleError("Cannot update an archived workflow.")
        return await self.repo.update(wf, **kwargs)

    async def activate(self, workflow_id: uuid.UUID, company_id: uuid.UUID) -> Workflow:
        wf = await self.get(workflow_id, company_id)
        if not wf.steps:
            raise BusinessRuleError("Cannot activate a workflow with no steps.")
        return await self.repo.update(wf, status=WorkflowStatus.ACTIVE)

    async def delete(self, workflow_id: uuid.UUID, company_id: uuid.UUID) -> None:
        wf = await self.get(workflow_id, company_id)
        await self.repo.soft_delete(wf)
