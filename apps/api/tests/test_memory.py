"""
Tests for the NEXORA Organizational Memory System.
Covers:
- 10 distinct memory domains (COMPANY, DEPARTMENT, AGENT, PROJECT, CUSTOMER, DECISION, POLICY, EXPERIMENT, FAILURE, KNOWLEDGE_BASE)
- Structured metadata (source, owner, scope, permissions, confidence, relevance, provenance, retention policy)
- Searchable Knowledge Base query interface
- Task Context Assembly Engine:
  TASK -> identify required knowledge -> retrieve memories -> apply permissions -> rank relevance -> minimal prompt
- Enforcing that external model providers receive only authorized, task-relevant minimal context
- Decision Records preserving deliberation, options, evidence, decision, rationale, participants, outcomes, lessons learned
"""
import uuid
import pytest
from httpx import AsyncClient

from nexora.core.enums import (
    MemoryDomain,
    MemoryScope,
    ProvenanceType,
    RetentionPolicy,
)


class TestOrganizationalMemory:
    @pytest.mark.asyncio
    async def test_auto_seed_and_list_memories(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]

        # Initial list triggers default baseline memory seeder
        res = await client.get(f"/api/v1/companies/{company_id}/memory/items", headers=auth_headers)
        assert res.status_code == 200
        memories = res.json()
        assert len(memories) >= 5

        domains = {m["domain"] for m in memories}
        assert "COMPANY" in domains
        assert "POLICY" in domains
        assert "FAILURE" in domains
        assert "DECISION" in domains
        assert "KNOWLEDGE_BASE" in domains

    @pytest.mark.asyncio
    async def test_create_domain_specific_memory_with_metadata(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]

        payload = {
            "domain": "CUSTOMER",
            "scope": "CONFIDENTIAL",
            "title": "Customer Onboarding Security Friction",
            "content": "Enterprise customers on custom SSO require manual SAML certificate exchange prior to workspace activation.",
            "summary": "Manual SAML step required for custom SSO enterprise accounts.",
            "provenance_type": "AGENT_OBSERVATION",
            "source": "Agent: Customer Success Specialist",
            "confidence": 0.95,
            "relevance_score": 1.5,
            "required_permissions": ["role:MANAGER", "dept:customer_success"],
            "retention_policy": "PERMANENT",
            "tags": ["enterprise", "sso", "onboarding"],
            "metadata": {"customer_tier": "enterprise", "churn_risk": "low"},
        }

        res = await client.post(
            f"/api/v1/companies/{company_id}/memory/items",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data["domain"] == "CUSTOMER"
        assert data["scope"] == "CONFIDENTIAL"
        assert data["confidence"] == 0.95
        assert data["provenance_type"] == "AGENT_OBSERVATION"
        assert "role:MANAGER" in data["required_permissions"]

    @pytest.mark.asyncio
    async def test_search_knowledge_base(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        company_id = company_via_api["id"]

        # Search for post-mortem token failure keyword
        res = await client.get(
            f"/api/v1/companies/{company_id}/memory/search?q=token",
            headers=auth_headers,
        )
        assert res.status_code == 200
        results = res.json()
        assert len(results) >= 1
        assert any("token" in r["content"].lower() or "token" in r["title"].lower() for r in results)

    @pytest.mark.asyncio
    async def test_context_assembly_pipeline_permissions_and_minimal_prompt(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        """
        Verify that Context Assembly:
        1. Infers required domains from task objective
        2. Applies caller permissions (preventing unauthorized memory leakage)
        3. Ranks by relevance and formats minimal necessary context
        """
        company_id = company_via_api["id"]

        # First add a RESTRICTED executive memory
        await client.post(
            f"/api/v1/companies/{company_id}/memory/items",
            json={
                "domain": "COMPANY",
                "scope": "RESTRICTED",  # ADMIN/OWNER only
                "title": "Confidential M&A Target Evaluation",
                "content": "Secretly evaluating acquisition of cloud compute provider.",
                "summary": "Secret acquisition discussion.",
                "source": "Executive Board",
            },
            headers=auth_headers,
        )

        # Context assembly request by standard MEMBER role
        req_payload = {
            "task_objective": "Audit compliance and customer data classification policies",
            "caller_role": "MEMBER",
            "caller_permissions": ["dept:compliance"],
            "max_context_tokens": 1500,
            "max_items": 4,
        }

        res = await client.post(
            f"/api/v1/companies/{company_id}/memory/assemble-context",
            json=req_payload,
            headers=auth_headers,
        )
        assert res.status_code == 200
        assembled = res.json()

        # Restricted executive M&A memory must NOT leak to ordinary member prompt
        prompt = assembled["assembled_context_prompt"]
        assert "Secretly evaluating acquisition" not in prompt
        assert "ORGANIZATIONAL CONTEXT" in prompt
        assert assembled["authorized_memories_selected"] >= 1
        assert assembled["estimated_context_tokens"] > 0

    @pytest.mark.asyncio
    async def test_decision_record_lifecycle_and_lessons_learned(self, client: AsyncClient, auth_headers: dict, company_via_api: dict):
        """Preserves problem, options, evidence, decision, rationale, outcomes, and lessons."""
        company_id = company_via_api["id"]

        decision_payload = {
            "title": "Adopt Capability-Based Model Routing",
            "problem": "Agents were directly coupled to OpenAI API keys creating vendor lock-in.",
            "options": [
                {
                    "title": "Single Vendor Standardization",
                    "description": "Stick exclusively to OpenAI for simplicity.",
                    "pros": ["Simple SDK"],
                    "cons": ["Vendor lock-in", "Rate limits"],
                },
                {
                    "title": "NEXORA Intelligence Exchange Abstraction",
                    "description": "Decouple agents via abstract capabilities (large_context, fast_inference).",
                    "pros": ["Multi-vendor redundancy", "Cost arbitrage", "Privacy control"],
                    "cons": ["Adapter maintenance overhead"],
                },
            ],
            "evidence": [
                {
                    "source": "Q2 Outage Report",
                    "claim": "Single provider downtime halted agent workflows for 4 hours.",
                    "verified": True,
                }
            ],
            "participants": [
                {"name": "Chief Architect", "role": "Architect", "identity_type": "USER", "stance": "SUPPORT"},
                {"name": "Infra Agent", "role": "Site Reliability", "identity_type": "AGENT", "stance": "SUPPORT"},
            ],
            "decision": "Adopt Intelligence Exchange multi-provider capability routing.",
            "rationale": "High availability and data sovereignty outweigh adapter maintenance costs.",
            "expected_outcome": "Zero downtime failover between Gemini, Claude, and OpenAI.",
        }

        res = await client.post(
            f"/api/v1/companies/{company_id}/memory/decisions",
            json=decision_payload,
            headers=auth_headers,
        )
        assert res.status_code == 201
        dec = res.json()
        assert dec["title"] == "Adopt Capability-Based Model Routing"
        assert len(dec["options"]) == 2
        decision_id = dec["id"]

        # Later: Post-implementation review recording actual outcome and lessons learned
        outcome_res = await client.post(
            f"/api/v1/companies/{company_id}/memory/decisions/{decision_id}/outcome",
            json={
                "actual_outcome": "Zero downtime achieved over 90 days with 32% cost savings.",
                "lessons_learned": [
                    "Dynamic fallback prevents cascading agent workflow failures.",
                    "Capability matching simplifies prompt construction across different models.",
                ],
            },
            headers=auth_headers,
        )
        assert outcome_res.status_code == 200
        updated = outcome_res.json()
        assert "Zero downtime achieved" in updated["actual_outcome"]
        assert len(updated["lessons_learned"]) == 2
