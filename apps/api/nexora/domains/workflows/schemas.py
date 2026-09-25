"""Workflow Pydantic schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from nexora.core.enums import WorkflowStatus, WorkflowTriggerType


class WorkflowStep(BaseModel):
    id: str = Field(description="Unique step identifier within the workflow")
    type: str = Field(description="Step type: agent_run, human_approval, condition, delay, webhook")
    name: str
    config: dict = Field(default_factory=dict)
    next_step_id: str | None = None


class WorkflowCondition(BaseModel):
    id: str
    expression: str
    true_step_id: str
    false_step_id: str


class ApprovalConfig(BaseModel):
    required_role: str = "MANAGER"
    timeout_hours: int = 24
    on_timeout: str = "escalate"  # escalate | auto_approve | auto_reject


class CompletionCriteria(BaseModel):
    all_steps_completed: bool = True
    success_condition: str | None = None


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    trigger_type: WorkflowTriggerType = WorkflowTriggerType.MANUAL
    trigger_config: dict = Field(default_factory=dict)
    steps: list[WorkflowStep] = Field(default_factory=list)
    agents: list[uuid.UUID] = Field(default_factory=list)
    tools: list[dict] = Field(default_factory=list)
    conditions: list[WorkflowCondition] = Field(default_factory=list)
    approvals: ApprovalConfig = Field(default_factory=ApprovalConfig)
    completion_criteria: CompletionCriteria = Field(default_factory=CompletionCriteria)


class WorkflowUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    trigger_type: WorkflowTriggerType | None = None
    trigger_config: dict | None = None
    steps: list[WorkflowStep] | None = None
    agents: list[uuid.UUID] | None = None
    tools: list[dict] | None = None
    conditions: list[WorkflowCondition] | None = None
    approvals: ApprovalConfig | None = None
    completion_criteria: CompletionCriteria | None = None
    status: WorkflowStatus | None = None


class WorkflowResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    description: str | None
    trigger_type: WorkflowTriggerType
    trigger_config: dict
    steps: list
    agents: list
    tools: list
    conditions: list
    approvals: dict
    completion_criteria: dict
    status: WorkflowStatus
    created_at: datetime
    updated_at: datetime
