# CONTEXTO DEL PROYECTO — Documento de traspaso a otro agente

> Lee este documento completo antes de tocar nada. Es la fuente de verdad del
> estado del proyecto, las decisiones ya tomadas y lo que queda por hacer.

> **Actualización importante (2026-10-28):** la sección §9 contiene el estado
> más reciente y prevalece sobre cualquier cifra o descripción histórica de las
> secciones anteriores.

## 0. Resumen ejecutivo actualizado

El proyecto ya es una aplicación multiplataforma para grupos privados de
amigos que registran partidas de juegos de mesa, confirman resultados y
consultan clasificaciones.

**Estado actual verificado:**

- **Backend FastAPI:** operativo y probado.
- **Frontend Flutter:** operativo para Web y Android, con una única base de
  código para Web/Android/iOS.
- **Web:** compilación correcta en `frontend/build/web`; vista previa local
  comprobada en `http://localhost:8080/`.
- **Android:** APK debug compilado e instalado en el emulador Pixel 4.
- **Registro Android:** probado correctamente; se pudo crear una cuenta.
- **iOS:** preparado por Flutter, pero la compilación final requiere macOS/Xcode.
- **Catálogo:** búsqueda BGG, precarga de populares y creación de juegos
  personalizados implementados.
- **Clasificaciones:** clasificación general por grupo y clasificación
  independiente por juego implementadas.
- **Historial:** pestaña de partidas con filtro por juego implementada.
- **Pruebas recientes:** integración backend **61/61**, smoke auth **28/28**,
  migraciones **6/6** y APK Android debug generado correctamente.

**Pendiente:**

- Publicar la web en Internet con dominio/hosting.
- Generar y probar una aplicación iOS en un Mac.
- Crear una base de datos global normalizada independiente de los catálogos
  de cada grupo; actualmente el catálogo se almacena por grupo y se enriquece
  con BGG.
- Añadir soporte offline, sincronización y notificaciones push nativas.
- Añadir más pruebas Flutter de widgets y flujos completos.

## 1. Misión del proyecto

Aplicación distribuida para **registrar y gestionar partidas de juegos de mesa**:
grupos privados, catálogo con metadatos de BoardGameGeek, verificación de
resultados por confirmación entre jugadores, sistema ELO con rangos, temporadas
de 3 meses, logros y roles (RBAC). Objetivo final: desplegar en **Web** y luego
en **Android e iOS**.

## 2. Ubicación, entorno y cómo ejecutar

- **Raíz del workspace**: `C:\Users\AlejandroAlvarez\Desktop\Trabajo Autenticacion`
- **Backend**: subcarpeta `backend/` (aquí vive TODO el código actual).
- **SO**: Windows · **Python**: 3.13.15 · Repositorio Git local existente; hay
  cambios de trabajo sin commit que deben conservarse y revisarse.
- **Virtualenv ya creado e instalado**: `backend/.venv` con todas las dependencias de `requirements.txt`.

```powershell
cd "C:\Users\AlejandroAlvarez\Desktop\Trabajo Autenticacion\backend"
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000   # Swagger en http://localhost:8000/docs
```

- **Tests (obligatorios tras cualquier cambio)**, se ejecutan desde `backend/`:
  ```powershell
  .venv\Scripts\python.exe tests\smoke_auth.py         # 28 comprobaciones (auth + ELO puro)
  .venv\Scripts\python.exe tests\integration_test.py   # actualmente 61 comprobaciones
  .venv\Scripts\python.exe tests\migrations_test.py    # 6 comprobaciones (Alembic: up/down/sin drift)
  ```
  Los tres borran y recrean su BD automáticamente (son scripts con `check()` y
  `sys.exit(1)` si algo falla, pensados para CI). El esquema de `boardgames.db`
  ahora lo crea **Alembic** (ya no hay `create_all`).
  **Estado histórico: 28/28, 58/58, 6/6 y pytest 8/8 OK.** El estado vigente
  está en §9; cualquier cambio debe mantener todas las comprobaciones en verde.
  El test de integración usa la API real de BGG y, si no hay red, la simula
  (imprime `(BGG en vivo: True/False)`).

## 3. Stack y decisiones ya tomadas (NO cambiar a la ligera)

