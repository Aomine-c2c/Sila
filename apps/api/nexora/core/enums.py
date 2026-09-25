"""All domain enums for NEXORA."""
from enum import Enum


# ── Company ────────────────────────────────────────────────────────────────


class CompanyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    ARCHIVED = "ARCHIVED"


# ── Organizational DNA ─────────────────────────────────────────────────────


class InnovationLevel(str, Enum):
    CONSERVATIVE = "CONSERVATIVE"
    MODERATE = "MODERATE"
    PROGRESSIVE = "PROGRESSIVE"
    RADICAL = "RADICAL"


class AutonomyLevel(str, Enum):
    CENTRALIZED = "CENTRALIZED"
    GUIDED = "GUIDED"
    BALANCED = "BALANCED"
    DELEGATED = "DELEGATED"
    FULLY_AUTONOMOUS = "FULLY_AUTONOMOUS"


class RiskTolerance(str, Enum):
    RISK_AVERSE = "RISK_AVERSE"
    CAUTIOUS = "CAUTIOUS"
    MODERATE = "MODERATE"
    AGGRESSIVE = "AGGRESSIVE"
    FEARLESS = "FEARLESS"


class QualityThreshold(str, Enum):
    MINIMUM = "MINIMUM"
    STANDARD = "STANDARD"
    HIGH = "HIGH"
    EXCEPTIONAL = "EXCEPTIONAL"
    PERFECT = "PERFECT"


class DecisionStyle(str, Enum):
    AUTHORITATIVE = "AUTHORITATIVE"
    CONSULTATIVE = "CONSULTATIVE"
    CONSENSUS = "CONSENSUS"
    DELEGATIVE = "DELEGATIVE"


class CommunicationStyle(str, Enum):
    FORMAL = "FORMAL"
    SEMI_FORMAL = "SEMI_FORMAL"
    CASUAL = "CASUAL"
    ASYNC_FIRST = "ASYNC_FIRST"
    DIRECT = "DIRECT"


class ResourceStrategy(str, Enum):
    LEAN = "LEAN"
    BALANCED = "BALANCED"
    GROWTH = "GROWTH"
    INVEST_HEAVY = "INVEST_HEAVY"


# ── Department ─────────────────────────────────────────────────────────────


class DepartmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


# ── Role (Org Role) ────────────────────────────────────────────────────────


class RoleAuthority(str, Enum):
    NONE = "NONE"
    READ = "READ"
    EXECUTE = "EXECUTE"
    MANAGE = "MANAGE"
    FULL = "FULL"


# ── Membership ─────────────────────────────────────────────────────────────


class MembershipRole(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"

    @property
    def level(self) -> int:
        """Higher number = more permissions."""
        return {
            "OWNER": 100,
            "ADMIN": 80,
            "MANAGER": 60,
            "MEMBER": 40,
            "VIEWER": 20,
        }[self.value]

    def can(self, required: "MembershipRole") -> bool:
        """Check if this role meets or exceeds the required role level."""
        return self.level >= required.level


# ── Agent ──────────────────────────────────────────────────────────────────


class AgentAutonomy(str, Enum):
    SUPERVISED = "SUPERVISED"
    SEMI_AUTONOMOUS = "SEMI_AUTONOMOUS"
    AUTONOMOUS = "AUTONOMOUS"


class AgentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    TRAINING = "TRAINING"


# ── Project ────────────────────────────────────────────────────────────────


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ── Task ───────────────────────────────────────────────────────────────────


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ── Workflow ───────────────────────────────────────────────────────────────


class WorkflowStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"


class WorkflowTriggerType(str, Enum):
    MANUAL = "MANUAL"
    SCHEDULE = "SCHEDULE"
    WEBHOOK = "WEBHOOK"
    EVENT = "EVENT"
    AGENT = "AGENT"


# ── Policy ─────────────────────────────────────────────────────────────────


class PolicyScope(str, Enum):
    COMPANY = "COMPANY"
    DEPARTMENT = "DEPARTMENT"
    AGENT = "AGENT"
    PROJECT = "PROJECT"
    WORKFLOW = "WORKFLOW"


class EnforcementLevel(str, Enum):
    ADVISORY = "ADVISORY"      # Suggestions only
    SOFT = "SOFT"              # Warns but allows override
    HARD = "HARD"              # Blocks action, allows escalation
    ABSOLUTE = "ABSOLUTE"      # Cannot be overridden


class PolicyStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


# ── Decision ───────────────────────────────────────────────────────────────


class DecisionStatus(str, Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    DECIDED = "DECIDED"
    IMPLEMENTED = "IMPLEMENTED"
    EVALUATED = "EVALUATED"
