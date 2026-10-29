"""Estadísticas: win rate, ELO, rangos y tiempo jugado por grupo."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user, require_group_role
from app.db.session import get_db
from app.models import Game, GroupMembership, Match, SeasonRating, User
from app.models.enums import GroupRole
from app.schemas.stats import GameLeaderboardOut, GroupStatsOut, LeaderboardOut
from app.services.elo_service import BASE_RATING, compute_updates, rank_for
from app.models.enums import MatchStatus
from app.services import season_service
from app.services.season_service import base_stats_out

router = APIRouter(prefix="/groups/{group_id}", tags=["Estadísticas"])

_TOP_LIMIT = 50


def _stats_out(db: Session, rating: SeasonRating | None, user: User) -> GroupStatsOut:
    if rating is None:
        return GroupStatsOut(**base_stats_out(user.id, user.username, user.display_name, user.avatar_url))
    return GroupStatsOut(
        user_id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        elo=rating.elo,
        rank=rating.rank,
        wins=rating.wins,
        losses=rating.losses,
        games_played=rating.games_played,
        win_rate=rating.win_rate,
        total_play_minutes=rating.total_play_minutes,
    )



@router.get(
    "/leaderboard",
    response_model=LeaderboardOut,
    summary="Clasificación ELO de la temporada vigente",
)
def leaderboard(
    group_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _member: GroupMembership = Depends(require_group_role(GroupRole.MEMBER)),
) -> LeaderboardOut:
    season = season_service.ensure_active_season(db, group_id)
    ratings = db.scalars(
        select(SeasonRating)
        .where(SeasonRating.season_id == season.id)
        .order_by(SeasonRating.elo.desc(), SeasonRating.wins.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    users = {
        u.id: u
        for u in db.scalars(
            select(User).where(User.id.in_([r.user_id for r in ratings]))
        ).all()
    } if ratings else {}
    return LeaderboardOut(
        season=season,
        entries=[
            _stats_out(db, rating, users[rating.user_id])
            for rating in ratings
            if rating.user_id in users
        ],
    )


@router.get(
    "/games/{game_id}/leaderboard",
    response_model=GameLeaderboardOut,
    summary="Clasificación independiente por juego",
)
def game_leaderboard(
    group_id: int,
    game_id: int,
    db: Session = Depends(get_db),
    _member: GroupMembership = Depends(require_group_role(GroupRole.MEMBER)),
) -> GameLeaderboardOut:
    game = db.get(Game, game_id)
    if game is None or game.group_id != group_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Juego no encontrado")

    season = season_service.ensure_active_season(db, group_id)
    memberships = db.scalars(
        select(GroupMembership)
        .options(selectinload(GroupMembership.user))
        .where(GroupMembership.group_id == group_id)
    ).all()
    ratings = {membership.user_id: BASE_RATING for membership in memberships}
    wins = {membership.user_id: 0 for membership in memberships}
    losses = {membership.user_id: 0 for membership in memberships}
    minutes = {membership.user_id: 0 for membership in memberships}

    matches = db.scalars(
        select(Match)
        .options(selectinload(Match.participants))
        .where(
            Match.group_id == group_id,
            Match.game_id == game_id,
            Match.season_id == season.id,
            Match.status == MatchStatus.CONFIRMED.value,
        )
        .order_by(Match.played_at.asc(), Match.id.asc())
    ).all()
    for match in matches:
        participant_ids = [
            participant.user_id
            for participant in match.participants
            if participant.user_id in ratings
        ]
        if len(participant_ids) < 2 or match.winner_id not in ratings:
            continue
        updates = compute_updates(
            {user_id: ratings[user_id] for user_id in participant_ids},
            match.winner_id,
        )
        for user_id, delta in updates.items():
            ratings[user_id] += delta
            minutes[user_id] += match.duration_minutes or 0
        wins[match.winner_id] += 1
        for user_id in participant_ids:
            if user_id != match.winner_id:
                losses[user_id] += 1

    users = {membership.user_id: membership.user for membership in memberships}
    entries = []
    for user_id, user in users.items():
        games_played = wins[user_id] + losses[user_id]
        entries.append(
            GroupStatsOut(
                user_id=user_id,
                username=user.username,
                display_name=user.display_name,
                avatar_url=user.avatar_url,
                elo=ratings[user_id],
                rank=rank_for(ratings[user_id]).value,
                wins=wins[user_id],
                losses=losses[user_id],
                games_played=games_played,
                win_rate=(wins[user_id] / games_played * 100) if games_played else 0,
                total_play_minutes=minutes[user_id],
            )
        )
    entries.sort(key=lambda entry: (entry.elo, entry.wins, entry.win_rate), reverse=True)
    return GameLeaderboardOut(
        game_id=game.id,
        game_name=game.name,
        season=season,
        entries=entries,
    )


@router.get(
    "/stats/me",
    response_model=GroupStatsOut,
    summary="Mis estadísticas en el grupo (temporada vigente)",
)
def my_stats(
    group_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _member: GroupMembership = Depends(require_group_role(GroupRole.MEMBER)),
) -> GroupStatsOut:
    season = season_service.ensure_active_season(db, group_id)
    rating = db.scalar(
        select(SeasonRating).where(
            SeasonRating.season_id == season.id,
            SeasonRating.user_id == user.id,
        )
    )
    return _stats_out(db, rating, user)


@router.get(
    "/stats/users/{user_id}",
    response_model=GroupStatsOut,
    summary="Estadísticas de otro miembro del grupo",
)
def user_stats(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _member: GroupMembership = Depends(require_group_role(GroupRole.MEMBER)),
) -> GroupStatsOut:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    is_member = db.scalar(
        select(GroupMembership.id).where(
            GroupMembership.group_id == group_id,
            GroupMembership.user_id == user_id,
        )
    )
    if is_member is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Ese usuario no pertenece al grupo"
        )
    season = season_service.ensure_active_season(db, group_id)
    rating = db.scalar(
        select(SeasonRating).where(
            SeasonRating.season_id == season.id,
            SeasonRating.user_id == user_id,
        )
    )
    return _stats_out(db, rating, target)
