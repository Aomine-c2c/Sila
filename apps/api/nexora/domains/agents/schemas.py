"""Pydantic schemas for Agents."""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from nexora.core.enums import AgentAutonomy, AgentStatus


class AgentIdentity(BaseModel):
    tone: str = "professional"
    style: str = "analytical"
    expertise_areas: list[str] = Field(default_factory=list)
    avatar_url: str | None = None


class IntelligenceConfig(BaseModel):
    provider: str = "openai"
    model: str = "gpt-4o"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, gt=0)
    system_prompt_addendum: str | None = None


class AgentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    role_id: uuid.UUID | None = None
    identity: AgentIdentity = Field(default_factory=AgentIdentity)
    system_instructions: str | None = None
    capabilities: list[str] = Field(default_factory=list)
    permissions: dict = Field(default_factory=dict)
    autonomy: AgentAutonomy = AgentAutonomy.SUPERVISED
    intelligence_config: IntelligenceConfig = Field(default_factory=IntelligenceConfig)


class AgentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    role_id: uuid.UUID | None = None
    identity: AgentIdentity | None = None
    system_instructions: str | None = None
    capabilities: list[str] | None = None
    permissions: dict | None = None
    autonomy: AgentAutonomy | None = None
    status: AgentStatus | None = None
    intelligence_config: IntelligenceConfig | None = None


class AgentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    company_id: uuid.UUID
    role_id: uuid.UUID | None
    name: str
    identity: dict
    system_instructions: str | None
    capabilities: list
    permissions: dict
    autonomy: AgentAutonomy
    status: AgentStatus
    intelligence_config: dict
    performance_metadata: dict
    created_at: datetime
    updated_at: datetime
