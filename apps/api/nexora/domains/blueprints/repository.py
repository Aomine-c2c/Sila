"""Repository layer for NEXORA Company Blueprints."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.domains.blueprints.catalog import SYSTEM_BLUEPRINTS
from nexora.domains.blueprints.models import BlueprintGenerationProposal, CompanyBlueprint


class BlueprintRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, blueprint_id: uuid.UUID) -> CompanyBlueprint | None:
        stmt = select(CompanyBlueprint).where(CompanyBlueprint.id == blueprint_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_key(self, key: str) -> CompanyBlueprint | None:
        stmt = select(CompanyBlueprint).where(CompanyBlueprint.key == key)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_blueprints(
        self,
        category: str | None = None,
        include_custom: bool = True,
    ) -> list[CompanyBlueprint]:
        stmt = select(CompanyBlueprint)
        if category:
            stmt = stmt.where(CompanyBlueprint.category == category)
        if not include_custom:
            stmt = stmt.where(CompanyBlueprint.is_system_template == True)  # noqa: E712
        stmt = stmt.order_by(CompanyBlueprint.is_system_template.desc(), CompanyBlueprint.name.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_blueprint(self, **kwargs) -> CompanyBlueprint:
        blueprint = CompanyBlueprint(**kwargs)
        self.db.add(blueprint)
        await self.db.flush()
        await self.db.refresh(blueprint)
        return blueprint

    async def update_blueprint(self, blueprint: CompanyBlueprint, **kwargs) -> CompanyBlueprint:
        for k, v in kwargs.items():
            if v is not None and hasattr(blueprint, k):
                setattr(blueprint, k, v)
        blueprint.version += 1
        await self.db.flush()
        await self.db.refresh(blueprint)
        return blueprint

    async def delete_blueprint(self, blueprint: CompanyBlueprint) -> None:
        await self.db.delete(blueprint)
        await self.db.flush()

    async def ensure_system_blueprints(self) -> list[CompanyBlueprint]:
        """Ensure all 10 system blueprints exist in the database."""
        existing = await self.list_blueprints(include_custom=False)
        existing_keys = {b.key for b in existing}

        created = []
        for bp_data in SYSTEM_BLUEPRINTS:
            if bp_data["key"] not in existing_keys:
                bp = CompanyBlueprint(
                    key=bp_data["key"],
                    name=bp_data["name"],
                    tagline=bp_data["tagline"],
                    description=bp_data["description"],
                    category=bp_data["category"],
                    icon=bp_data["icon"],
                    is_system_template=True,
                    company_definition=bp_data["company_definition"],
                    departments=bp_data["departments"],
                    roles=bp_data["roles"],
                    agents=bp_data["agents"],
                    workflows=bp_data["workflows"],
                    policies=bp_data["policies"],
                    constitution=bp_data["constitution"],
                    recommended_tools=bp_data["recommended_tools"],
                    intelligence_requirements=bp_data["intelligence_requirements"],
                    resource_policies=bp_data["resource_policies"],
                    kpis=bp_data["kpis"],
                    approval_rules=bp_data["approval_rules"],
                    default_autonomy=bp_data.get("default_autonomy", 3),
                    escalation_rules=bp_data["escalation_rules"],
                    estimated_monthly_cost_usd=bp_data.get("estimated_monthly_cost_usd", 250.0),
                    metadata_tags=bp_data.get("metadata_tags", []),
                )
                self.db.add(bp)
                created.append(bp)
        if created:
            await self.db.flush()
        return await self.list_blueprints()

    # -------------------------------------------------------------
    # BUILD MY COMPANY PROPOSALS
    # -------------------------------------------------------------
    async def create_proposal(
        self,
        prompt: str,
        proposed_blueprint: dict,
        estimated_operating_cost: dict,
        risks_identified: list,
        missing_capabilities: list,
        user_id: uuid.UUID | None = None,
    ) -> BlueprintGenerationProposal:
        proposal = BlueprintGenerationProposal(
            prompt=prompt,
            user_id=user_id,
            status="PROPOSED",
            proposed_blueprint=proposed_blueprint,
            estimated_operating_cost=estimated_operating_cost,
            risks_identified=risks_identified,
            missing_capabilities=missing_capabilities,
        )
        self.db.add(proposal)
        await self.db.flush()
        await self.db.refresh(proposal)
        return proposal

    async def get_proposal(self, proposal_id: uuid.UUID) -> BlueprintGenerationProposal | None:
        stmt = select(BlueprintGenerationProposal).where(BlueprintGenerationProposal.id == proposal_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def update_proposal(self, proposal: BlueprintGenerationProposal, **kwargs) -> BlueprintGenerationProposal:
        for k, v in kwargs.items():
            if hasattr(proposal, k):
                setattr(proposal, k, v)
        await self.db.flush()
        await self.db.refresh(proposal)
        return proposal