| Área | Decisión |
|---|---|
| Backend | Python + **FastAPI** (endpoints síncronos `def`, se ejecutan en threadpool) + Swagger autogenerado |
| ORM | **SQLAlchemy 2.0** estilo `Mapped`/`mapped_column` (NO SQLModel) |
| Migraciones | **Alembic integrado** (Tarea A hecha): `alembic/` + `alembic.ini` en `backend/`; el `lifespan` de `app/main.py` llama a `run_migrations()` (`app/db/migrate.py`), que es `alembic upgrade head`, y después siembra roles y logros. `create_all` **ya no se usa**. En SQLite (`render_as_batch=True`) Alembic emula los ALTER recreando la tabla |
| DB | SQLite en dev (`DATABASE_URL` en `.env`), preparado para PostgreSQL |
| Contraseñas | `passlib` con **bcrypt** (salt automático). `bcrypt` está **pineado a 4.0.1** en requirements por incompatibilidad con passlib 1.7.4 |
| Tokens | JWT dual: **Access 15 min** en cabecera `Authorization: Bearer` + **Refresh 14 días en cookie HttpOnly** (`path=/api/v1/auth`, `SameSite=Lax`, `Secure` vía env). Cada refresh **rota el jti** (un solo uso, revocable en tabla `refresh_tokens`) |
| Sesión BD | `SessionLocal` con **`autoflush=False`** y **`expire_on_commit=False`** → hay que hacer `db.flush()` explícito antes de SELECTs que deban ver inserts pendientes (ya causó un bug, ver §6) |
| RBAC | Rol global en `users.role_id` (`ADMIN`/`GESTOR`/`PLAYER`) + rol por grupo en `group_memberships.role` (`MANAGER`/`MEMBER`). Dependencias: `require_global_role` y `require_group_role(min_role)` en `app/core/deps.py` (leen `group_id` del path) |
| Frontend | **Flutter** multiplataforma Web/Android/iOS con Riverpod, GoRouter, Dio, almacenamiento seguro e interceptor de refresh silencioso |
| Idioma | Comentarios, mensajes HTTP y nombres de usuario/descripción en **español**; código y claves en inglés |

## 4. Estado actual — qué está HECHO y VERIFICADO

### Estructura

```
backend/
├── .env.example  requirements.txt  README.md  .gitignore
├── alembic.ini  alembic/  (env.py + versions/)  # ← migraciones (Tarea A hecha)
├── app/
│   ├── main.py                # lifespan (run_migrations()+seeds), CORS, 9 routers, /health
│   ├── core/    config.py  security.py  deps.py  timeutils.py
│   ├── db/      base.py  session.py  migrate.py  seed.py (roles ADMIN/PLAYER + 4 logros)
│   ├── models/  enums.py  user.py  group.py  game.py  season.py  match.py
│   │            achievement.py  notification.py  __init__.py (re-exporta todo)
│   ├── schemas/ auth.py  group.py  game.py  match.py  notification.py  stats.py
│   ├── api/v1/  auth.py  groups.py  games.py  matches.py  seasons.py
│   │            stats.py  notifications.py  achievements.py  admin.py
│   └── services/ elo_service.py  bgg_service.py  season_service.py
│                 match_service.py  achievement_service.py
└── tests/       smoke_auth.py  integration_test.py  migrations_test.py  # ← tras cada cambio
```

### Rutas operativas (prefijo `/api/v1`)

- **auth**: register, login (cookie), refresh (rotación), logout (revoca), me
- **groups**: crear (genera código de invitación + Temporada 1), listar mis grupos,
  `POST /groups/join` por código, detalle, miembros, cambiar rol/expulsar (MANAGER),
  salir, borrar en cascada (propietario o ADMIN)
- **games**: catálogo por grupo, búsqueda en BGG, alta por `bgg_id` rellenando
  metadatos desde `xmlapi2/thing` (MANAGER), creación de juegos personalizados,
  precarga popular y baja (409 si tiene partidas)
- **matches**: registrar (queda `PENDING` + notificaciones a los demás),
  detalle con confirmaciones, `confirm` / `reject` (solo participantes),
  `cancel` (MANAGER). **Al 100 % de confirmaciones → `CONFIRMED` y ahí se
  aplican ELO + stats + logros**; un rechazo → `REJECTED` sin efectos
- **seasons**: histórico + `rollover` manual (MANAGER)
- **stats**: `leaderboard` general, clasificación por juego,
  `stats/me`, `stats/users/{uid}`
- **notifications**: bandeja, marcar leída, marcar todas
- **achievements**: catálogo + mis insignias
- **admin** (solo ADMIN): overview, listar/buscar usuarios, activar-desactivar
  (al desactivar se revocan sus refresh tokens) y cambiar rol

### Reglas de negocio invariantes (no romper)

1. **ELO** (`elo_service`): k=32, expectativa FIDE repartida entre rivales
   (ganar a rival +200 ≈ +24 puntos), ELO base 1200. Las variaciones se
   guardan en `match_participants.elo_delta` **solo al confirmar**.
2. **Rangos**: Hierro <1200 ≤ Bronce <1400 ≤ Plata <1600 ≤ Oro <1800 ≤
   Platino <2000 ≤ Diamante (constante `RANK_THRESHOLDS`).
