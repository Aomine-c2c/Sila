"""Workflow model — orchestrated multi-step processes."""
import uuid

from sqlalchemy import JSON, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from nexora.core.base import NexoraBase
from nexora.core.enums import WorkflowStatus, WorkflowTriggerType


class Workflow(NexoraBase):
    """
    A reusable process definition: a sequence of steps, agents, and tools
    that can be triggered manually, on a schedule, or by events.
    """
    __tablename__ = "workflows"

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Trigger configuration
    trigger_type: Mapped[WorkflowTriggerType] = mapped_column(
        SAEnum(WorkflowTriggerType, name="workflow_trigger_type"),
        default=WorkflowTriggerType.MANUAL,
        nullable=False,
    )
    trigger_config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False,
        comment="Trigger-specific config: cron expression, webhook URL, event name, etc.")

    # Workflow definition
    steps: Mapped[list] = mapped_column(JSON, default=list, nullable=False,
        comment="Ordered list of step objects: {id, type, name, config, next_step_id}")
    agents: Mapped[list] = mapped_column(JSON, default=list, nullable=False,
        comment="List of agent IDs participating in this workflow")
    tools: Mapped[list] = mapped_column(JSON, default=list, nullable=False,
        comment="Tool configurations available during workflow execution")
    conditions: Mapped[list] = mapped_column(JSON, default=list, nullable=False,
        comment="Branching conditions: {id, expression, true_step, false_step}")
    approvals: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False,
        comment="Approval gate config: {required_role, timeout_hours, on_timeout}")
    completion_criteria: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False,
        comment="What constitutes a successful workflow completion")

    status: Mapped[WorkflowStatus] = mapped_column(
        SAEnum(WorkflowStatus, name="workflow_status"),
        default=WorkflowStatus.DRAFT,
        nullable=False,
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="workflows")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Workflow id={self.id} name={self.name}>"
