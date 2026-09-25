"""
Comprehensive pytest test suite for NEXORA Company Blueprints and 'Build My Company'.

Covers:
- Auto-seeding of all 10 core organizational blueprints:
  1. Software Development Company
  2. Forex Trading Company
  3. Marketing Agency
  4. Social Media Company
  5. Cybersecurity Company
  6. Research Organization
  7. E-commerce Company
  8. Game Studio
  9. IT Services Company
  10. Education Organization
- Blueprint customization before activation
- Blueprint Duplication, Export (JSON), and Import (JSON)
- Instantiating a blueprint into a live, fully-populated operational Company:
  (Company, DNA, Departments, OrgRoles, Autonomous Agents, Workflows, Policies, Constitution, Governance)
- Saving an existing running company as a reusable template
- 'Build My Company':
  Natural language synthesis generating a proposed blueprint with departments, agents, workflows,
  operating cost estimate, risks identified, and missing capabilities without immediate activation.
- Approving and instantiating the synthesized company proposal.
"""
import uuid
import pytest
from httpx import AsyncClient


class TestCompanyBlueprints:
    @pytest.mark.asyncio
    async def test_list_and_seed_10_system_blueprints(self, client: AsyncClient, auth_headers: dict):
        res = await client.get("/api/v1/blueprints", headers=auth_headers)
        assert res.status_code == 200
        bps = res.json()
        assert len(bps) >= 10

        keys = {b["key"] for b in bps}
        expected_keys = [
            "software_development_company",
            "forex_trading_company",
            "marketing_agency",
            "social_media_company",
            "cybersecurity_company",
            "research_organization",
            "ecommerce_company",
            "game_studio",
            "it_services_company",
            "education_organization",
        ]
        for ek in expected_keys:
            assert ek in keys, f"Missing system blueprint: {ek}"

        # Check detail of one blueprint (e.g. software_development_company)
        sw_bp = next(b for b in bps if b["key"] == "software_development_company")
        assert len(sw_bp["departments"]) >= 3
        assert len(sw_bp["roles"]) >= 3
        assert len(sw_bp["agents"]) >= 3
        assert len(sw_bp["workflows"]) >= 1
        assert len(sw_bp["policies"]) >= 1
        assert sw_bp["constitution"]["mission"]
        assert sw_bp["default_autonomy"] == 3
        assert sw_bp["estimated_monthly_cost_usd"] > 0

    @pytest.mark.asyncio
    async def test_blueprint_customization_duplicate_export_import(self, client: AsyncClient, auth_headers: dict):
        # 1. Fetch blueprint
        res = await client.get("/api/v1/blueprints/marketing_agency", headers=auth_headers)
        assert res.status_code == 200
        bp = res.json()
        bp_id = bp["id"]

        # 2. Duplicate blueprint
        dup_res = await client.post(f"/api/v1/blueprints/{bp_id}/duplicate", headers=auth_headers)
        assert dup_res.status_code == 201
        duplicated = dup_res.json()
        assert "(Copy)" in duplicated["name"]
        dup_id = duplicated["id"]

        # 3. Customize duplicated blueprint before activation
        custom_name = "HyperScale AI Marketing"
        patch_res = await client.patch(
            f"/api/v1/blueprints/{dup_id}",
            json={"name": custom_name, "default_autonomy": 4},
            headers=auth_headers,
        )
        assert patch_res.status_code == 200
        patched = patch_res.json()
        assert patched["name"] == custom_name
        assert patched["default_autonomy"] == 4

        # 4. Export blueprint JSON
        export_res = await client.get(f"/api/v1/blueprints/{dup_id}/export", headers=auth_headers)
        assert export_res.status_code == 200
        exported = export_res.json()
        assert exported["name"] == custom_name

        # 5. Import blueprint JSON
        exported["key"] = f"imported-custom-{uuid.uuid4().hex[:6]}"
        exported["name"] = "Imported Scale Marketing"
        import_res = await client.post("/api/v1/blueprints/import", json=exported, headers=auth_headers)
        assert import_res.status_code == 201
        imported = import_res.json()
        assert imported["name"] == "Imported Scale Marketing"

    @pytest.mark.asyncio
    async def test_instantiate_blueprint_into_real_company(self, client: AsyncClient, auth_headers: dict):
        """
        Instantiate Cybersecurity Company blueprint and verify that real database records are created:
        Company, DNA, Departments, OrgRoles, Employee Agents, Workflows, Policies, Constitution, and Governance.
        """
        req_payload = {
            "company_name": "CyberShield Autonomous Defense",
        }
        res = await client.post(
            "/api/v1/blueprints/cybersecurity_company/instantiate",
            json=req_payload,
            headers=auth_headers,
        )
        assert res.status_code == 201
        data = res.json()
        company_id = data["company_id"]
        assert data["company_name"] == "CyberShield Autonomous Defense"
        assert data["departments_created"] >= 3
        assert data["roles_created"] >= 3
        assert data["agents_created"] >= 3
        assert data["workflows_created"] >= 1
        assert data["policies_created"] >= 1
        assert data["constitution_established"] is True

        # Verify agents can be listed via agent domain
        agent_res = await client.get(f"/api/v1/companies/{company_id}/agents", headers=auth_headers)
        assert agent_res.status_code == 200
        agents = agent_res.json()
        assert len(agents) >= 3
        agent_names = {a["name"] for a in agents}
        assert "Threat Hunter Agent" in agent_names
        assert "SOC Analyst Agent" in agent_names

        # Verify company constitution is active
        const_res = await client.get(f"/api/v1/companies/{company_id}/governance/constitution", headers=auth_headers)
        assert const_res.status_code == 200
        const = const_res.json()
        assert const["mission"]
        assert len(const["security_rules"]) >= 1

    @pytest.mark.asyncio
    async def test_save_company_as_template(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]

        save_req = {
            "company_id": company_id,
            "template_key": f"template-nexora-{uuid.uuid4().hex[:6]}",
            "template_name": "Nexora Enterprise Standard Template",
            "description": "Harvested baseline company template for fast cloning",
            "category": "Technology",
        }
        res = await client.post("/api/v1/blueprints/save-template", json=save_req, headers=auth_headers)
        assert res.status_code == 201
        tpl = res.json()
        assert tpl["key"] == save_req["template_key"]
        assert tpl["name"] == "Nexora Enterprise Standard Template"

    @pytest.mark.asyncio
    async def test_build_my_company_natural_language_synthesis_and_approval(self, client: AsyncClient, auth_headers: dict):
        """
        User describes organization in natural language.
        Verify:
        1. Synthesis generates proposed blueprint without immediately activating
        2. Proposes departments, agents, workflows, estimated operating cost, risks, and missing capabilities
        3. Instantiates only after explicit user approval.
        """
        prompt = (
            "Build an autonomous quantitative hedge fund focusing on foreign exchange arbitrage and "
            "treasury bond yield curve models with real-time news sentiment tracking and strict risk stops."
        )

        res = await client.post(
            "/api/v1/blueprints/build-my-company",
            json={"description": prompt, "target_budget_monthly_usd": 450.0},
            headers=auth_headers,
        )
        assert res.status_code == 201
        proposal = res.json()
        proposal_id = proposal["id"]
        assert proposal["status"] == "PROPOSED"
        assert proposal["instantiated_company_id"] is None

        # Verify synthesis contents
        assert "departments" in proposal["proposed_blueprint"]
        assert "agents" in proposal["proposed_blueprint"]
        assert len(proposal["proposed_blueprint"]["agents"]) >= 3

        # Verify Operating Cost Estimate
        cost = proposal["estimated_operating_cost"]
        assert cost["total_monthly_usd"] == 450.0
        assert "token_cost_usd" in cost

        # Verify Risks & Missing Capabilities
        assert len(proposal["risks_identified"]) >= 1
        assert len(proposal["missing_capabilities"]) >= 1

        # Now: User approves and instantiates
        inst_res = await client.post(
            f"/api/v1/blueprints/build-my-company/{proposal_id}/instantiate",
            headers=auth_headers,
        )
        assert inst_res.status_code == 201
        inst_data = inst_res.json()
        assert inst_data["company_name"]
        assert inst_data["agents_created"] >= 3
        assert inst_data["status"] == "INSTANTIATED"

        # Verify proposal status changed to INSTANTIATED
        check_prop = await client.get(f"/api/v1/blueprints/build-my-company/{proposal_id}", headers=auth_headers)
        assert check_prop.status_code == 200
        assert check_prop.json()["status"] == "INSTANTIATED"