3. **Temporadas**: 92 días por grupo; al finalizar → soft reset = regresión
   50 % a la media (`elo_service.soft_reset`); el histórico de la temporada
   anterior **nunca se toca** (`season_ratings` por `season_id`).
4. **Partida**: solo `CONFIRMED` afecta a estadísticas/ELO; el registrador se
   da por confirmado y no puede confirmar la suya; nadie puede responder dos veces.
5. **RBAC**: `ADMIN` global → todo; `MANAGER` → solo modera **su grupo**
   (miembros, catálogo, cancelar partidas, rollover); `MEMBER` → jugar/ver.
6. Un usuario solo puede jugar partidas si **todos** los participantes son
   miembros del grupo y el juego pertenece al catálogo del grupo.

## 5. Convenciones del proyecto (seguirlas para mantener coherencia)

- Router: `APIRouter(prefix=..., tags=...)` y se registra en `app/main.py` con
  `app.include_router(x.router, prefix=settings.API_V1_PREFIX)`.
- Respuestas: **siempre** `response_model` Pydantic (v2, `ConfigDict(from_attributes=True)` para ORM); para objetos compuestos se construye una función helper (`match_to_out`, `_group_out`).
- Errores: `HTTPException(status.HTTP_XXX, "mensaje en español")`. Usar 401/403/404/409/422 con criterio (409 para conflictos de estado/unicidad).
- Acceso a BD: `db: Session = Depends(get_db)`; `db.commit()` explícito; recuerda `flush()` tras `add()` en bloque si un SELECT posterior debe verlos.
- Fechas: siempre `utcnow()` de `app/core/timeutils.py` (naive UTC, compatible SQLite+Postgres).
- Enums `str, Enum` en `models/enums.py`; en BD se guarda el `.value`.
- Cada endpoint de grupo repite `_member/_manager: GroupMembership = Depends(require_group_role(...))` para autorización y ya no hace falta comprobar pertenencia a mano.
- **Migraciones**: tras tocar cualquier modelo → `alembic revision --autogenerate -m "..."` desde `backend/`, revisar el archivo generado y lanzar `tests/migrations_test.py`. El esquema se aplica SIEMPRE vía `run_migrations()` en el `lifespan`; nunca volver a `create_all`.

## 6. Bugs ya encontrados (aprendizajes — no repetirlos)

1. **FK ambigua**: `GroupMembership` tiene DOS FK hacia `users` (`user_id` y `joined_by_id`) → hay que pasar `foreign_keys=` en las relationships.
2. **`Response` inyectado en FastAPI**: su `status_code` es `None` si no lo asignas; en endpoints `status_code=204` hay que hacer `response.status_code = ...` y devolver `None` (no devolver el objeto `response` tal cual).
3. **`Element` de XML es falsy sin hijos**: nunca `elem or default` → usar `is None` (rompió `min_players` de BGG).
4. **`autoflush=False`**: en el rollover se duplicaban `season_ratings` porque el SELECT no veía los INSERT pendientes → `db.flush()` obligatorio.
5. `passlib` + `bcrypt>=4.1` revienta → por eso `bcrypt==4.0.1` en requirements.
6. **`fileConfig` de Alembic** apaga los loggers existentes (`disable_existing_loggers`) → al migrar desde la app (`app/db/migrate.py`) se pasa `cfg.attributes["skip_logging_config"] = True` y `env.py` respeta ese flag; si no, uvicorn se queda sin logs al arrancar.
7. **Autogenerate necesita la BD vacía/limpia**: si la BD ya tiene tablas creadas fuera de Alembic no detecta nada → borrar el `.db` antes de generar la primera revisión (ya está reflejado en la revisión inicial).

## 7. BACKLOG — lo que hay que hacer ahora (por este orden)

### Tarea A ✅ (HECHA el 2026-10-15): Migraciones con Alembic
- `alembic/` + `alembic.ini` en `backend/`; `alembic/env.py` usa
  `settings.DATABASE_URL` y `Base.metadata` (importa `app.models`).
- Revisión inicial `eb665009a651_esquema_inicial.py` (14 tablas) generada con
  `--autogenerate` y verificada: 0 drift, upgrade/downgrade OK.
- `lifespan` de `app/main.py`: `run_migrations()` (`app/db/migrate.py`) sustituye a
  `create_all`; después seeds. Cubierto por `tests/migrations_test.py` (6 checks).
- Flujo documentado en `backend/README.md` §2.

