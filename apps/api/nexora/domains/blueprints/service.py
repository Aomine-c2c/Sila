"""
Service layer for NEXORA Company Blueprints:
- Listing & retrieving blueprints (with auto-seeding of the 10 core blueprints)
- Instantiating a blueprint into a real Company (departments, roles, agents, workflows, policies, constitution, governance)
- Customizing & saving blueprints
- Duplicating, Importing, and Exporting blueprints
- Saving an existing running company as a reusable template
- 'Build My Company': Natural language organizational synthesis with risk analysis, capability gaps, and cost projections
"""
import copy
import re
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.enums import (
    AgentStatus,
    ApprovalStatus,
    GovernanceAutonomyLevel,
    GovernanceRiskLevel,
    MembershipRole,
    PolicyScope,
    PolicyStatus,
    WorkflowTriggerType,
)
from nexora.domains.agents.repository import AgentRepository
from nexora.domains.auth.models import User
from nexora.domains.blueprints.catalog import SYSTEM_BLUEPRINTS
from nexora.domains.blueprints.models import BlueprintGenerationProposal, CompanyBlueprint
from nexora.domains.blueprints.repository import BlueprintRepository
from nexora.domains.blueprints.schemas import (
    BuildMyCompanyProposalResponse,
    BuildMyCompanyRequest,
    CompanyBlueprintCreate,
    CompanyBlueprintUpdate,
    InstantiateBlueprintRequest,
    InstantiateBlueprintResponse,
    SaveAsTemplateRequest,
)
from nexora.domains.governance.repository import GovernanceRepository
from nexora.domains.organizations.models import Company, Department, OrganizationalDNA, OrgRole
from nexora.domains.organizations.repository import (
    CompanyMemberRepository,
    CompanyRepository,
    DepartmentRepository,
    DNARepository,
    OrgRoleRepository,
)
from nexora.domains.policies.models import Policy
from nexora.domains.workflows.models import Workflow
from nexora.exceptions import BusinessRuleError, ConflictError, NotFoundError


