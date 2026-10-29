"""Rate limiting: limitador de ventana deslizante compartido (Redis) o local.

Por defecto usa Redis cuando hay `REDIS_URL` configurado y disponible, de modo
que el límite de intentos fallidos se comparte entre todos los workers e
instancias de la API (requisito "aplicación distribuida"). Si Redis no está
disponible, degrada de forma transparente al limitador en memoria.
"""
from __future__ import annotations

import threading
import time
import uuid
from collections import defaultdict
from typing import Protocol

from fastapi import HTTPException, status

from app.core.config import settings

try:  # Redis es una dependencia opcional: sin ella se usa el limitador local.
    import redis as _redis
except ImportError:  # pragma: no cover - depende del entorno
    _redis = None  # type: ignore[assignment]


class RateLimiter(Protocol):
    """Interfaz común de los limitadores."""

    def check(self, key: str, max_attempts: int, window_seconds: int) -> None: ...

    def record_failure(self, key: str) -> None: ...

    def reset(self, key: str) -> None: ...


class MemoryRateLimiter:
    """Limitador en memoria: válido para un único proceso."""

    def __init__(self) -> None:
        # (ip, key) -> lista de marcas de tiempo de intentos fallidos
        self._failed_attempts: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, key: str, max_attempts: int, window_seconds: int) -> None:
        now = time.time()
        with self._lock:
            attempts = self._failed_attempts[key]
            # Filtrar solo los intentos dentro de la ventana de tiempo
            recent = [t for t in attempts if now - t < window_seconds]
            self._failed_attempts[key] = recent

        if len(recent) >= max_attempts:
            retry_after = int(window_seconds - (now - recent[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Demasiados intentos fallidos. Inténtalo de nuevo en {retry_after} segundos.",
                headers={"Retry-After": str(retry_after)},
            )

    def record_failure(self, key: str) -> None:
        with self._lock:
            self._failed_attempts[key].append(time.time())

    def reset(self, key: str) -> None:
        with self._lock:
            self._failed_attempts.pop(key, None)


class RedisRateLimiter:
    """Limitador distribuido: ventana deslizante sobre un Sorted Set de Redis.

    Cada intento fallido se guarda como miembro del sorted set `rl:{key}` con
    su marca de tiempo. La ventana se recalcula descartando las entradas
    antiguas, de modo que el comportamiento equivale al limitador local pero
    compartido entre todos los procesos.
    """

    def __init__(self, client: "object") -> None:
        self._client = client
        self._prefix = "rl:"

    def _key(self, key: str) -> str:
        return f"{self._prefix}{key}"

    def check(self, key: str, max_attempts: int, window_seconds: int) -> None:
        now = time.time()
        redis_key = self._key(key)
        pipe = self._client.pipeline()
        pipe.zremrangebyscore(redis_key, 0, now - window_seconds)
        pipe.zcard(redis_key)
        pipe.zrange(redis_key, 0, 0, withscores=True)
        _, count, oldest = pipe.execute()

        if count >= max_attempts:
            first_seen = oldest[0][1] if oldest else now
            retry_after = int(window_seconds - (now - first_seen)) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Demasiados intentos fallidos. Inténtalo de nuevo en {retry_after} segundos.",
                headers={"Retry-After": str(retry_after)},
            )

    def record_failure(self, key: str) -> None:
        now = time.time()
        redis_key = self._key(key)
        member = f"{now}-{uuid.uuid4().hex[:8]}"
        pipe = self._client.pipeline()
        pipe.zadd(redis_key, {member: now})
        # La ventana se autolimpia sola: el TTL cubre el máximo de intentos.
        pipe.expire(redis_key, settings.RATE_LIMIT_WINDOW_SECONDS * 10)
        pipe.execute()

    def reset(self, key: str) -> None:
        self._client.delete(self._key(key))


_memory_limiter = MemoryRateLimiter()
_redis_limiter: RedisRateLimiter | None = None
_limiter: RateLimiter = _memory_limiter
_initialized = False
_init_lock = threading.Lock()


def _build_redis_limiter() -> RedisRateLimiter | None:
    """Crea el limitador Redis si está configurado y accesible."""
    if _redis is None or not settings.REDIS_URL:
        return None
    if settings.RATE_LIMIT_BACKEND == "memory":
        return None
    try:
        client = _redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=False,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        client.ping()
    except Exception:  # noqa: BLE001 - cualquier fallo -> fallback a memoria
        if settings.RATE_LIMIT_BACKEND == "redis":
            # El operador pidió Redis explícitamente: fallar es preferible a
            #illerar con un límite por proceso.
            raise
        return None
    return RedisRateLimiter(client)


def get_limiter() -> RateLimiter:
    """Devuelve el limitador activo (Redis si está disponible, si no memoria)."""
    global _redis_limiter, _limiter, _initialized
    if _initialized:
        return _limiter
    with _init_lock:
        if _initialized:
            return _limiter
        try:
            _redis_limiter = _build_redis_limiter()
        except Exception:  # noqa: BLE001
            _redis_limiter = None
        _limiter = _redis_limiter or _memory_limiter
        _initialized = True
        return _limiter


def limiter_backend_name() -> str:
    """Nombre del backend activo (para diagnóstico en /health)."""
    return "redis" if _redis_limiter is not None else "memory"


# ------------------------------------------------------------------
# API pública (usada por app/api/v1/auth.py)
# ------------------------------------------------------------------
def check_rate_limit(
    key: str,
    max_attempts: int | None = None,
    window_seconds: int | None = None,
) -> None:
    """Verifica si se ha superado el límite de intentos en la ventana de tiempo.
    Lanza HTTP 429 Too Many Requests si se excede."""
    get_limiter().check(
        key,
        max_attempts if max_attempts is not None else settings.RATE_LIMIT_MAX_ATTEMPTS,
        window_seconds if window_seconds is not None else settings.RATE_LIMIT_WINDOW_SECONDS,
    )


def record_failed_attempt(key: str) -> None:
    """Registra un intento fallido."""
    get_limiter().record_failure(key)


def reset_rate_limit(key: str) -> None:
    """Limpia los intentos tras un login exitoso."""
    get_limiter().reset(key)
