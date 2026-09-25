"""Service layer for NEXORA Organizational Governance Layer."""
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.enums import (
    ApprovalStatus,
    EscalationStatus,
    GovernanceAutonomyLevel,
    GovernanceRiskLevel,
)
from nexora.domains.governance.engine import GovernanceEngine
from nexora.domains.governance.models import (
    ApprovalRequest,
    AutonomyConfig,
    CompanyConstitution,
    EscalationRecord,
    GovernanceAuditLog,
)
from nexora.domains.governance.repository import GovernanceRepository
from nexora.domains.governance.schemas import (
    ApprovalDecisionUpdate,
    ApprovalRequestCreate,
    AutonomyConfigCreate,
    CompanyConstitutionCreate,
    CompanyConstitutionUpdate,
    EscalationRecordCreate,
    EscalationResolutionUpdate,
    GovernanceActionEvaluationRequest,
    GovernanceActionEvaluationResponse,
    GovernanceAuditLogCreate,
)
from nexora.exceptions import BusinessRuleError, NotFoundError


class GovernanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = GovernanceRepository(db)

    # -------------------------------------------------------------
    # CONSTITUTION
    # -------------------------------------------------------------
    async def get_or_seed_constitution(self, company_id: uuid.UUID) -> CompanyConstitution:
        constitution = await self.repo.get_constitution(company_id)
        if constitution:
            return constitution

        # Seed comprehensive default Company Constitution
        return await self.repo.create_constitution(
            company_id=company_id,
            mission="Empower an autonomous, ethical, and self-coordinating organizational intelligence system.",
            values=[
                "Transparency in automated reasoning",
                "Strict capability and privilege boundaries",
                "Human-in-the-loop for consequential actions",
                "Fiscal and computational responsibility",
            ],
            operating_principles=[
                "Default to minimal necessary resource allocation",
                "Proactively escalate blockers and anomalous model outputs",
                "Audit every consequential action with full causal rationale",
            ],
            prohibited_actions=[
                "Exfiltration of sensitive customer data outside authorized boundaries",
                "Unapproved financial transactions or credit commitments",
                "Bypassing policy gates or disabling audit telemetry",
                "Modifying company charter or constitution without executive authorization",
            ],
            approval_requirements=[
                "Production infrastructure deployment or tear down",
                "Outbound payments or budget transfers exceeding $500",
                "Granting role:ADMIN or elevating agent autonomy to LEVEL 5",
                "Direct database drops, migrations, or schema deletions",
            ],
            security_rules=[
                "All external API calls must pass through the sanitized Intelligence Exchange",
                "No raw secret keys stored in prompt contexts or unencrypted storage",
                "Zero trust token rotation every 90 days",
            ],
            financial_rules=[
                "Agent tasks exceeding $10 inference spend require managerial pre-approval",
                "Department monthly intelligence budgets are capped at allocated pools",
            ],
            data_rules=[
                "Customer PII must be scrubbed before external intelligence provider transmission",
                "Audit logs are immutable and retained permanently",
            ],
            autonomy_boundaries={
                "financial": "LEVEL_2",
                "production_infra": "LEVEL_2",
                "code_review": "LEVEL_3",
                "research_analysis": "LEVEL_4",
            },
            escalation_rules=[
                "Escalate to human manager when approval SLA exceeds 30 minutes",
                "Escalate immediately upon detection of prompt injection or guardrail evasion",
            ],
        )

    async def update_constitution(
        self,
        company_id: uuid.UUID,
        data: CompanyConstitutionUpdate,
    ) -> CompanyConstitution:
        constitution = await self.get_or_seed_constitution(company_id)
        return await self.repo.update_constitution(constitution, **data.model_dump(exclude_unset=True))

    # -------------------------------------------------------------
    # AUTONOMY CONFIGS
    # -------------------------------------------------------------
    async def list_autonomy_configs(self, company_id: uuid.UUID) -> list[AutonomyConfig]:
        configs = await self.repo.list_autonomy_configs(company_id)
        if not configs:
            # Seed standard baseline configs across scopes
            default_company_cfg = await self.repo.create_autonomy_config(
                company_id=company_id,
                autonomy_level=GovernanceAutonomyLevel.LEVEL_3.value,
                risk_level=GovernanceRiskLevel.LOW.value,
                requires_explicit_approval=False,
                rationale="Company-wide default: Execute within defined policy boundaries",
            )
            # High-risk financial operations default to Level 2
            financial_cfg = await self.repo.create_autonomy_config(
                company_id=company_id,
                task_type="financial",
                autonomy_level=GovernanceAutonomyLevel.LEVEL_2.value,
                risk_level=GovernanceRiskLevel.HIGH.value,
                requires_explicit_approval=True,
                rationale="Financial actions require explicit human sign-off",
            )
            # Database deletion action Level 1 (Recommend only)
            destructive_cfg = await self.repo.create_autonomy_config(
                company_id=company_id,
                action_name="drop_database",
                autonomy_level=GovernanceAutonomyLevel.LEVEL_0.value,
                risk_level=GovernanceRiskLevel.CRITICAL.value,
                requires_explicit_approval=True,
                rationale="Destructive database operations prohibited for agents",
            )
            return [default_company_cfg, financial_cfg, destructive_cfg]
        return configs

    async def create_autonomy_config(
        self,
        company_id: uuid.UUID,
        data: AutonomyConfigCreate,
    ) -> AutonomyConfig:
        return await self.repo.create_autonomy_config(
            company_id=company_id,
            autonomy_level=data.autonomy_level,
            risk_level=data.risk_level.value,
            requires_explicit_approval=data.requires_explicit_approval,
            department_id=data.department_id,
            role_id=data.role_id,
            agent_id=data.agent_id,
            tool_name=data.tool_name,
            task_type=data.task_type,
            action_name=data.action_name,
            conditions=data.conditions,
            rationale=data.rationale,
        )

    # -------------------------------------------------------------
    # ACTION EVALUATION PIPELINE
    # -------------------------------------------------------------
    async def evaluate_action(
        self,
        company_id: uuid.UUID,
        req: GovernanceActionEvaluationRequest,
    ) -> GovernanceActionEvaluationResponse:
        constitution = await self.get_or_seed_constitution(company_id)
        configs = await self.list_autonomy_configs(company_id)

        # 1. Constitution check: Prohibited actions
        is_prohibited, matched_clause, mandatory_approval = GovernanceEngine.evaluate_constitution_compliance(
            constitution=constitution,
            action_name=req.action_name,
            target=req.target,
            reason=req.reason,
            payload=req.payload,
            declared_risk=req.declared_risk_level,
        )

        if is_prohibited:
            # Consequential action audit log for blocked action
            await self.repo.record_audit_log(
                company_id=company_id,
                actor_id=req.actor_id,
                actor_name=req.actor_name,
                actor_type=req.actor_type,
                authority=f"GovernanceEngine:ConstitutionViolation",
                action=req.action_name,
                target=req.target,
                reason=req.reason,
                result="BLOCKED",
                autonomy_level=GovernanceAutonomyLevel.LEVEL_0.value,
                risk_level=GovernanceRiskLevel.CRITICAL.value,
                details={"violation": matched_clause, "payload": req.payload},
            )
            return GovernanceActionEvaluationResponse(
                allowed=False,
                effective_autonomy_level=GovernanceAutonomyLevel.LEVEL_0.value,
                effective_autonomy_label=GovernanceAutonomyLevel.LEVEL_0.label,
                requires_approval=False,
                is_prohibited=True,
                matched_constitution_clause=matched_clause,
                reason=f"Action explicitly prohibited by Company Constitution: '{matched_clause}'",
            )

        # 2. Resolve hierarchical autonomy level
        autonomy_level, matched_cfg = GovernanceEngine.resolve_effective_autonomy(
            configs=configs,
            department_id=req.department_id,
            role_id=req.role_id,
            agent_id=req.agent_id,
            tool_name=req.tool_name,
            task_type=req.task_type,
            action_name=req.action_name,
        )

        # 3. Determine if approval required
        requires_approval = mandatory_approval
        if matched_cfg and matched_cfg.requires_explicit_approval:
            requires_approval = True
        if autonomy_level in (GovernanceAutonomyLevel.LEVEL_0.value, GovernanceAutonomyLevel.LEVEL_1.value, GovernanceAutonomyLevel.LEVEL_2.value):
            requires_approval = True

        approval_request_id = None
        if requires_approval:
            # Auto-create pending ApprovalRequest
            app_req = await self.repo.create_approval_request(
                company_id=company_id,
                agent_id=req.agent_id,
                title=f"Approval needed for {req.action_name} on {req.target}",
                action=req.action_name,
                target=req.target,
                risk_level=(req.declared_risk_level or GovernanceRiskLevel.HIGH).value,
                proposed_payload=req.payload,
                reason=req.reason,
            )
            approval_request_id = app_req.id

        label = GovernanceAutonomyLevel(autonomy_level).label

        # Record consequential audit log
        res_status = "PENDING_APPROVAL" if requires_approval else "AUTHORIZED"
        await self.repo.record_audit_log(
            company_id=company_id,
            actor_id=req.actor_id,
            actor_name=req.actor_name,
            actor_type=req.actor_type,
            authority=f"Autonomy:{label}",
            action=req.action_name,
            target=req.target,
            reason=req.reason,
            result=res_status,
            autonomy_level=autonomy_level,
            risk_level=(req.declared_risk_level or GovernanceRiskLevel.MEDIUM).value,
            details={"payload": req.payload, "approval_request_id": str(approval_request_id) if approval_request_id else None},
        )

        return GovernanceActionEvaluationResponse(
            allowed=not requires_approval,
            effective_autonomy_level=autonomy_level,
            effective_autonomy_label=label,
            requires_approval=requires_approval,
            is_prohibited=False,
            matched_constitution_clause=matched_clause,
            matched_config_id=matched_cfg.id if matched_cfg else None,
            approval_request_id=approval_request_id,
            reason="Action permitted autonomously" if not requires_approval else "Action requires explicit approval before execution",
        )

    # -------------------------------------------------------------
    # APPROVALS
    # -------------------------------------------------------------
    async def list_approvals(self, company_id: uuid.UUID, status: str | None = None) -> list[ApprovalRequest]:
        return await self.repo.list_approval_requests(company_id, status=status)

    async def decide_approval(
        self,
        company_id: uuid.UUID,
        request_id: uuid.UUID,
        data: ApprovalDecisionUpdate,
        user_id: uuid.UUID,
    ) -> ApprovalRequest:
        req = await self.repo.get_approval_request(request_id, company_id)
        if not req:
            raise NotFoundError("ApprovalRequest not found.")
        if req.status != ApprovalStatus.PENDING:
            raise BusinessRuleError(f"ApprovalRequest already resolved as {req.status}")

        req.status = data.decision
        req.reviewer_user_id = user_id
        req.reviewer_notes = data.reviewer_notes
        req.resolved_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(req)

        # Record consequential audit log for resolution
        await self.repo.record_audit_log(
            company_id=company_id,
            actor_id=user_id,
            actor_name="Reviewer User",
            actor_type="USER",
            authority="HumanReviewer",
            action=f"DECIDE_APPROVAL_{data.decision.value}",
            target=f"ApprovalRequest:{req.id}",
            reason=data.reviewer_notes or f"Manual decision by reviewer: {data.decision.value}",
            result=data.decision.value,
            autonomy_level=GovernanceAutonomyLevel.LEVEL_2.value,
            risk_level=req.risk_level.value if hasattr(req.risk_level, "value") else str(req.risk_level),
            details={"original_action": req.action, "target": req.target},
        )
        return req

    # -------------------------------------------------------------
    # ESCALATIONS
    # -------------------------------------------------------------
    async def create_escalation(
        self,
        company_id: uuid.UUID,
        data: EscalationRecordCreate,
    ) -> EscalationRecord:
        record = await self.repo.create_escalation(
            company_id=company_id,
            reason=data.reason,
            description=data.description,
            severity=data.severity.value,
            context_data=data.context_data,
            agent_id=data.agent_id,
            task_id=data.task_id,
        )
        # Log to consequential action audit
        await self.repo.record_audit_log(
            company_id=company_id,
            actor_id=data.agent_id,
            actor_name="Agent / Workflow",
            actor_type="AGENT",
            authority="EscalationProtocol",
            action="ESCALATE_ISSUE",
            target=f"Task:{data.task_id}" if data.task_id else "OrganizationalBoundary",
            reason=data.description,
            result="OPEN",
            autonomy_level=GovernanceAutonomyLevel.LEVEL_1.value,
            risk_level=data.severity.value,
            details=data.context_data,
        )
        return record

    async def list_escalations(self, company_id: uuid.UUID, status: str | None = None) -> list[EscalationRecord]:
        return await self.repo.list_escalations(company_id, status=status)

    async def resolve_escalation(
        self,
        company_id: uuid.UUID,
        escalation_id: uuid.UUID,
        data: EscalationResolutionUpdate,
        user_id: uuid.UUID,
    ) -> EscalationRecord:
        record = await self.repo.get_escalation(escalation_id, company_id)
        if not record:
            raise NotFoundError("EscalationRecord not found.")
        record.status = data.status
        record.resolution = data.resolution
        record.resolved_by_id = user_id
        await self.db.flush()
        await self.db.refresh(record)

        await self.repo.record_audit_log(
            company_id=company_id,
            actor_id=user_id,
            actor_name="Manager User",
            actor_type="USER",
            authority="EscalationResolver",
            action="RESOLVE_ESCALATION",
            target=f"EscalationRecord:{record.id}",
            reason=data.resolution,
            result="RESOLVED",
            autonomy_level=GovernanceAutonomyLevel.LEVEL_2.value,
            risk_level=record.severity.value if hasattr(record.severity, "value") else str(record.severity),
            details={"original_reason": record.reason},
        )
        return record

    # -------------------------------------------------------------
    # AUDIT VIEWER & LOGS
    # -------------------------------------------------------------
    async def query_audit_logs(
        self,
        company_id: uuid.UUID,
        actor_id: uuid.UUID | None = None,
        action: str | None = None,
        result: str | None = None,
        target_q: str | None = None,
        limit: int = 100,
    ) -> list[GovernanceAuditLog]:
        return await self.repo.query_audit_logs(
            company_id=company_id,
            actor_id=actor_id,
            action=action,
            result=result,
            target_q=target_q,
            limit=limit,
        )

    async def record_consequential_audit(
        self,
        company_id: uuid.UUID,
        data: GovernanceAuditLogCreate,
    ) -> GovernanceAuditLog:
        return await self.repo.record_audit_log(
            company_id=company_id,
            actor_id=data.actor_id,
            actor_name=data.actor_name,
            actor_type=data.actor_type,
            authority=data.authority,
            action=data.action,
            target=data.target,
            reason=data.reason,
            result=data.result,
            autonomy_level=data.autonomy_level,
            risk_level=data.risk_level.value,
            details=data.details,
            execution_id=data.execution_id,
        )