### Tarea B ✅ (HECHA el 2026-10-19): Frontend Flutter (`frontend/` en la raíz)
- Instalación de Flutter SDK 3.47.7 en `C:\flutter`.
- Estructura limpia y desacoplada con Riverpod + GoRouter + Dio.
- Core: cliente HTTP Dio con `baseUrl`, `withCredentials` y `AuthInterceptor` para refresco automático ante 401; almacenamiento seguro de tokens con `flutter_secure_storage`.
- Modelos DTO completos (User, Group, Member, Game, Match, Confirmation, Stats, Leaderboard, Notification, Achievement).
- Pantallas implementadas:
  - Auth: Login y Registro con validaciones según reglas del backend.
  - Grupos: Lista de grupos, creación y unión por código; Detalle de grupo con 4 pestañas (Partidas, Clasificación/Leaderboard por temporada con soft reset, Catálogo con thumbnails, Miembros con roles).
  - Juegos: Buscador interactivo de BoardGameGeek (`BggSearchDialog`) para que el MANAGER agregue juegos al catálogo.
  - Partidas: Formulario completo de registro (`RegisterMatchScreen`) con selección de juego, multi-selección de jugadores y ganador; Pantalla de detalle (`MatchDetailScreen`) con estado de confirmaciones y acciones para Confirmar, Rechazar o Cancelar.
  - Notificaciones: Bandeja de avisos con marcado individual y masivo.
  - Logros: Catálogo de insignias y visualización de logros desbloqueados con fechas.
  - Perfil: Resumen de usuario, rol global y logout.
  - Widgets compartidos: `EloBadge` con colores personalizados por rango (Hierro, Bronce, Plata, Oro, Platino, Diamante).
- Compilación web exitosa: `build/web` generado sin errores.

### Tarea C ✅ (HECHA el 2026-10-19): Mejoras backend avanzadas, Seguridad y Catálogo
- **Transferencia de propiedad de grupo**: `POST /api/v1/groups/{group_id}/transfer-ownership` (solo propietario o ADMIN global; promueve al nuevo dueño a MANAGER).
- **Paginación real**: query params `limit` y `offset` añadidos en `matches`, `leaderboard`, `notifications` y `admin/users`.
- **Detección de reuso de refresh token**: revoca inmediatamente toda la familia de tokens del usuario si se intenta reutilizar un token ya consumido o rotado (prevención de ataques de replay/robo de cookie).
- **Notificaciones en tiempo real**: Server-Sent Events (SSE) vía `GET /api/v1/notifications/stream` con bus pub/sub asíncrono (`event_service.py`) transmitiendo eventos en vivo de confirmación de partida, rechazo y logros.
- **Rate limiting en login**: limitador de ventana deslizante en memoria (`rate_limit.py`) bloqueando fuerza bruta tras 5 intentos fallidos (devuelve HTTP 429 con cabecera `Retry-After`).
- **Gestión de avatar y perfil**: `PATCH /api/v1/auth/me` para actualizar `display_name` y `avatar_url`.
- **Recuperación de contraseña**: `POST /api/v1/auth/forgot-password` y `POST /api/v1/auth/reset-password` mediante token temporal firmado invalidable automáticamente tras el cambio y revocación de sesiones previas.
- **Base de datos de juegos y precarga**:
  - Los juegos viven en la tabla relacional `group_games` con metadatos completos BGG.
  - Añadido catálogo precargado `POPULAR_GAMES` en `app/db/seed.py` (Catan, Carcassonne, Pandemic, Ticket to Ride, Azul, Terraforming Mars, 7 Wonders).
  - Parámetro opcional `seed_popular: bool = True` en `POST /groups` para inicializar grupos con catálogo listo sin conexión externa.
  - Endpoint `POST /api/v1/groups/{group_id}/games/seed-popular` (MANAGER) para poblar juegos populares de forma idempotente.
- **Suite de pruebas y CI**:
  - `pytest` integrado: `pytest.ini` configurado y suite completa en `tests/test_api.py` (7 tests unitarios y de integración).
  - Workflow de integración continua en GitHub Actions: `.github/workflows/ci.yml`.
  - Mantenimiento y ampliación de tests independientes: `smoke_auth.py` ampliado a **28/28 OK**, `integration_test.py` ampliado a **56/56 OK**, `migrations_test.py` en **6/6 OK**.

### Tarea D ✅ (HECHA el 2026-10-19): Integración Frontend, Avatares Globales, Docker y Git
- **Sistema de Avatares y Fotos de Perfil**:
  - Backend: endpoint `POST /api/v1/auth/avatar` para subir fotos (.jpg/.png/.webp/.gif <= 5MB), guardadas en `backend/uploads/avatars/`. Directorio `/uploads/` montado como estático en FastAPI.
  - Esquemas y visibilidad global: `avatar_url` propagado a `MemberOut`, `GroupStatsOut`, `ParticipantOut` y `ConfirmationOut`. Todos los usuarios ven la foto de los demás en la lista de miembros, leaderboard de temporada y confirmaciones de partidas.
  - Frontend: componente reutilizable `UserAvatar` con carga remota de red, resolución automática de URLs estáticas (`resolveUrl`), fallback con iniciales deterministas y paleta de colores coherente.
  - Editor interactivo en `ProfileScreen`: selección de avatares temáticos predefinidos (guerrero, mago, rey, pícaro, bardo, bot), campo de URL personalizada y previsualización en vivo.
