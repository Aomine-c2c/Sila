"""Agent model — the AI worker entity in NEXORA."""
import uuid

from sqlalchemy import JSON, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from nexora.core.base import NexoraBase
from nexora.core.enums import AgentAutonomy, AgentStatus


class Agent(NexoraBase):
    """
    An AI agent assigned to an organizational role.
    Agents execute tasks, participate in workflows, and make decisions
    within the boundaries defined by their role's authority and the company's DNA.
    """
    __tablename__ = "agents"

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("org_roles.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Identity
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    identity: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False,
        comment="Persona config: tone, style, expertise areas, avatar")
    system_instructions: Mapped[str | None] = mapped_column(Text, nullable=True,
        comment="Base system prompt governing all agent behavior")

    # Capabilities and Permissions
    capabilities: Mapped[list] = mapped_column(JSON, default=list, nullable=False,
        comment="What this agent can do: list of capability identifiers")
    permissions: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False,
        comment="What resources/tools this agent is allowed to access")

    # Autonomy configuration
    autonomy: Mapped[AgentAutonomy] = mapped_column(
        SAEnum(AgentAutonomy, name="agent_autonomy"),
        default=AgentAutonomy.SUPERVISED,
        nullable=False,
    )
    status: Mapped[AgentStatus] = mapped_column(
        SAEnum(AgentStatus, name="agent_status"),
        default=AgentStatus.ACTIVE,
        nullable=False,
    )

    # LLM configuration
    intelligence_config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False,
        comment="LLM config: provider, model, temperature, max_tokens, etc.")

    # Performance tracking
    performance_metadata: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False,
        comment="Metrics: total_runs, success_rate, avg_duration_ms, last_active_at")

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="agents")  # noqa: F821
    role: Mapped["OrgRole | None"] = relationship("OrgRole", back_populates="agents", lazy="select")  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="assigned_agent", lazy="select")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Agent id={self.id} name={self.name} autonomy={self.autonomy}>"
