"""Dependencias FastAPI: sesión de BD, usuario actual y control RBAC."""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import ACCESS_TOKEN_TYPE, AuthError, decode_token
from app.db.session import get_db
from app.models import GroupMembership, User
from app.models.enums import GlobalRole, GroupRole

http_bearer = HTTPBearer(auto_error=False)

_GROUP_ROLE_ORDER = {GroupRole.MEMBER: 0, GroupRole.MANAGER: 1}

# Jerarquía de roles globales: PLAYER < GESTOR < ADMIN
_GLOBAL_ROLE_ORDER = {
    GlobalRole.PLAYER: 0,
    GlobalRole.GESTOR: 1,
    GlobalRole.ADMIN: 2,
}


def _unauthorized(detail: str = "No autenticado") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Extrae y valida el Access Token de la cabecera Authorization: Bearer."""
    if credentials is None:
        raise _unauthorized()

    try:
        claims = decode_token(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
    except AuthError as exc:
        raise _unauthorized(exc.detail) from exc

    user_id = claims.get("sub")
    if not user_id:
        raise _unauthorized("Token sin sujeto (sub)")

    user = db.get(User, int(user_id))
    if user is None:
        raise _unauthorized("Usuario no encontrado")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cuenta desactivada")
    return user


# ------------------------------------------------------------------
# RBAC - Control de acceso basado en roles
# ------------------------------------------------------------------
def require_global_admin(user: User = Depends(get_current_user)) -> User:
    """Administrador Global: acceso total a la plataforma."""
    if user.role is None or user.role.name != GlobalRole.ADMIN.value:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Se requieren permisos de Administrador Global",
        )
    return user


def require_global_role(min_role: GlobalRole):
    """Factory de dependencias: valida el rol global mínimo del usuario.

    Uso en un router:
        @router.post("/resource")
        def create_resource(
            user: User = Depends(require_global_role(GlobalRole.GESTOR)),
        ): ...

    Jerarquía: PLAYER < GESTOR < ADMIN
    """

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role is None:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Se requiere al menos el rol de {min_role.value}",
            )
        current = _GLOBAL_ROLE_ORDER.get(GlobalRole(user.role.name), -1)
        required = _GLOBAL_ROLE_ORDER.get(min_role, 0)
        if current < required:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Se requiere al menos el rol de {min_role.value}",
            )
        return user

    return dependency


def require_group_role(min_role: GroupRole):
    """Factory de dependencias: valida el rol del usuario DENTRO de un grupo.

    Uso en un router:
        @patch("/{group_id}/games/{game_id}")
        def update_game(
            group_id: int,
            membership: GroupMembership = Depends(require_group_role(GroupRole.MANAGER)),
            ...
        )
    """

    def dependency(
        group_id: int,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ) -> GroupMembership:
        membership = db.scalar(
            select(GroupMembership).where(
                GroupMembership.group_id == group_id,
                GroupMembership.user_id == user.id,
            )
        )
        if membership is None:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No perteneces a este grupo")

        current_role = GroupRole(membership.role)
        if _GROUP_ROLE_ORDER[current_role] < _GROUP_ROLE_ORDER[min_role]:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Permisos insuficientes en este grupo",
            )
        return membership

    return dependency