- **Conexión de Nuevas Funciones en Frontend**:
  - Transferencia de propiedad de grupo conectada en el menú contextual de miembros de `GroupDetailScreen` (`transferOwnership`).
  - Precarga de juegos populares conectada con botón de acción directa en la pestaña de catálogo (`seedPopularGames`).
  - Flujo interactivo de recuperación de contraseña ("¿Olvidaste tu contraseña?") implementado en `LoginScreen` con soporte para validación y reseteo por token.
- **Dockerización Completa**:
  - `backend/Dockerfile`: contenedor Python 3.12-slim con soporte para SQLite/PostgreSQL y volumen persistente de uploads.
  - `frontend/Dockerfile` + `frontend/nginx.conf`: contenedor multi-etapa con Flutter SDK y Nginx sirviendo la SPA con proxy reverso a `/api/`, `/uploads/` y `/docs`.
  - `docker-compose.yml`: orquestación de PostgreSQL 16, backend FastAPI y frontend web Nginx con healthchecks y volúmenes de datos.
- **Git y Preparación Móvil**:
  - Repositorio Git inicializado en la raíz con `.gitignore` exhaustivo (omitiendo `.venv`, `.dart_tool`, `build`, `.db`).
  - Primer commit limpio realizado.
  - `AndroidManifest.xml` actualizado con permisos `INTERNET`, `ACCESS_NETWORK_STATE`, `usesCleartextTraffic="true"` y label "Board Game Tracker".
### Tarea E ✅ (HECHA el 2026-10-21): Sistema de Tres Roles Globales (ADMIN, GESTOR, PLAYER) y Resolución P0-P5
- **Tercer Rol Global (`GESTOR`)**:
  - `GlobalRole`: `ADMIN` (acceso total/mantenimiento), `GESTOR` (creación y administración de grupos/catálogos/partidas) y `PLAYER` (jugador/cliente estándar que se une a grupos y juega).
  - RBAC en backend: función dependiente `require_global_role(min_role)` en `app/core/deps.py` con jerarquía `PLAYER < GESTOR < ADMIN`. Creación de grupos (`POST /groups`) protegida para requerir al menos `GESTOR`.
  - Esquema `UserAdminUpdate`: ampliado con pattern `^(ADMIN|GESTOR|PLAYER)$` para que los administradores puedan promover/degradar roles globales.
  - Semilla de roles en `app/db/seed.py`: rol `GESTOR` sembrado automáticamente con su descripción.
  - Frontend Flutter: modelo `User` ampliado con getters (`isAdmin`, `isGestor`, `isPlayer`, `canCreateGroups`), pantalla de lista de grupos con control de permisos y advertencia pedagógica para clientes, y pantalla de perfil con badges y colores diferenciados según rol global.
- **Resolución y Verificación de P0-P5**:
  - P0: Secreto JWT en Docker fail-fast e interpolación obligatoria de variable `JWT_SECRET_KEY` desde `.env`.
  - P1: Test de integración con validación flexible para tolerar tanto BGG en vivo como precarga sin romper CI.
  - P2: Interceptor de refresco con `_refreshFuture` compartido para evitar fallos por 401 concurrentes.
  - P3: Frontend desacoplado con `--dart-define=API_BASE_URL=/api/v1` para Docker / Nginx reverse proxy.
  - P4: Eliminadas dependencias muertas de `pubspec.yaml`.
  - P5: Rate limiting distribuido en Redis con degradación transparente a memoria local.
- **Estado de Pruebas**:
  - `smoke_auth.py`: **28/28 OK**.
  - `integration_test.py`: **58/58 OK en la fecha de esta tarea** (la cifra
    vigente, con catálogo personalizado y ranking por juego, está en §9).
  - `migrations_test.py`: **6/6 OK**.
  - `pytest`: **8/8 PASSED**.
  - `flutter build web`: compilado exitosamente.

## 8. Restricciones

- **No romper lo verificado**: al terminar, `tests/smoke_auth.py` = 28/28,
  `tests/integration_test.py` = 58/58, `tests/migrations_test.py` = 6/6 y
  `pytest` = 8/8 deben seguir en verde.
- No cambiar el esquema de tokens/cookies sin actualizar `deps.py`, `security.py`
  y los tests a la vez.
- Mantener el Swagger limpio: `summary`/`description` en los endpoints.
- Si creas tablas nuevas, acuérdate de las relationships con `back_populates`
  y de los `flush()` con `autoflush=False`.

*(Documento histórico actualizado el 2026-10-21. Para el estado vigente,
consultar §9.)*

## 9. Estado vigente y diario de trabajo (2026-10-28)

