"""Project and Task services."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.projects.models import Project, Task
from nexora.domains.projects.repository import ProjectRepository, TaskRepository
from nexora.exceptions import BusinessRuleError, ForbiddenError, NotFoundError


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ProjectRepository(db)

    async def create(self, company_id: uuid.UUID, owner_id: uuid.UUID, **kwargs) -> Project:
        return await self.repo.create(company_id=company_id, owner_id=owner_id, **kwargs)

    async def get(self, project_id: uuid.UUID, company_id: uuid.UUID) -> Project:
        project = await self.repo.get_by_id(project_id)
        if not project or project.company_id != company_id:
            raise NotFoundError(f"Project {project_id} not found.")
        return project

    async def list(self, company_id: uuid.UUID) -> list[Project]:
        return await self.repo.list_by_company(company_id)

    async def update(self, project_id: uuid.UUID, company_id: uuid.UUID, **kwargs) -> Project:
        project = await self.get(project_id, company_id)
        return await self.repo.update(project, **kwargs)

    async def delete(
        self, project_id: uuid.UUID, company_id: uuid.UUID, requesting_user_id: uuid.UUID
    ) -> None:
        project = await self.get(project_id, company_id)
        if project.owner_id != requesting_user_id:
            raise ForbiddenError("Only the project owner can delete it.")
        await self.repo.soft_delete(project)


class TaskService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)

    async def create(
        self, project_id: uuid.UUID, company_id: uuid.UUID, **kwargs
    ) -> Task:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.company_id != company_id:
            raise NotFoundError("Project not found.")
        return await self.repo.create(project_id=project_id, company_id=company_id, **kwargs)

    async def get(self, task_id: uuid.UUID, company_id: uuid.UUID) -> Task:
        task = await self.repo.get_by_id(task_id)
        if not task or task.company_id != company_id:
            raise NotFoundError(f"Task {task_id} not found.")
        return task

    async def list(self, project_id: uuid.UUID, company_id: uuid.UUID) -> list[Task]:
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.company_id != company_id:
            raise NotFoundError("Project not found.")
        return await self.repo.list_by_project(project_id)

    async def update(self, task_id: uuid.UUID, company_id: uuid.UUID, **kwargs) -> Task:
        task = await self.get(task_id, company_id)
        return await self.repo.update(task, **kwargs)

    async def delete(self, task_id: uuid.UUID, company_id: uuid.UUID) -> None:
        task = await self.get(task_id, company_id)
        await self.repo.soft_delete(task)
