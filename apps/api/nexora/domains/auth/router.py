"""Auth API endpoints: register, login, me."""

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from nexora.database import get_db
from nexora.config import get_settings
from nexora.domains.auth.models import User
from nexora.domains.auth.schemas import TokenResponse, UserLogin, UserRegister, UserResponse
from nexora.domains.auth.service import AuthService, create_access_token
from nexora.exceptions import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["Authentication"])
_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    """FastAPI dependency: extracts and validates Bearer token, or defaults to admin if DISABLE_AUTH is true."""
    settings = get_settings()
    service = AuthService(db)

    if credentials and credentials.credentials:
        return await service.get_current_user(credentials.credentials)

    if settings.DISABLE_AUTH:
        default_user = await service.repo.get_by_email("admin@furnitureco.com")
        if not default_user:
            from sqlalchemy import select
            res = await db.execute(select(User))
            default_user = res.scalars().first()
        if default_user:
            return default_user

    raise UnauthorizedError("Authentication required.")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    service = AuthService(db)
    user = await service.register(
        email=body.email,
        username=body.username,
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive a JWT access token."""
    service = AuthService(db)
    user = await service.authenticate(body.email, body.password)
    token, expires_in = create_access_token(user.id)
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
