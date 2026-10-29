"""Esquemas Pydantic del catálogo de juegos (integración BGG)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GameCreate(BaseModel):
    bgg_id: int = Field(gt=0, description="ID del juego en BoardGameGeek (thing/XXXX)")


class CustomGameCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    min_players: int | None = Field(default=None, ge=1, le=100)
    max_players: int | None = Field(default=None, ge=1, le=100)
    avg_playtime_minutes: int | None = Field(default=None, ge=1, le=1440)
    description: str | None = Field(default=None, max_length=5000)


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group_id: int
    bgg_id: int | None
    name: str
    description: str | None
    image_url: str | None
    thumbnail_url: str | None
    min_players: int | None
    max_players: int | None
    avg_playtime_minutes: int | None
    year_published: int | None
    bgg_ranking: int | None
    bgg_rating: float | None
    created_at: datetime


class BGGSearchResultOut(BaseModel):
    bgg_id: int
    name: str
    year_published: int | None = None
