"""
Repository layer for NEXORA Organizational Memory System.
Handles storage, domain queries, text search, and decision records.
"""
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.core.enums import MemoryDomain, MemoryScope, ProvenanceType, RetentionPolicy
from nexora.domains.memory.models import DecisionRecord, MemoryItem


class MemoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # -------------------------------------------------------------
    # MEMORY ITEMS
    # -------------------------------------------------------------
    async def create_memory_item(
        self,
        company_id: uuid.UUID,
        domain: str,
        title: str,
        content: str,
        summary: str | None = None,
        scope: str = MemoryScope.INTERNAL.value,
        department_id: uuid.UUID | None = None,
        agent_id: uuid.UUID | None = None,
        project_id: uuid.UUID | None = None,
        task_id: uuid.UUID | None = None,
        provenance_type: str = ProvenanceType.HUMAN_INPUT.value,
        source: str = "manual",
        owner_id: uuid.UUID | None = None,
        confidence: float = 1.0,
        relevance_score: float = 1.0,
        required_permissions: list[str] | None = None,
        retention_policy: str = RetentionPolicy.PERMANENT.value,
        tags: list[str] | None = None,
        extra_metadata: dict[str, Any] | None = None,
    ) -> MemoryItem:
        item = MemoryItem(
            company_id=company_id,
            domain=domain,
            scope=scope,
            title=title,
            content=content,
            summary=summary,
            department_id=department_id,
            agent_id=agent_id,
            project_id=project_id,
            task_id=task_id,
            provenance_type=provenance_type,
            source=source,
            owner_id=owner_id,
            confidence=confidence,
            relevance_score=relevance_score,
            access_count=0,
            required_permissions=required_permissions or [],
            retention_policy=retention_policy,
            is_archived=False,
            tags=tags or [],
            extra_metadata=extra_metadata or {},
        )
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def get_memory_item(self, item_id: uuid.UUID, company_id: uuid.UUID) -> MemoryItem | None:
        stmt = select(MemoryItem).where(
            MemoryItem.id == item_id,
            MemoryItem.company_id == company_id,
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_memories(
        self,
        company_id: uuid.UUID,
        domain: str | None = None,
        scope: str | None = None,
        department_id: uuid.UUID | None = None,
        agent_id: uuid.UUID | None = None,
        project_id: uuid.UUID | None = None,
        limit: int = 50,
    ) -> list[MemoryItem]:
        stmt = select(MemoryItem).where(
            MemoryItem.company_id == company_id,
            MemoryItem.is_archived == False,  # noqa: E712
        )
        if domain:
            stmt = stmt.where(MemoryItem.domain == domain)
        if scope:
            stmt = stmt.where(MemoryItem.scope == scope)
        if department_id:
            stmt = stmt.where(MemoryItem.department_id == department_id)
        if agent_id:
            stmt = stmt.where(MemoryItem.agent_id == agent_id)
        if project_id:
            stmt = stmt.where(MemoryItem.project_id == project_id)

        stmt = stmt.order_by(MemoryItem.relevance_score.desc(), MemoryItem.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def search_memories(
        self,
        company_id: uuid.UUID,
        query: str,
        domain: str | None = None,
        scope: str | None = None,
        limit: int = 20,
    ) -> list[MemoryItem]:
        stmt = select(MemoryItem).where(
            MemoryItem.company_id == company_id,
            MemoryItem.is_archived == False,  # noqa: E712
        )
        if domain:
            stmt = stmt.where(MemoryItem.domain == domain)
        if scope:
            stmt = stmt.where(MemoryItem.scope == scope)

        # Basic case-insensitive text search across title, content, summary
        search_pattern = f"%{query}%"
        stmt = stmt.where(
            or_(
                MemoryItem.title.ilike(search_pattern),
                MemoryItem.content.ilike(search_pattern),
                MemoryItem.summary.ilike(search_pattern),
            )
        ).order_by(MemoryItem.relevance_score.desc()).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def increment_access(self, item: MemoryItem) -> None:
        item.access_count += 1
        item.last_accessed_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(item)

    # -------------------------------------------------------------
    # DECISION RECORDS
    # -------------------------------------------------------------
    async def create_decision_record(
        self,
        company_id: uuid.UUID,
        title: str,
        problem: str,
        options: list[dict],
        evidence: list[dict],
        participants: list[dict],
        decision: str,
        rationale: str,
        expected_outcome: str,
        actual_outcome: str | None = None,
        lessons_learned: list[str] | None = None,
        decided_by_user_id: uuid.UUID | None = None,
        decided_by_agent_id: uuid.UUID | None = None,
        memory_item_id: uuid.UUID | None = None,
    ) -> DecisionRecord:
        record = DecisionRecord(
            company_id=company_id,
            title=title,
            problem=problem,
            options=options,
            evidence=evidence,
            participants=participants,
            decision=decision,
            rationale=rationale,
            expected_outcome=expected_outcome,
            actual_outcome=actual_outcome,
            lessons_learned=lessons_learned or [],
            decided_by_user_id=decided_by_user_id,
            decided_by_agent_id=decided_by_agent_id,
            memory_item_id=memory_item_id,
            decided_at=datetime.now(timezone.utc),
        )
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def get_decision_record(self, record_id: uuid.UUID, company_id: uuid.UUID) -> DecisionRecord | None:
        stmt = select(DecisionRecord).where(
            DecisionRecord.id == record_id,
            DecisionRecord.company_id == company_id,
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_decision_records(self, company_id: uuid.UUID, limit: int = 50) -> list[DecisionRecord]:
        stmt = select(DecisionRecord).where(
            DecisionRecord.company_id == company_id
        ).order_by(DecisionRecord.decided_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_decision_outcome(
        self,
        record: DecisionRecord,
        actual_outcome: str,
        lessons_learned: list[str],
    ) -> DecisionRecord:
        record.actual_outcome = actual_outcome
        record.lessons_learned = lessons_learned
        await self.db.flush()
        await self.db.refresh(record)
        return record
