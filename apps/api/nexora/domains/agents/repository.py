"""Agent repository."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.agents.models import Agent
from nexora.core.enums import AgentStatus


class AgentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, agent_id: uuid.UUID) -> Agent | None:
        result = await self.db.execute(
            select(Agent).where(Agent.id == agent_id, Agent.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def list_by_company(
        self, company_id: uuid.UUID, status: AgentStatus | None = None
    ) -> list[Agent]:
        q = select(Agent).where(Agent.company_id == company_id, Agent.is_deleted.is_(False))
        if status:
            q = q.where(Agent.status == status)
        result = await self.db.execute(q.order_by(Agent.name))
        return list(result.scalars().all())

    async def create(self, company_id: uuid.UUID, **kwargs) -> Agent:
        # Convert nested Pydantic objects to dict
        for key in ("identity", "intelligence_config"):
            if hasattr(kwargs.get(key), "model_dump"):
                kwargs[key] = kwargs[key].model_dump()
        agent = Agent(company_id=company_id, **kwargs)
        self.db.add(agent)
        await self.db.flush()
        await self.db.refresh(agent)
        return agent

    async def update(self, agent: Agent, **kwargs) -> Agent:
        for key, value in kwargs.items():
            if value is not None and hasattr(agent, key):
                if hasattr(value, "model_dump"):
                    value = value.model_dump()
                setattr(agent, key, value)
        await self.db.flush()
        await self.db.refresh(agent)
        return agent

    async def soft_delete(self, agent: Agent) -> None:
        from datetime import UTC, datetime
        agent.is_deleted = True
        agent.deleted_at = datetime.now(UTC)
        agent.status = AgentStatus.INACTIVE
        await self.db.flush()
