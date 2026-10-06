"""Async database engine and session factory."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from nexora.config import get_settings

settings = get_settings()

# Create async engine — echo only in dev
# If using SQLite file path, ensure directory exists
if "sqlite" in settings.DATABASE_URL and "///" in settings.DATABASE_URL:
    db_path = settings.DATABASE_URL.split("///")[-1]
    if db_path and db_path != ":memory:":
        from pathlib import Path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

from sqlalchemy import event

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)


@event.listens_for(engine.sync_engine, "connect")
def configure_sqlite_connection(dbapi_connection, connection_record):
    """Ensure SQLite has now() scalar function and enables foreign keys."""
    # Enable datetime helper now() for SQLite migrations where server_default=sa.text('now()') was used
    try:
        from datetime import datetime, timezone
        dbapi_connection.create_function("now", 0, lambda: datetime.now(timezone.utc).isoformat())
    except Exception:
        pass

    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
    finally:
        cursor.close()


# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all models."""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager version of get_db for use outside request scope."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
