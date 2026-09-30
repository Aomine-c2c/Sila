"""Base SQLAlchemy model with UUID PK, timestamps, and soft-delete."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from nexora.database import Base


class CreatedAtMixin:
    """Adds created_at timestamp to any model."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class TimestampMixin(CreatedAtMixin):
    """Adds created_at and updated_at to any model."""

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Adds soft-delete fields. Hard DELETE is forbidden on protected entities."""

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UUIDBase(Base):
    """Abstract base with UUID primary key."""

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)


class UUIDCreatedAtBase(UUIDBase, CreatedAtMixin):
    """Abstract base with UUID primary key and created_at timestamp."""

    __abstract__ = True


class UUIDTimestampBase(UUIDBase, TimestampMixin):
    """Abstract base with UUID primary key and timestamps, without soft-delete."""

    __abstract__ = True


class NexoraBase(UUIDBase, TimestampMixin, SoftDeleteMixin):
    """Full-featured base: UUID PK + timestamps + soft-delete."""

    __abstract__ = True