Esta sección sustituye las cifras antiguas de las secciones históricas.

### 9.1 Funcionalidades terminadas

- [x] Backend FastAPI con autenticación JWT dual:
  access token en cabecera y refresh token rotatorio en cookie HttpOnly.
- [x] Registro, inicio de sesión, refresh, logout, recuperación de contraseña
  y edición básica de perfil.
- [x] Roles globales `ADMIN`, `GESTOR` y `PLAYER`.
- [x] Grupos privados con código de invitación, miembros y roles por grupo.
- [x] Catálogo por grupo con búsqueda y metadatos de BoardGameGeek.
- [x] Precarga idempotente de juegos populares.
- [x] Creación de juegos personalizados para juegos raros o caseros:
  nombre, descripción, jugadores mínimo/máximo y duración aproximada.
- [x] Registro de partidas con participantes, ganador y fecha.
- [x] Confirmación/rechazo de partidas y aplicación de ELO únicamente al
  confirmar.
- [x] Temporadas, rollover y soft reset del ELO.
- [x] Clasificación general del grupo.
- [x] Clasificación independiente por juego y temporada. El ELO por juego se
  calcula a partir de las partidas confirmadas de ese juego y no altera el ELO
  general.
- [x] Historial de partidas en el grupo con filtro por juego desde Flutter.
- [x] Estadísticas globales de cuenta: partidas, victorias, win rate, juegos,
  tiempo jugado, experiencia y nivel.
- [x] Logros, notificaciones, avatares, SSE y rate limiting.
- [x] Tema visual de juegos de mesa: azul noche, coral, menta y ámbar.
- [x] Dashboard móvil de grupos rediseñado como “Tu mesa”.
- [x] Perfil móvil con nivel, barra de experiencia y estadísticas.
- [x] Flutter Web compilado correctamente.
- [x] Flutter Android compilado e instalado en el emulador Pixel 4.
- [x] Registro de una cuenta probado correctamente en Android.
- [x] Docker Compose para backend, PostgreSQL, Redis y frontend web.

### 9.2 Archivos principales modificados recientemente

**Backend**

- `backend/app/api/v1/games.py`: endpoint para juegos personalizados.
- `backend/app/schemas/game.py`: esquema `CustomGameCreate`.
- `backend/app/api/v1/stats.py`: endpoint
  `GET /groups/{group_id}/games/{game_id}/leaderboard`.
- `backend/app/schemas/stats.py`: esquema `GameLeaderboardOut`.
- `backend/tests/integration_test.py`: pruebas de juegos personalizados y
  clasificación por juego.

**Frontend Flutter**

- `frontend/lib/features/games/data/game_repository.dart`: creación de juegos
  personalizados.
- `frontend/lib/features/games/screens/custom_game_dialog.dart`: formulario
  visual para juegos raros/caseros.
- `frontend/lib/features/groups/screens/group_detail_screen.dart`: botones de
  catálogo, selector de clasificación por juego y filtro del historial.
- `frontend/lib/features/stats/data/stats_repository.dart`: consulta de
  clasificación por juego.
- `frontend/lib/features/stats/providers/stats_provider.dart`: proveedor
  Riverpod para clasificación por juego.
- `frontend/lib/shared/models/stats.dart`: modelo `GameLeaderboard`.
- `frontend/lib/core/network/api_endpoints.dart`: ruta de leaderboard por juego.

### 9.3 Validaciones realizadas

Ejecutadas desde `backend/`:

```powershell
.venv\Scripts\python.exe tests\smoke_auth.py
# 28/28 comprobaciones OK

.venv\Scripts\python.exe tests\integration_test.py
# 61/61 comprobaciones OK

.venv\Scripts\python.exe tests\migrations_test.py
# 6/6 comprobaciones OK
```

También se verificó:

```powershell
cd ..\frontend
C:\flutter\bin\flutter.bat analyze --no-fatal-infos
C:\flutter\bin\flutter.bat build web --no-tree-shake-icons
C:\flutter\bin\flutter.bat build apk --debug
```

El análisis Flutter conserva únicamente avisos informativos/deprecaciones
preexistentes; no hay errores bloqueantes. El APK se genera en:

`frontend\build\app\outputs\flutter-apk\app-debug.apk`

### 9.4 Cómo ejecutar actualmente

**Backend local:**

```powershell
cd "C:\Users\AlejandroAlvarez\Desktop\Trabajo Autenticacion\backend"
.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Healthcheck: `http://127.0.0.1:8000/health`

**Web Flutter en desarrollo:**

```powershell
cd "C:\Users\AlejandroAlvarez\Desktop\Trabajo Autenticacion\frontend"
C:\flutter\bin\flutter.bat run -d chrome --web-port 5173
```

Para una vista estática compilada:

