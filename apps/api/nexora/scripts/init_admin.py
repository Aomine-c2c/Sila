"""
Initialize primary administrator account if no users exist in the persistent database.
Ensures zero mock/demo data while guaranteeing a working out-of-the-box administrator.
"""

import asyncio
import uuid
import structlog
from sqlalchemy import select, func

# Import domain models to resolve all SQLAlchemy relations
import nexora.domains.agents.models  # noqa: F401
import nexora.domains.auth.models  # noqa: F401
import nexora.domains.blueprints.models  # noqa: F401
import nexora.domains.councils.models  # noqa: F401
import nexora.domains.decisions.models  # noqa: F401
import nexora.domains.governance.models  # noqa: F401
import nexora.domains.intelligence.evolution_models  # noqa: F401
import nexora.domains.intelligence.models  # noqa: F401
import nexora.domains.memory.models  # noqa: F401
import nexora.domains.organizations.models  # noqa: F401
import nexora.domains.policies.models  # noqa: F401
import nexora.domains.projects.models  # noqa: F401
import nexora.domains.resources.models  # noqa: F401
import nexora.domains.workflows.models  # noqa: F401

from nexora.database import AsyncSessionLocal
from nexora.domains.auth.models import User
from nexora.domains.auth.service import hash_password

logger = structlog.get_logger(__name__)


async def bootstrap_primary_admin(
    email: str = "admin@neiman.ai",
    username: str = "admin",
    password: str = "password123",
    first_name: str = "System",
    last_name: str = "Administrator",
) -> bool:
    async with AsyncSessionLocal() as session:
        count_stmt = select(func.count(User.id))
        count = (await session.execute(count_stmt)).scalar_one()

        if count > 0:
            return False

        admin = User(
            id=uuid.uuid4(),
            email=email,
            username=username,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_superuser=True,
        )
        session.add(admin)
        await session.commit()
        return True


if __name__ == "__main__":
    created = asyncio.run(bootstrap_primary_admin())
    if created:
        print("[+] Primary administrator initialized (admin@neiman.ai).")
    else:
        print("[*] Operator accounts already present. No bootstrap needed.")
