"""Workflow repository."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.workflows.models import Workflow
from nexora.core.enums import WorkflowStatus


class WorkflowRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, workflow_id: uuid.UUID) -> Workflow | None:
        result = await self.db.execute(
            select(Workflow).where(Workflow.id == workflow_id, Workflow.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def list_by_company(self, company_id: uuid.UUID) -> list[Workflow]:
        result = await self.db.execute(
            select(Workflow).where(
                Workflow.company_id == company_id, Workflow.is_deleted.is_(False)
            ).order_by(Workflow.name)
        )
        return list(result.scalars().all())

    def _serialize_kwargs(self, kwargs: dict) -> dict:
        """Convert any Pydantic models in kwargs to dicts."""
        for key, value in kwargs.items():
            if hasattr(value, "model_dump"):
                kwargs[key] = value.model_dump()
            elif isinstance(value, list) and value and hasattr(value[0], "model_dump"):
                kwargs[key] = [v.model_dump() if hasattr(v, "model_dump") else str(v) for v in value]
            elif isinstance(value, list):
                kwargs[key] = [str(v) if isinstance(v, uuid.UUID) else v for v in value]
        return kwargs

    async def create(self, company_id: uuid.UUID, **kwargs) -> Workflow:
        kwargs = self._serialize_kwargs(kwargs)
        workflow = Workflow(company_id=company_id, **kwargs)
        self.db.add(workflow)
        await self.db.flush()
        await self.db.refresh(workflow)
        return workflow

    async def update(self, workflow: Workflow, **kwargs) -> Workflow:
        kwargs = self._serialize_kwargs(kwargs)
        for key, value in kwargs.items():
            if value is not None and hasattr(workflow, key):
                setattr(workflow, key, value)
        await self.db.flush()
        await self.db.refresh(workflow)
        return workflow

    async def soft_delete(self, workflow: Workflow) -> None:
        from datetime import UTC, datetime
        workflow.is_deleted = True
        workflow.deleted_at = datetime.now(UTC)
        workflow.status = WorkflowStatus.ARCHIVED
        await self.db.flush()