class BlueprintService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BlueprintRepository(db)
        self.company_repo = CompanyRepository(db)
        self.member_repo = CompanyMemberRepository(db)
        self.dna_repo = DNARepository(db)
        self.dept_repo = DepartmentRepository(db)
        self.role_repo = OrgRoleRepository(db)
        self.agent_repo = AgentRepository(db)
        self.gov_repo = GovernanceRepository(db)

    # -------------------------------------------------------------
    # BLUEPRINT CATALOG MANAGEMENT
    # -------------------------------------------------------------
    async def list_blueprints(self, category: str | None = None) -> list[CompanyBlueprint]:
        await self.repo.ensure_system_blueprints()
        return await self.repo.list_blueprints(category=category)

    async def get_blueprint(self, blueprint_id_or_key: str) -> CompanyBlueprint:
        await self.repo.ensure_system_blueprints()
        try:
            b_id = uuid.UUID(blueprint_id_or_key)
            bp = await self.repo.get_by_id(b_id)
        except ValueError:
            bp = await self.repo.get_by_key(blueprint_id_or_key)

        if not bp:
            raise NotFoundError(f"Blueprint '{blueprint_id_or_key}' not found.")
        return bp

    async def create_blueprint(self, data: CompanyBlueprintCreate, user_id: uuid.UUID | None = None) -> CompanyBlueprint:
        existing = await self.repo.get_by_key(data.key)
        if existing:
            raise ConflictError(f"Blueprint with key '{data.key}' already exists.")

        return await self.repo.create_blueprint(
            key=data.key,
            name=data.name,
            tagline=data.tagline,
            description=data.description,
            category=data.category,
            icon=data.icon,
            is_system_template=False,
            created_by_user_id=user_id,
            company_definition=data.company_definition,
            departments=data.departments,
            roles=data.roles,
            agents=data.agents,
            workflows=data.workflows,
            policies=data.policies,
            constitution=data.constitution,
            recommended_tools=data.recommended_tools,
            intelligence_requirements=data.intelligence_requirements,
            resource_policies=data.resource_policies,
            kpis=data.kpis,
            approval_rules=data.approval_rules,
            default_autonomy=data.default_autonomy,
            escalation_rules=data.escalation_rules,
            estimated_monthly_cost_usd=data.estimated_monthly_cost_usd,
            metadata_tags=data.metadata_tags,
        )

    async def update_blueprint(self, blueprint_id: uuid.UUID, data: CompanyBlueprintUpdate) -> CompanyBlueprint:
        bp = await self.repo.get_by_id(blueprint_id)
        if not bp:
            raise NotFoundError("Blueprint not found.")
        return await self.repo.update_blueprint(bp, **data.model_dump(exclude_unset=True))

    async def duplicate_blueprint(self, blueprint_id: uuid.UUID, user_id: uuid.UUID | None = None) -> CompanyBlueprint:
        original = await self.repo.get_by_id(blueprint_id)
        if not original:
            raise NotFoundError("Blueprint not found.")

        new_key = f"{original.key}-copy-{uuid.uuid4().hex[:6]}"
        return await self.repo.create_blueprint(
            key=new_key,
            name=f"{original.name} (Copy)",
            tagline=original.tagline,
            description=original.description,
            category=original.category,
            icon=original.icon,
            is_system_template=False,
            created_by_user_id=user_id,
            company_definition=copy.deepcopy(original.company_definition),
            departments=copy.deepcopy(original.departments),
            roles=copy.deepcopy(original.roles),
            agents=copy.deepcopy(original.agents),
            workflows=copy.deepcopy(original.workflows),
            policies=copy.deepcopy(original.policies),
            constitution=copy.deepcopy(original.constitution),
            recommended_tools=copy.deepcopy(original.recommended_tools),
            intelligence_requirements=copy.deepcopy(original.intelligence_requirements),
            resource_policies=copy.deepcopy(original.resource_policies),
            kpis=copy.deepcopy(original.kpis),
            approval_rules=copy.deepcopy(original.approval_rules),
            default_autonomy=original.default_autonomy,
            escalation_rules=copy.deepcopy(original.escalation_rules),
            estimated_monthly_cost_usd=original.estimated_monthly_cost_usd,
            metadata_tags=list(original.metadata_tags),
        )

    async def export_blueprint_json(self, blueprint_id: uuid.UUID) -> dict[str, Any]:
        bp = await self.repo.get_by_id(blueprint_id)
        if not bp:
            raise NotFoundError("Blueprint not found.")
        return {
            "schema_version": "1.0",
            "key": bp.key,
            "name": bp.name,
            "tagline": bp.tagline,
            "description": bp.description,
            "category": bp.category,
            "icon": bp.icon,
            "company_definition": bp.company_definition,
            "departments": bp.departments,
            "roles": bp.roles,
            "agents": bp.agents,
            "workflows": bp.workflows,
            "policies": bp.policies,
            "constitution": bp.constitution,
            "recommended_tools": bp.recommended_tools,
            "intelligence_requirements": bp.intelligence_requirements,
            "resource_policies": bp.resource_policies,
            "kpis": bp.kpis,
            "approval_rules": bp.approval_rules,
            "default_autonomy": bp.default_autonomy,
            "escalation_rules": bp.escalation_rules,
            "estimated_monthly_cost_usd": bp.estimated_monthly_cost_usd,
            "metadata_tags": bp.metadata_tags,
        }

    async def import_blueprint_json(self, data: dict[str, Any], user_id: uuid.UUID | None = None) -> CompanyBlueprint:
        key = data.get("key", f"imported-{uuid.uuid4().hex[:8]}")
        counter = 1
        original_key = key
        while await self.repo.get_by_key(key):
            key = f"{original_key}-{counter}"
            counter += 1

        return await self.repo.create_blueprint(
            key=key,
            name=data.get("name", "Imported Blueprint"),
            tagline=data.get("tagline", "Custom imported organization"),
            description=data.get("description", "Imported via JSON blueprint specification"),
            category=data.get("category", "Custom"),
            icon=data.get("icon", "briefcase"),
            is_system_template=False,
            created_by_user_id=user_id,
            company_definition=data.get("company_definition", {}),
            departments=data.get("departments", []),
            roles=data.get("roles", []),
            agents=data.get("agents", []),
            workflows=data.get("workflows", []),
            policies=data.get("policies", []),
            constitution=data.get("constitution", {}),
            recommended_tools=data.get("recommended_tools", []),
            intelligence_requirements=data.get("intelligence_requirements", {}),
            resource_policies=data.get("resource_policies", {}),
            kpis=data.get("kpis", []),
            approval_rules=data.get("approval_rules", []),
            default_autonomy=data.get("default_autonomy", 3),
            escalation_rules=data.get("escalation_rules", []),
            estimated_monthly_cost_usd=data.get("estimated_monthly_cost_usd", 200.0),
            metadata_tags=data.get("metadata_tags", ["imported"]),
        )

    # -------------------------------------------------------------
    # INSTANTIATION (CREATE FROM BLUEPRINT)
    # -------------------------------------------------------------
    async def instantiate_blueprint(
        self,
        blueprint_id_or_key: str,
        user: User,
        req: InstantiateBlueprintRequest,
    ) -> InstantiateBlueprintResponse:
        """
        Instantiates a full live organization from a blueprint:
        1. Creates Company and Organizational DNA
        2. Assigns User as OWNER member
        3. Creates Departments
        4. Creates Org Roles
        5. Creates Autonomous Employee Agents (configured with capabilities, tools, instructions)
        6. Configures Workflows
        7. Enforces Policies
        8. Establishes the Company Constitution
        9. Configures Autonomy & Approval Guardrails
        """
        bp = await self.get_blueprint(blueprint_id_or_key)

        comp_def = copy.deepcopy(bp.company_definition)
        company_name = req.company_name or comp_def.get("name", bp.name)
        industry = req.industry_override or comp_def.get("industry", bp.category)

        # Unique slug generation
        slug_base = re.sub(r"[^\w\s-]", "", company_name.lower().strip())
        slug_base = re.sub(r"[\s_-]+", "-", slug_base)[:80]
        slug = slug_base
        counter = 1
        while await self.company_repo.get_by_slug(slug):
            slug = f"{slug_base}-{counter}"
            counter += 1

        # 1. Create Company
        company = await self.company_repo.create(
            name=company_name,
            slug=slug,
            owner_id=user.id,
            description=comp_def.get("description", bp.description),
            mission=comp_def.get("mission", bp.tagline),
            vision=comp_def.get("vision"),
            industry=industry,
        )

        # 2. Add Owner Member
        await self.member_repo.add_member(
            company_id=company.id,
            user_id=user.id,
            role=MembershipRole.OWNER,
        )

        # 3. Create Organizational DNA
        dna_data = comp_def.get("dna", {})
        await self.dna_repo.upsert(
            company_id=company.id,
            operating_philosophy=dna_data.get("operating_philosophy", "Excellence, autonomy, and rigorous verification"),
            innovation_level=dna_data.get("innovation_level", "PROGRESSIVE"),
            autonomy_level=dna_data.get("autonomy_level", "DELEGATED"),
            risk_tolerance=dna_data.get("risk_tolerance", "MODERATE"),
            quality_threshold=dna_data.get("quality_threshold", "HIGH"),
            decision_style=dna_data.get("decision_style", "CONSULTATIVE"),
            communication_style=dna_data.get("communication_style", "ASYNC_FIRST"),
            resource_strategy=dna_data.get("resource_strategy", "BALANCED"),
        )

        # 4. Create Departments
        created_depts: dict[str, Department] = {}
        for d in bp.departments:
            dept = await self.dept_repo.create(
                company_id=company.id,
                name=d["name"],
                purpose=d.get("purpose"),
            )
            created_depts[d["name"]] = dept

        # 5. Create Org Roles
        created_roles: dict[str, OrgRole] = {}
        autonomy_map = {
            0: "CENTRALIZED",
            1: "CENTRALIZED",
            2: "GUIDED",
            3: "BALANCED",
            4: "DELEGATED",
            5: "FULLY_AUTONOMOUS",
        }
        for r in bp.roles:
            dept = created_depts.get(r["department_name"])
            if not dept:
                continue
            num_level = r.get("autonomy_level", 3)
            str_level = autonomy_map.get(num_level, "BALANCED") if isinstance(num_level, int) else num_level

            role = await self.role_repo.create(
                department_id=dept.id,
                company_id=company.id,
                title=r["title"],
                responsibilities=r.get("responsibilities", []),
                capabilities=r.get("capabilities", []),
                authority=r.get("authority", "EXECUTE"),
                autonomy_level=str_level,
                required_skills=r.get("required_skills", []),
            )
            created_roles[r["title"]] = role

        # 6. Create Autonomous Employee Agents
        created_agents = []
        for a in bp.agents:
            dept = created_depts.get(a.get("department_name"))
            role = created_roles.get(a.get("role_title"))
            agent = await self.agent_repo.create(
                company_id=company.id,
                name=a["name"],
                role_id=role.id if role else None,
                department_id=dept.id if dept else None,
                system_instructions=a.get("system_instructions"),
                responsibilities=a.get("responsibilities", []),
                capabilities=a.get("capabilities", []),
                tools=a.get("tools", []),
                permissions={"allowed_tools": [t.get("name") if isinstance(t, dict) else str(t) for t in a.get("tools", [])]},
                status=AgentStatus.AVAILABLE,
                intelligence_config=a.get("intelligence_config", {"model": "gpt-4o", "temperature": 0.2}),
                resource_limits=a.get("resource_limits", {"max_tokens_per_call": 8192, "max_daily_budget_usd": 15.0}),
            )
            created_agents.append(agent)

        # 7. Create Workflows
        workflows_created = 0
        for wf_data in bp.workflows:
            wf = Workflow(
                company_id=company.id,
                name=wf_data["name"],
                description=wf_data.get("description"),
                trigger_type=WorkflowTriggerType.MANUAL,
                steps=wf_data.get("steps", []),
            )
            self.db.add(wf)
            workflows_created += 1

        # 8. Create Policies
        policies_created = 0
        for p_data in bp.policies:
            pol = Policy(
                company_id=company.id,
                name=p_data["name"],
                description=p_data.get("description"),
                scope=PolicyScope.COMPANY,
                rules=p_data.get("rules", []),
                status=PolicyStatus.ACTIVE,
            )
            self.db.add(pol)
            policies_created += 1

        # 9. Establish Company Constitution
        const_data = bp.constitution or {}
        await self.gov_repo.create_constitution(
            company_id=company.id,
            mission=const_data.get("mission", comp_def.get("mission", "Autonomous high-performance organization")),
            values=const_data.get("values", ["Integrity", "Execution speed", "Security"]),
            operating_principles=const_data.get("operating_principles", ["Continuous verification", "Accountability"]),
            prohibited_actions=const_data.get("prohibited_actions", ["Unauthorized data exfiltration"]),
            approval_requirements=const_data.get("approval_requirements", ["Production destructive actions"]),
            security_rules=const_data.get("security_rules", ["TLS encryption required", "Zero plain-text secret storage"]),
            financial_rules=const_data.get("financial_rules", ["Inference ceilings enforced"]),
            data_rules=const_data.get("data_rules", ["Customer PII sanitization"]),
            autonomy_boundaries=const_data.get("autonomy_boundaries", {"general": f"LEVEL_{bp.default_autonomy}"}),
            escalation_rules=const_data.get("escalation_rules", []),
            established_by=user.id,
        )

        # 10. Seed Baseline Autonomy Matrix
        await self.gov_repo.create_autonomy_config(
            company_id=company.id,
            autonomy_level=bp.default_autonomy,
            risk_level=GovernanceRiskLevel.LOW.value,
            requires_explicit_approval=False,
            rationale=f"Instantiated from {bp.name} blueprint baseline",
        )

        await self.db.flush()

        return InstantiateBlueprintResponse(
            company_id=company.id,
            company_name=company.name,
            slug=company.slug,
            departments_created=len(created_depts),
            roles_created=len(created_roles),
            agents_created=len(created_agents),
            workflows_created=workflows_created,
            policies_created=policies_created,
            constitution_established=True,
            status="INSTANTIATED",
            message=f"Successfully instantiated '{company.name}' with {len(created_agents)} autonomous employee agents.",
        )

    # -------------------------------------------------------------
    # SAVE AS TEMPLATE
    # -------------------------------------------------------------
    async def save_company_as_template(self, req: SaveAsTemplateRequest, user: User) -> CompanyBlueprint:
        company = await self.company_repo.get_by_id(req.company_id)
        if not company:
            raise NotFoundError("Company not found.")

        # Harvest company structure
        departments = await self.dept_repo.list_by_company(company.id)
        roles = await self.role_repo.list_by_company(company.id)
        agents = await self.agent_repo.list_by_company(company.id)
        constitution = await self.gov_repo.get_constitution(company.id)

        dept_lookup = {d.id: d.name for d in departments}

        bp_departments = [{"name": d.name, "purpose": d.purpose or ""} for d in departments]
        bp_roles = [
            {
                "department_name": dept_lookup.get(r.department_id, "General Operations"),
                "title": r.title,
                "responsibilities": r.responsibilities or [],
                "capabilities": r.capabilities or [],
                "authority": r.authority.value if hasattr(r.authority, "value") else str(r.authority),
                "autonomy_level": r.autonomy_level,
            }
            for r in roles
        ]
        bp_agents = [
            {
                "name": a.name,
                "role_title": "Staff Member",
                "department_name": dept_lookup.get(a.department_id, "General Operations"),
                "system_instructions": a.system_instructions or "",
                "responsibilities": a.responsibilities or [],
                "capabilities": a.capabilities or [],
                "tools": a.tools or [],
                "autonomy_level": 3,
                "intelligence_config": a.intelligence_config or {},
                "resource_limits": a.resource_limits or {},
            }
            for a in agents
        ]

        bp_constitution = {}
        if constitution:
            bp_constitution = {
                "mission": constitution.mission,
                "values": constitution.values,
                "operating_principles": constitution.operating_principles,
                "prohibited_actions": constitution.prohibited_actions,
                "approval_requirements": constitution.approval_requirements,
                "security_rules": constitution.security_rules,
                "financial_rules": constitution.financial_rules,
                "data_rules": constitution.data_rules,
                "autonomy_boundaries": constitution.autonomy_boundaries,
                "escalation_rules": constitution.escalation_rules,
            }

        return await self.repo.create_blueprint(
            key=req.template_key,
            name=req.template_name,
            tagline=company.mission or req.template_name,
            description=req.description,
            category=req.category,
            icon="bookmark",
            is_system_template=False,
            created_by_user_id=user.id,
            source_company_id=company.id,
            company_definition={
                "name": company.name,
                "mission": company.mission or "",
                "vision": company.vision or "",
                "industry": company.industry or "General",
            },
            departments=bp_departments,
            roles=bp_roles,
            agents=bp_agents,
            workflows=[],
            policies=[],
            constitution=bp_constitution,
            recommended_tools=[],
            intelligence_requirements={},
            resource_policies={},
            kpis=[],
            approval_rules=[],
            default_autonomy=3,
            escalation_rules=[],
            estimated_monthly_cost_usd=200.0,
            metadata_tags=["custom-template", "saved-from-company"],
        )

    # -------------------------------------------------------------
    # BUILD MY COMPANY (NATURAL LANGUAGE SYNTHESIS)
    # -------------------------------------------------------------
    async def generate_company_proposal(
        self,
        req: BuildMyCompanyRequest,
        user: User | None = None,
    ) -> BlueprintGenerationProposal:
        """
        Synthesizes a complete organizational blueprint from natural language description.
        Generates departments, roles, employee agents, workflows, policies, constitution,
        estimated operating cost, risks, and missing capabilities.
        Does NOT immediately activate it until user reviews and instantiates.
        """
        prompt = req.description
        p_lower = prompt.lower()

        # Deduce industry & title
        name = "Synthesized Enterprise Corp"
        industry = "Technology & Services"
        if "biotech" in p_lower or "pharma" in p_lower or "medicine" in p_lower:
            name = "BioGenesis Research Labs"
            industry = "Biotechnology & Pharmaceuticals"
        elif "crypto" in p_lower or "web3" in p_lower or "blockchain" in p_lower:
            name = "EtherVault Decentralized Protocols"
            industry = "Web3 & Blockchain"
        elif "real estate" in p_lower or "property" in p_lower:
            name = "PropTech Global Ventures"
            industry = "Real Estate & Asset Management"
        elif "legal" in p_lower or "law" in p_lower:
            name = "LexAutomata Legal Advisory"
            industry = "Legal Services & Compliance"
        elif "logistics" in p_lower or "freight" in p_lower or "truck" in p_lower:
            name = "OmniFreight Logistics Network"
            industry = "Supply Chain & Logistics"
        else:
            name = f"Apex {prompt.split()[0].capitalize()} Organization"

        departments = [
            {"name": "Executive Strategy & Governance", "purpose": "Strategic oversight, capital planning, and compliance"},
            {"name": "Core Domain Operations", "purpose": f"Executing core business activities for {industry}"},
            {"name": "Intelligence & Client Success", "purpose": "Client communication, service delivery, and telemetry"},
        ]

        roles = [
            {
                "department_name": "Executive Strategy & Governance",
                "title": "Managing Director",
                "responsibilities": ["Resource allocation", "Strategy sign-off", "Risk governance"],
                "capabilities": ["strategic_planning", "risk_evaluation"],
                "authority": "FULL",
                "autonomy_level": 4,
            },
            {
                "department_name": "Core Domain Operations",
                "title": "Lead Operations Specialist",
                "responsibilities": ["Primary domain workflow execution", "Quality control"],
                "capabilities": ["domain_analysis", "execution_coordination"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Intelligence & Client Success",
                "title": "Client Success & Intelligence Analyst",
                "responsibilities": ["Client deliverables", "Feedback synthesis", "Telemetry reporting"],
                "capabilities": ["client_communication", "data_synthesis"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ]

        agents = [
            {
                "name": "Strategy Director Agent",
                "role_title": "Managing Director",
                "department_name": "Executive Strategy & Governance",
                "system_instructions": f"Guide the strategic growth of {name}. Prioritize unit economics and strict policy adherence.",
                "responsibilities": ["Review high-risk actions", "Audit performance telemetry"],
                "capabilities": ["strategic_planning"],
                "tools": [{"name": "org_kpi_dashboard", "description": "Inspect organization metrics", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 16384, "max_daily_budget_usd": 15.0},
            },
            {
                "name": "Operations Lead Agent",
                "role_title": "Lead Operations Specialist",
                "department_name": "Core Domain Operations",
                "system_instructions": f"Deliver core operational outputs for {industry}. Verify results before reporting.",
                "responsibilities": ["Daily operations workflow execution"],
                "capabilities": ["domain_analysis"],
                "tools": [{"name": "operations_toolkit", "description": "Core workflow executor", "risk_level": "MEDIUM"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 12.0},
            },
            {
                "name": "Client Success Agent",
                "role_title": "Client Success & Intelligence Analyst",
                "department_name": "Intelligence & Client Success",
                "system_instructions": "Ensure exceptional client experience. Respond quickly, clearly, and proactively.",
                "responsibilities": ["Client engagement and reporting"],
                "capabilities": ["client_communication"],
                "tools": [{"name": "notification_dispatcher", "description": "Send external client emails", "risk_level": "MEDIUM"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gemini-1.5-flash", "temperature": 0.3},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 8.0},
            },
        ]

        workflows = [
            {
                "name": "End-to-End Delivery Loop",
                "description": "Strategy Review -> Operations Execution -> Client Delivery",
                "trigger_type": "MANUAL",
                "steps": [
                    {"step_name": "Strategy Check", "agent": "Strategy Director Agent"},
                    {"step_name": "Core Work", "agent": "Operations Lead Agent"},
                    {"step_name": "Client Delivery", "agent": "Client Success Agent"},
                ],
            }
        ]

        policies = [
            {
                "name": "Operational Quality Standard",
                "description": "All external work deliverables must pass internal verification criteria.",
                "scope": "COMPANY",
                "rules": [{"condition": "quality_score < 80", "action": "BLOCK_EXTERNAL_DISPATCH"}],
                "enforcement_level": "HARD",
            }
        ]

        constitution = {
            "mission": f"Execute ethical, high-quality operations in {industry} with autonomous rigor.",
            "values": ["Client value", "Operational transparency", "Frugal resource usage"],
            "operating_principles": ["Automate repetitive tasks", "Human sign-off on consequential commitments"],
            "prohibited_actions": ["Unapproved external financial expenditures", "Data leakage outside authorized boundaries"],
            "approval_requirements": ["Contracts exceeding $1,000", "Production system deployments"],
            "security_rules": ["Strict API token compartmentalization"],
            "financial_rules": ["Monthly model inference ceiling enforced"],
            "data_rules": ["Zero external storage of raw customer secrets"],
            "autonomy_boundaries": {"general": f"LEVEL_{req.preferred_autonomy_level or 3}"},
            "escalation_rules": ["Escalate client complaints immediately to Managing Director"],
        }

        estimated_operating_cost = {
            "total_monthly_usd": req.target_budget_monthly_usd or 280.0,
            "token_cost_usd": 140.0,
            "compute_cost_usd": 90.0,
            "operational_overhead_usd": 50.0,
            "staffing_ratio": "3 autonomous agents : 0 human head-count overhead",
        }

        risks_identified = [
            {
                "risk": "Regulatory / Compliance Ambiguity",
                "severity": "MEDIUM",
                "mitigation": "Establish human-in-the-loop review on all external regulatory communications.",
            },
            {
                "risk": "Runaway Inference Token Consumption",
                "severity": "LOW",
                "mitigation": "Enforce hard token ceilings on the Resource Engine allocation pool.",
            },
        ]

        missing_capabilities = [
            {
                "capability": "Specialized External API Integration",
                "reason": f"Specific third-party tool adapters for {industry} need to be connected via custom plugins.",
                "suggested_tools_or_integrations": ["Custom Webhook Gateway", "Enterprise CRM Connector"],
            }
        ]

        proposed_blueprint = {
            "key": f"proposal-{uuid.uuid4().hex[:8]}",
            "name": name,
            "tagline": f"AI-Augmented Autonomous {industry}",
            "description": f"Tailored organizational structure synthesized for: '{prompt}'",
            "category": industry,
            "icon": "zap",
            "company_definition": {
                "name": name,
                "mission": f"Leading edge execution in {industry}",
                "industry": industry,
            },
            "departments": departments,
            "roles": roles,
            "agents": agents,
            "workflows": workflows,
            "policies": policies,
            "constitution": constitution,
            "recommended_tools": [{"name": "webhook_bridge", "description": "Custom API connector", "risk_level": "LOW"}],
            "intelligence_requirements": {"recommended_models": ["claude-3-5-sonnet", "gpt-4o", "gemini-1.5-flash"]},
            "resource_policies": {"financial_budget_usd": req.target_budget_monthly_usd or 300.0, "execution_slots": 5},
            "kpis": [{"name": "Operational Velocity", "metric": "tasks_completed", "target": ">= 50/week", "review_frequency": "WEEKLY"}],
            "approval_rules": [{"action": "OUTBOUND_CONTRACT", "condition": "amount > 1000", "approver_role": "ADMIN", "risk_level": "HIGH"}],
            "default_autonomy": req.preferred_autonomy_level or 3,
            "escalation_rules": [{"trigger": "Policy violation attempt", "route_to": "Strategy Director Agent", "severity": "HIGH", "sla_minutes": 15}],
            "estimated_monthly_cost_usd": req.target_budget_monthly_usd or 280.0,
            "metadata_tags": ["synthesized", "build-my-company", industry.lower()],
        }

        return await self.repo.create_proposal(
            prompt=prompt,
            user_id=user.id if user else None,
            proposed_blueprint=proposed_blueprint,
            estimated_operating_cost=estimated_operating_cost,
            risks_identified=risks_identified,
            missing_capabilities=missing_capabilities,
        )

    async def get_proposal(self, proposal_id: uuid.UUID) -> BlueprintGenerationProposal:
        proposal = await self.repo.get_proposal(proposal_id)
        if not proposal:
            raise NotFoundError("Proposal not found.")
        return proposal

    async def instantiate_proposal(self, proposal_id: uuid.UUID, user: User) -> InstantiateBlueprintResponse:
        proposal = await self.get_proposal(proposal_id)
        if proposal.status == "INSTANTIATED":
            raise BusinessRuleError("This proposed blueprint has already been instantiated.")

        # Create blueprint from proposal dict first
        bp_dict = proposal.proposed_blueprint
        bp = await self.import_blueprint_json(bp_dict, user_id=user.id)

        # Instantiate into live company
        inst_res = await self.instantiate_blueprint(
            blueprint_id_or_key=str(bp.id),
            user=user,
            req=InstantiateBlueprintRequest(company_name=bp_dict.get("name")),
        )

        proposal.status = "INSTANTIATED"
        proposal.instantiated_company_id = inst_res.company_id
        await self.repo.update_proposal(proposal)

        return inst_res
