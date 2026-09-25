"""Agent service — business logic."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.agents.models import Agent
from nexora.domains.agents.repository import AgentRepository
from nexora.exceptions import NotFoundError


class AgentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AgentRepository(db)

    async def create(self, company_id: uuid.UUID, **kwargs) -> Agent:
        return await self.repo.create(company_id=company_id, **kwargs)

    async def get(self, agent_id: uuid.UUID, company_id: uuid.UUID) -> Agent:
        agent = await self.repo.get_by_id(agent_id)
        if not agent or agent.company_id != company_id:
            raise NotFoundError(f"Agent {agent_id} not found.")
        return agent

    async def list(self, company_id: uuid.UUID) -> list[Agent]:
        return await self.repo.list_by_company(company_id)

    async def update(self, agent_id: uuid.UUID, company_id: uuid.UUID, **kwargs) -> Agent:
        agent = await self.get(agent_id, company_id)
        return await self.repo.update(agent, **kwargs)

    async def delete(self, agent_id: uuid.UUID, company_id: uuid.UUID) -> None:
        agent = await self.get(agent_id, company_id)
        await self.repo.soft_delete(agent)
