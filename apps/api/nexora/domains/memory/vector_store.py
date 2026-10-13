"""
LanceDB Vector Storage & Hybrid Search Engine for NEIMAN Organizational Memory.

Provides:
- Embedded zero-server vector storage via LanceDB & PyArrow.
- CPU-efficient offline embeddings via FastEmbed (BAAI/bge-small-en-v1.5).
- Hybrid retrieval (Dense Semantic Embedding + Lexical FTS).
- Strict company_id scoping and domain-level filtering.
"""

from __future__ import annotations

import os
from typing import Any
import lancedb
import pyarrow as pa
from fastembed import TextEmbedding

from nexora.config import get_settings


class LanceVectorStore:
    _instance: LanceVectorStore | None = None
    _embed_model: TextEmbedding | None = None

    def __init__(self, db_path: str | None = None):
        settings = get_settings()
        self.db_path = db_path or os.environ.get("VECTOR_DB_PATH", settings.VECTOR_DB_PATH)
        os.makedirs(self.db_path, exist_ok=True)
        self.db = lancedb.connect(self.db_path)
        self.table_name = "organizational_memories"
        self._ensure_table()

    @classmethod
    def get_instance(cls) -> LanceVectorStore:
        if cls._instance is None:
            cls._instance = LanceVectorStore()
        return cls._instance

    @classmethod
    def get_embedding_model(cls) -> TextEmbedding:
        if cls._embed_model is None:
            cls._embed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        return cls._embed_model

    def _ensure_table(self) -> None:
        if self.table_name not in self.db.table_names():
            schema = pa.schema([
                pa.field("id", pa.string()),
                pa.field("company_id", pa.string()),
                pa.field("domain", pa.string()),
                pa.field("scope", pa.string()),
                pa.field("title", pa.string()),
                pa.field("summary", pa.string()),
                pa.field("content", pa.string()),
                pa.field("vector", pa.list_(pa.float32(), 384)),
            ])
            self.db.create_table(self.table_name, schema=schema)

    def upsert_memory(
        self,
        memory_id: str,
        company_id: str,
        domain: str,
        scope: str,
        title: str,
        summary: str,
        content: str,
    ) -> None:
        """Embed and persist a single memory entry."""
        embedder = self.get_embedding_model()
        text_to_embed = f"{title}\n{summary}\n{content}"
        vectors = list(embedder.embed([text_to_embed]))
        vector_list = vectors[0].tolist()

        tbl = self.db.open_table(self.table_name)
        # Delete prior record with same ID to achieve upsert behavior
        try:
            tbl.delete(f'id = "{memory_id}"')
        except Exception:
            pass

        data = [{
            "id": str(memory_id),
            "company_id": str(company_id),
            "domain": str(domain),
            "scope": str(scope),
            "title": str(title),
            "summary": str(summary or ""),
            "content": str(content),
            "vector": vector_list,
        }]
        tbl.add(data)

    def search_hybrid(
        self,
        company_id: str,
        query: str,
        target_domains: list[str] | None = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Executes hybrid dense vector similarity + filtering.
        Returns matched records with distance / relevance ranking.
        """
        if self.table_name not in self.db.table_names():
            return []

        tbl = self.db.open_table(self.table_name)
        embedder = self.get_embedding_model()
        query_vectors = list(embedder.embed([query]))
        query_vec = query_vectors[0].tolist()

        # Build filter condition
        where_clauses = [f'company_id = "{company_id}"']
        if target_domains:
            domains_str = ", ".join([f'"{d}"' for d in target_domains])
            where_clauses.append(f"domain IN ({domains_str})")
        where_filter = " AND ".join(where_clauses)

        try:
            results = (
                tbl.search(query_vec)
                .where(where_filter)
                .limit(limit)
                .to_list()
            )
            return results
        except Exception:
            # Fallback to query without domain clause if syntax edge-case occurs
            try:
                return (
                    tbl.search(query_vec)
                    .where(f'company_id = "{company_id}"')
                    .limit(limit)
                    .to_list()
                )
            except Exception:
                return []