```powershell
C:\flutter\bin\flutter.bat build web --no-tree-shake-icons
cd build\web
python -m http.server 8080 --bind 127.0.0.1
```

Abrir `http://localhost:8080/`.

**Android con backend local:**

1. Abrir el AVD `Pixel 4` desde Android Studio.
2. Comprobar:

   ```powershell
   & "C:\Users\AlejandroAlvarez\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices
   ```

   Debe aparecer `emulator-5554 device`.
3. Crear el puente del backend:

   ```powershell
   & "C:\Users\AlejandroAlvarez\AppData\Local\Android\Sdk\platform-tools\adb.exe" reverse tcp:8000 tcp:8000
   ```
4. Ejecutar Flutter:

   ```powershell
   cd "C:\Users\AlejandroAlvarez\Desktop\Trabajo Autenticacion\frontend"
   C:\flutter\bin\flutter.bat run -d emulator-5554 `
     --dart-define=API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```

El puente `adb reverse` evita el problema de `localhost` dentro del emulador.
El AVD `Medium Phone API 37.0` dio problemas de rendimiento/pantalla negra;
el Pixel 4 configurado con menos recursos funcionó correctamente.

### 9.5 Pendientes priorizados

1. **Publicación web:** elegir hosting, configurar variables de entorno,
   desplegar backend y frontend, y añadir HTTPS.
2. **Catálogo global:** separar el catálogo común de BGG de la relación
   `group_games`, añadir caché y permitir que varios grupos reutilicen el mismo
   juego.
3. **Historial personal:** añadir una pantalla de perfil con historial propio
   agrupado por juego, no solo el filtro dentro del grupo.
4. **iOS:** probar en macOS/Xcode, configurar certificados y generar `.ipa`.
5. **Offline:** caché local, cola de sincronización y estados de conectividad.
6. **Push notifications:** complementar SSE con FCM/APNs para móviles.
7. **Calidad Flutter:** tests de widgets, tests de repositorios y pruebas
   visuales de los flujos principales.
8. **Producción:** PostgreSQL gestionado, Redis gestionado, backups, logs,
   monitorización y secretos fuera del repositorio.
9. **Limpieza técnica:** revisar avisos deprecados de Flutter y organizar los
   cambios locales en commits pequeños y descriptivos.

### 9.6 Decisiones de producto vigentes

- La aplicación sigue siendo privada por grupos; no se implementa todavía una
  comunidad pública.
- Un usuario puede pertenecer a varios grupos.
- La clasificación general y la clasificación por juego son independientes.
- El nivel/XP global de la cuenta es independiente del ELO.
- Los juegos raros no se descartan: se crean como juegos personalizados.
- El catálogo actual es por grupo; el catálogo global es una mejora posterior.
- Web y móvil comparten Flutter y los mismos endpoints FastAPI.

## 10. Tarea F — Rediseño completo del frontend Flutter (2026-10-29)

> **Objetivo:** transformar el frontend de una interfaz funcional pero básica a
> una experiencia premium con animaciones, micro-interacciones, transiciones
> fluidas y un diseño que invite a explorar los menús. Debe funcionar
> correctamente en Android, iOS y Web.

### 10.1 Diagnóstico del frontend actual

**Problemas identificados:**

1. **Cero animaciones** — Sin transiciones de página, hero animations ni
   micro-interacciones. Las pantallas aparecen y desaparecen sin vida.
2. **Aspecto Material genérico** — Widgets estándar con personalización mínima.
3. **Sin splash screen** — Arranque por defecto de Flutter.
4. **Sin estados vacíos atractivos** — Pantallas en blanco cuando no hay datos.
5. **Sin estados de carga animados** — Solo `CircularProgressIndicator` básico.
6. **Barra de navegación inferior plana** — `BottomNavigationBar` sin animación
   ni indicador visual atractivo.
7. **Cards planas** — Sin variedad de elevación, sin efecto hover/press.
8. **Sin tipografía personalizada** — Solo la fuente por defecto de Material.
9. **Sin haptic feedback** — Sin respuesta táctil en interacciones.
10. **Sin onboarding** — El usuario nuevo cae directamente en el login.
11. **Emoji como branding** — Usando `Icons.casino` en vez de identidad visual.

### 10.2 Plan de implementación — 6 fases

#### Fase F1: Infraestructura de animación y dependencias ✅
> **Alcance:** Añadir paquetes de animación, fuente personalizada, sistema de
> transiciones de página y utilidades compartidas de animación.

- [x] Añadir dependencias: `flutter_animate`, `flutter_staggered_animations`,
  `shimmer`, `lottie`, `google_fonts`, `cached_network_image`,
  `flutter_svg`.
- [x] Configurar `google_fonts` con **Poppins** como fuente principal (limpia,
  moderna, muy legible en móvil).
- [x] Crear `core/animations/` con utilidades: durations, curves, transiciones
  de página personalizadas (slide + fade, scale + fade).
- [x] Actualizar `app_theme.dart` con tipografía Poppins, sombras mejoradas,
  colores refinados y componentes con animación implícita.
- [x] Configurar transiciones de GoRouter globales (fade + slide).
- [x] Crear widget `AnimatedBottomNav` personalizado con indicador animado,
  iconos que escalan al seleccionar y badge de notificaciones.
- [x] Crear widget `ShimmerLoading` reutilizable para estados de carga.

#### Fase F2: Splash Screen y pantallas de Auth reinventadas
> **Alcance:** Primera impresión memorable. Splash animado, login y registro
> con vida.

- [ ] Splash screen con animación del logo (dados/fichas que ruedan y forman
  el nombre).
- [ ] `LoginScreen` rediseñada: partículas flotantes de fondo (dados, fichas),
  campos de texto con animación de entrada escalonada, botón con efecto
  ripple personalizado, transición suave al registro.
- [ ] `RegisterScreen` rediseñada: stepper visual (paso 1: datos, paso 2:
  avatar), animaciones de validación (shake en error, check en éxito).
- [ ] Hero animation del logo entre splash → login → register.
- [ ] Haptic feedback en botones principales.

#### Fase F3: Dashboard "Tu mesa" y lista de grupos premium
> **Alcance:** La pantalla principal debe ser el escaparate de la app.

- [ ] Header con gradiente animado (colores que cambian suavemente).
- [ ] Cards de grupo con entrada escalonada (aparecen una por una con bounce).
- [ ] Efecto de elevación al hacer long-press o hover en cards.
- [ ] Estado vacío con ilustración animada (Lottie) de mesa de juego esperando
  jugadores.
- [ ] Pull-to-refresh con animación personalizada (dado que gira).
- [ ] Animación de contadores (miembros, juegos) tipo counter roll-up.
- [ ] FAB expandible animado para crear/unirse.

#### Fase F4: Detalle de grupo, partidas y catálogo con vida
> **Alcance:** Las 4 pestañas del grupo deben ser inmersivas.

- [ ] Tabs con transición de contenido suave (fade + slide horizontal).
- [ ] **Partidas:** cards con status chips animados (pulse en PENDING),
  timeline visual, animación de confirmación (confetti o check explosivo).
- [ ] **Clasificación:** entradas del leaderboard con animación de ranking
  (posiciones que se deslizan), EloBadge con shimmer en Diamante/Platino,
  crown animada para el #1.
- [ ] **Catálogo:** grid con zoom-in al entrar, thumbnails con hero animation
  al detalle, animación de añadir juego (card que "aterriza" en la lista).
- [ ] **Miembros:** avatares con ripple al tocar, indicador de rol animado.

#### Fase F5: Perfil, logros y notificaciones
> **Alcance:** Gamificación visual.

- [ ] **Perfil:** avatar con anillo de progreso animado (nivel/XP), stats con
  counter animation, barra de XP con gradient animado y partículas.
- [ ] **Logros:** cards con efecto de desbloqueo (glow + scale), logros
  bloqueados en grayscale con candado, animación al obtener uno nuevo.
- [ ] **Notificaciones:** entrada escalonada, swipe-to-dismiss con animación,
  badge contador animado en la bottom nav.

#### Fase F6: Pulido final y optimización
> **Alcance:** Detalles que marcan la diferencia.

- [ ] Dark mode / light mode toggle con transición animada.
- [ ] Animaciones adaptativas: reducir en dispositivos de gama baja
  (`MediaQuery.disableAnimations`).
- [ ] Precarga de assets y optimización de renders.
- [ ] Test visual en Android emulator y web.
- [ ] Compilación y verificación APK debug + web build.

### 10.3 Decisiones de diseño

| Área | Decisión |
|---|---|
| Fuente | **Poppins** vía `google_fonts` — moderna, legible, con pesos variados |
| Tema | Modo oscuro como principal (ya está), con palette refinada |
| Animaciones | `flutter_animate` para declarativas + `AnimationController` para complejas |
| Transiciones | Fade + slide como transición de página por defecto |
| Loading | Shimmer skeletons en vez de spinners |
| Durations | Rápidas: 200ms (micro), Medias: 400ms (transiciones), Largas: 600ms (entrada) |
| Curves | `easeOutCubic` para entradas, `easeInOutCubic` para transiciones |

### 10.4 Restricciones

- **No romper la funcionalidad existente**: toda la lógica de providers,
  repositories, modelos y conectividad con el backend se mantiene intacta.
- **No romper los tests del backend**: el frontend no afecta a
  `smoke_auth.py`, `integration_test.py` ni `migrations_test.py`.
- Los paquetes nuevos deben ser compatibles con web, Android e iOS.
- Mantener la estructura de carpetas feature-first existente.
