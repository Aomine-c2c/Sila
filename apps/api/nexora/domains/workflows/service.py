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

    # -------------------------------------------------------------
    # WORKFLOW EXECUTION ENGINE METHODS
    # -------------------------------------------------------------
    async def trigger_execution(
        self,
        workflow_id: uuid.UUID,
        company_id: uuid.UUID,
        title: str | None = None,
        input_payload: dict | None = None,
        triggered_by_user_id: uuid.UUID | None = None,
        triggered_by_agent_id: uuid.UUID | None = None,
        max_retries: int = 3,
        timeout_seconds: int = 3600,
    ):
        from nexora.domains.workflows.engine import WorkflowExecutionEngine
        from nexora.domains.workflows.repository import WorkflowExecutionRepository
        engine = WorkflowExecutionEngine(self.db)
        execution = await engine.trigger_workflow(
            workflow_id=workflow_id,
            company_id=company_id,
            title=title,
            input_payload=input_payload,
            triggered_by_user_id=triggered_by_user_id,
            triggered_by_agent_id=triggered_by_agent_id,
            max_retries=max_retries,
            timeout_seconds=timeout_seconds,
        )
        repo = WorkflowExecutionRepository(self.db)
        return await repo.get_execution(execution.id, company_id)

    async def get_execution(self, execution_id: uuid.UUID, company_id: uuid.UUID):
        from nexora.domains.workflows.repository import WorkflowExecutionRepository
        repo = WorkflowExecutionRepository(self.db)
        execution = await repo.get_execution(execution_id, company_id)
        if not execution:
            raise NotFoundError(f"Workflow execution {execution_id} not found.")
        return execution

    async def list_executions(
        self,
        company_id: uuid.UUID,
        workflow_id: uuid.UUID | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ):
        from nexora.domains.workflows.repository import WorkflowExecutionRepository
        repo = WorkflowExecutionRepository(self.db)
        return await repo.list_executions(
            company_id=company_id,
            workflow_id=workflow_id,
            status=status,
            limit=limit,
            offset=offset,
        )

    async def resume_execution(self, execution_id: uuid.UUID, company_id: uuid.UUID):
        from nexora.domains.workflows.engine import WorkflowExecutionEngine
        from nexora.domains.workflows.repository import WorkflowExecutionRepository
        execution = await self.get_execution(execution_id, company_id)
        engine = WorkflowExecutionEngine(self.db)
        await engine.resume_or_run_execution(execution)
        repo = WorkflowExecutionRepository(self.db)
        return await repo.get_execution(execution_id, company_id)

    async def cancel_execution(self, execution_id: uuid.UUID, company_id: uuid.UUID):
        from nexora.core.enums import WorkflowExecutionStatus
        from nexora.domains.workflows.repository import WorkflowExecutionRepository
        execution = await self.get_execution(execution_id, company_id)
        execution.status = WorkflowExecutionStatus.CANCELLED
        await self.db.flush()
        repo = WorkflowExecutionRepository(self.db)
        return await repo.get_execution(execution_id, company_id)


