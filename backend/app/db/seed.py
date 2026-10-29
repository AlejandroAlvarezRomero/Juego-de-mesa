"""Seed inicial: roles globales y catálogo de logros/insignias."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Achievement, Game, Role
from app.models.enums import GlobalRole

GLOBAL_ROLES: dict[str, str] = {
    GlobalRole.ADMIN.value: "Acceso total a la plataforma, moderación de usuarios y mantenimiento del sistema.",
    GlobalRole.GESTOR.value: "Puede crear y gestionar grupos, moderar partidas y administrar catálogos de juegos.",
    GlobalRole.PLAYER.value: "Usuario estándar: unirse a grupos, registrar partidas y ver estadísticas.",
}

POPULAR_GAMES: list[dict[str, object]] = [
    {
        "bgg_id": 13,
        "name": "Catan",
        "description": "Los jugadores intentan ser la fuerza dominante en la isla de Catan construyendo asentamientos, ciudades y caminos.",
        "image_url": "https://cf.geekdo-images.com/W397RfmHGtOi3EHUrHtYuA__original/img/A-fVsJEPlv6T5twJ6nuhWcBn2XU=/0x0/filters:format(jpeg)/pic2419375.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/W397RfmHGtOi3EHUrHtYuA__thumb/img/gA5g_6n7GzD-3_Wf10R2uE6jQvY=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg",
        "min_players": 3,
        "max_players": 4,
        "avg_playtime_minutes": 90,
        "year_published": 1995,
        "bgg_ranking": 500,
        "bgg_rating": 7.1,
    },
    {
        "bgg_id": 822,
        "name": "Carcassonne",
        "description": "Juego de colocación de losetas donde los jugadores desarrollan el área alrededor de Carcasona con caminos, ciudades y monasterios.",
        "image_url": "https://cf.geekdo-images.com/okM0dq_bEXnbyQTOvHZwRw__original/img/eO7_P4Q69g3W4mR8cEwW8_5Q8_g=/0x0/filters:format(jpeg)/pic6544250.png",
        "thumbnail_url": "https://cf.geekdo-images.com/okM0dq_bEXnbyQTOvHZwRw__thumb/img/hXyC9j_Xb2Jt2xM6n3W_6n7GzD4=/fit-in/200x150/filters:strip_icc()/pic6544250.png",
        "min_players": 2,
        "max_players": 5,
        "avg_playtime_minutes": 45,
        "year_published": 2000,
        "bgg_ranking": 220,
        "bgg_rating": 7.4,
    },
    {
        "bgg_id": 30549,
        "name": "Pandemic",
        "description": "Tu equipo de especialistas en el control de enfermedades debe colaborar para investigar curas a cuatro plagas mortales.",
        "image_url": "https://cf.geekdo-images.com/S3ybV1LAp-AS4mIsVqUbRg__original/img/I-k2Y9k8v7Z0b_E1h4_g6L7nQeA=/0x0/filters:format(jpeg)/pic1534148.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/S3ybV1LAp-AS4mIsVqUbRg__thumb/img/K-qR9k8v7Z0b_E1h4_g6L7nQeA=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg",
        "min_players": 2,
        "max_players": 4,
        "avg_playtime_minutes": 45,
        "year_published": 2008,
        "bgg_ranking": 140,
        "bgg_rating": 7.6,
    },
    {
        "bgg_id": 9209,
        "name": "Ticket to Ride",
        "description": "Aventura ferroviaria en la que los jugadores compiten por conectar diferentes ciudades a través de Norteamérica en tren.",
        "image_url": "https://cf.geekdo-images.com/ZWJg0dCgahB3KnMVxV8png__original/img/w2q2_6n7GzD-3_Wf10R2uE6jQvY=/0x0/filters:format(jpeg)/pic38668.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/ZWJg0dCgahB3KnMVxV8png__thumb/img/w2q2_6n7GzD-3_Wf10R2uE6jQvY=/fit-in/200x150/filters:strip_icc()/pic38668.jpg",
        "min_players": 2,
        "max_players": 5,
        "avg_playtime_minutes": 60,
        "year_published": 2004,
        "bgg_ranking": 230,
        "bgg_rating": 7.4,
    },
    {
        "bgg_id": 230802,
        "name": "Azul",
        "description": "Los jugadores compiten como artesanos colocando azulejos de cerámica estilo mozárabe para decorar el palacio real de Évora.",
        "image_url": "https://cf.geekdo-images.com/tz19Pf9gaAVkV50UeAEufA__original/img/Z-3q9k8v7Z0b_E1h4_g6L7nQeA=/0x0/filters:format(jpeg)/pic3718275.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/tz19Pf9gaAVkV50UeAEufA__thumb/img/Z-3q9k8v7Z0b_E1h4_g6L7nQeA=/fit-in/200x150/filters:strip_icc()/pic3718275.jpg",
        "min_players": 2,
        "max_players": 4,
        "avg_playtime_minutes": 45,
        "year_published": 2017,
        "bgg_ranking": 75,
        "bgg_rating": 7.8,
    },
    {
        "bgg_id": 167791,
        "name": "Terraforming Mars",
        "description": "Grandes corporaciones compiten para transformar Marte en un planeta habitable gestionando recursos y megaproyectos.",
        "image_url": "https://cf.geekdo-images.com/wg9oOLcsKvDesqGGjSS4Sw__original/img/f8Yq9k8v7Z0b_E1h4_g6L7nQeA=/0x0/filters:format(jpeg)/pic3536616.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/wg9oOLcsKvDesqGGjSS4Sw__thumb/img/f8Yq9k8v7Z0b_E1h4_g6L7nQeA=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg",
        "min_players": 1,
        "max_players": 5,
        "avg_playtime_minutes": 120,
        "year_published": 2016,
        "bgg_ranking": 6,
        "bgg_rating": 8.4,
    },
    {
        "bgg_id": 68448,
        "name": "7 Wonders",
        "description": "Lidera una de las siete grandes ciudades del mundo antiguo y erige una maravilla arquitectónica que trascienda los tiempos.",
        "image_url": "https://cf.geekdo-images.com/35nVHQIs-SOcDTjdCJEMSg__original/img/B8zq9k8v7Z0b_E1h4_g6L7nQeA=/0x0/filters:format(jpeg)/pic860217.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/35nVHQIs-SOcDTjdCJEMSg__thumb/img/B8zq9k8v7Z0b_E1h4_g6L7nQeA=/fit-in/200x150/filters:strip_icc()/pic860217.jpg",
        "min_players": 2,
        "max_players": 7,
        "avg_playtime_minutes": 30,
        "year_published": 2010,
        "bgg_ranking": 95,
        "bgg_rating": 7.7,
    },
    {
        "bgg_id": 266192,
        "name": "Wingspan",
        "description": "Juego competitivo de aves y construcción de motores donde los jugadores atraen las mejores aves a sus reservas naturales.",
        "image_url": "https://cf.geekdo-images.com/yLZJ0mkZw46fColCallerw__original/img/yLZJ0mkZw46fColCallerw.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/yLZJ0mkZw46fColCallerw__thumb/img/yLZJ0mkZw46fColCallerw.jpg",
        "min_players": 1,
        "max_players": 5,
        "avg_playtime_minutes": 70,
        "year_published": 2019,
        "bgg_ranking": 25,
        "bgg_rating": 8.0,
    },
    {
        "bgg_id": 148228,
        "name": "Splendor",
        "description": "Comerciantes del Renacimiento adquieren minas de gemas, transporte y tiendas para ganar prestigio ante los nobles.",
        "image_url": "https://cf.geekdo-images.com/rwOMBatchDFas398h_original/pic1904079.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/rwOMBatchDFas398h_thumb/pic1904079.jpg",
        "min_players": 2,
        "max_players": 4,
        "avg_playtime_minutes": 30,
        "year_published": 2014,
        "bgg_ranking": 200,
        "bgg_rating": 7.4,
    },
    {
        "bgg_id": 169786,
        "name": "Scythe",
        "description": "Ambientado en una realidad alternativa de los años 1920, cada jugador representa a un líder intentando llevar a su facción a la prosperidad en Europa oriental.",
        "image_url": "https://cf.geekdo-images.com/7k_nOxpO9OGIjhLqAnYCgw__original/pic3163924.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/7k_nOxpO9OGIjhLqAnYCgw__thumb/pic3163924.jpg",
        "min_players": 1,
        "max_players": 5,
        "avg_playtime_minutes": 115,
        "year_published": 2016,
        "bgg_ranking": 16,
        "bgg_rating": 8.1,
    },
    {
        "bgg_id": 316554,
        "name": "Dune: Imperium",
        "description": "Estrategia y construcción de mazos ambientada en el universo de Dune. Lucha por el control de la especia en Arrakis.",
        "image_url": "https://cf.geekdo-images.com/PhjygpTFaa_UN4RrCnWq3g__original/pic5666597.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/PhjygpTFaa_UN4RrCnWq3g__thumb/pic5666597.jpg",
        "min_players": 1,
        "max_players": 4,
        "avg_playtime_minutes": 120,
        "year_published": 2020,
        "bgg_ranking": 7,
        "bgg_rating": 8.4,
    },
    {
        "bgg_id": 295947,
        "name": "Cascadia",
        "description": "Crea hábitats armoniosos en el noroeste del Pacífico seleccionando fichas de terreno y fauna para maximizar la puntuación.",
        "image_url": "https://cf.geekdo-images.com/cbA3bEeqXqI0Fq8W3w__original/pic5100691.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/cbA3bEeqXqI0Fq8W3w__thumb/pic5100691.jpg",
        "min_players": 1,
        "max_players": 4,
        "avg_playtime_minutes": 45,
        "year_published": 2021,
        "bgg_ranking": 35,
        "bgg_rating": 8.0,
    },
    {
        "bgg_id": 2843,
        "name": "Monopoly",
        "description": "El clásico juego de comercio inmobiliario donde los jugadores compran, venden e hipotecan propiedades para llevar a sus rivales a la bancarrota.",
        "image_url": "https://cf.geekdo-images.com/9nGoouEomjxLUih5jx1nQA__original/img/P1V1aB_iV1B_9V1B.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/9nGoouEomjxLUih5jx1nQA__thumb/img/P1V1aB_iV1B_9V1B.jpg",
        "min_players": 2,
        "max_players": 8,
        "avg_playtime_minutes": 120,
        "year_published": 1935,
        "bgg_ranking": 25000,
        "bgg_rating": 4.4,
    },
    {
        "bgg_id": 181,
        "name": "Risk",
        "description": "Juego de conquista militar y estrategia global donde los jugadores lideran ejércitos para dominar todos los territorios del mundo.",
        "image_url": "https://cf.geekdo-images.com/9yXjW1L9G9G1y1L9G9G1/pic223945.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/9yXjW1L9G9G1y1L9G9G1/pic223945.jpg",
        "min_players": 2,
        "max_players": 6,
        "avg_playtime_minutes": 120,
        "year_published": 1959,
        "bgg_ranking": 21000,
        "bgg_rating": 5.6,
    },
    {
        "bgg_id": 1294,
        "name": "Cluedo (Clue)",
        "description": "Juego clásico de deducción y misterio: averigua quién cometió el asesinato en la mansión, en qué habitación y con qué arma.",
        "image_url": "https://cf.geekdo-images.com/cluedo_original.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/cluedo_thumb.jpg",
        "min_players": 3,
        "max_players": 6,
        "avg_playtime_minutes": 45,
        "year_published": 1949,
        "bgg_ranking": 22000,
        "bgg_rating": 5.7,
    },
    {
        "bgg_id": 178900,
        "name": "Codenames (Código Secreto)",
        "description": "Dos líderes de espías rivales dan pistas de una palabra para que sus compañeros descubran a sus agentes secretos antes que el adversario.",
        "image_url": "https://cf.geekdo-images.com/F_KDEu0GjdUtmwCPK1NZDA__original/pic2582929.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/F_KDEu0GjdUtmwCPK1NZDA__thumb/pic2582929.jpg",
        "min_players": 2,
        "max_players": 8,
        "avg_playtime_minutes": 15,
        "year_published": 2015,
        "bgg_ranking": 120,
        "bgg_rating": 7.6,
    },
    {
        "bgg_id": 39856,
        "name": "Dixit",
        "description": "Juego poético de creatividad e ingenio con cartas bellamente ilustradas donde los jugadores intentan adivinar la carta del narrador a partir de una pista enigmática.",
        "image_url": "https://cf.geekdo-images.com/dixit_pic.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/dixit_thumb.jpg",
        "min_players": 3,
        "max_players": 6,
        "avg_playtime_minutes": 30,
        "year_published": 2008,
        "bgg_ranking": 310,
        "bgg_rating": 7.2,
    },
    {
        "bgg_id": 180020,
        "name": "Virus!",
        "description": "Frenético juego de cartas donde compites por aislar un cuerpo sano con 4 órganos limpios mientras infectas y destruyes los órganos de los demás.",
        "image_url": "https://cf.geekdo-images.com/virus_card_game.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/virus_card_game.jpg",
        "min_players": 2,
        "max_players": 6,
        "avg_playtime_minutes": 20,
        "year_published": 2014,
        "bgg_ranking": 2100,
        "bgg_rating": 6.8,
    },
    {
        "bgg_id": 3955,
        "name": "Bang!",
        "description": "Juego de cartas ambientado en el Salvaje Oeste donde los forajidos cazan al Sheriff, el Sheriff a los forajidos y el renegado planea en las sombras.",
        "image_url": "https://cf.geekdo-images.com/bang_pic.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/bang_thumb.jpg",
        "min_players": 4,
        "max_players": 7,
        "avg_playtime_minutes": 40,
        "year_published": 2002,
        "bgg_ranking": 1500,
        "bgg_rating": 6.5,
    },
    {
        "bgg_id": 172225,
        "name": "Exploding Kittens",
        "description": "Una versión gatuna de la ruleta rusa con cartas. Los jugadores roban cartas hasta que alguien saca un gatito explosivo y muere, a menos que lo desactive.",
        "image_url": "https://cf.geekdo-images.com/exploding_kittens.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/exploding_kittens.jpg",
        "min_players": 2,
        "max_players": 5,
        "avg_playtime_minutes": 15,
        "year_published": 2015,
        "bgg_ranking": 1900,
        "bgg_rating": 6.1,
    },
    {
        "bgg_id": 129622,
        "name": "Love Letter",
        "description": "Juego rápido de deducción, riesgo y suerte. Entrega tu carta de amor a la Princesa esquivando las intrigas de la corte real.",
        "image_url": "https://cf.geekdo-images.com/love_letter.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/love_letter.jpg",
        "min_players": 2,
        "max_players": 4,
        "avg_playtime_minutes": 20,
        "year_published": 2012,
        "bgg_ranking": 350,
        "bgg_rating": 7.2,
    },
    {
        "bgg_id": 2223,
        "name": "UNO",
        "description": "El popular juego de cartas por colores y números donde debes deshacerte de tus cartas antes que los demás y no olvidar gritar ¡UNO!",
        "image_url": "https://cf.geekdo-images.com/uno_game.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/uno_game.jpg",
        "min_players": 2,
        "max_players": 10,
        "avg_playtime_minutes": 30,
        "year_published": 1971,
        "bgg_ranking": 24000,
        "bgg_rating": 5.4,
    },
    {
        "bgg_id": 14996,
        "name": "Ticket to Ride: Europe (Aventureros al Tren Europa)",
        "description": "Construye estaciones y conecta rutas de tren a través de Europa desde Edimburgo hasta Constantinopla.",
        "image_url": "https://cf.geekdo-images.com/ticket_to_ride_europe.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/ticket_to_ride_europe.jpg",
        "min_players": 2,
        "max_players": 5,
        "avg_playtime_minutes": 60,
        "year_published": 2005,
        "bgg_ranking": 150,
        "bgg_rating": 7.5,
    },
    {
        "bgg_id": 173346,
        "name": "7 Wonders Duel",
        "description": "Una de las mejores adaptaciones exclusivas para dos jugadores: civilizaciones compitiendo militarmente, científicamente o por maravillas.",
        "image_url": "https://cf.geekdo-images.com/7wonders_duel.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/7wonders_duel.jpg",
        "min_players": 2,
        "max_players": 2,
        "avg_playtime_minutes": 30,
        "year_published": 2015,
        "bgg_ranking": 19,
        "bgg_rating": 8.1,
    },
    {
        "bgg_id": 174430,
        "name": "Gloomhaven",
        "description": "Juego cooperativo táctico de exploración de mazmorras y combate táctico en un mundo persistente de fantasía oscura cambiante.",
        "image_url": "https://cf.geekdo-images.com/gloomhaven.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/gloomhaven.jpg",
        "min_players": 1,
        "max_players": 4,
        "avg_playtime_minutes": 120,
        "year_published": 2017,
        "bgg_ranking": 3,
        "bgg_rating": 8.6,
    },
    {
        "bgg_id": 224517,
        "name": "Brass: Birmingham",
        "description": "Estrategia económica de la era industrial en West Midlands: carbón, hierro, cerveza y redes ferroviarias en uno de los juegos mejor valorados de la historia.",
        "image_url": "https://cf.geekdo-images.com/brass_birmingham.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/brass_birmingham.jpg",
        "min_players": 2,
        "max_players": 4,
        "avg_playtime_minutes": 120,
        "year_published": 2018,
        "bgg_ranking": 1,
        "bgg_rating": 8.6,
    },
    {
        "bgg_id": 188834,
        "name": "Secret Hitler",
        "description": "Dramático juego de engaño político y deducción social en la Alemania de los años 30 entre liberales y fascistas.",
        "image_url": "https://cf.geekdo-images.com/secret_hitler.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/secret_hitler.jpg",
        "min_players": 5,
        "max_players": 10,
        "avg_playtime_minutes": 45,
        "year_published": 2016,
        "bgg_ranking": 160,
        "bgg_rating": 7.6,
    },
    {
        "bgg_id": 133473,
        "name": "Sushi Go!",
        "description": "Rápido juego de cartas de selección e intercambio (drafting) acumulando los mejores platos de sushi para conseguir la máxima puntuación.",
        "image_url": "https://cf.geekdo-images.com/sushi_go.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/sushi_go.jpg",
        "min_players": 2,
        "max_players": 5,
        "avg_playtime_minutes": 15,
        "year_published": 2013,
        "bgg_ranking": 400,
        "bgg_rating": 7.0,
    },
    {
        "bgg_id": 63888,
        "name": "Dobble (Spot It!)",
        "description": "Juego de agudeza visual y reflejos rápidos donde dos cartas cualesquiera siempre comparten exactamente un único símbolo idéntico.",
        "image_url": "https://cf.geekdo-images.com/dobble.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/dobble.jpg",
        "min_players": 2,
        "max_players": 8,
        "avg_playtime_minutes": 15,
        "year_published": 2009,
        "bgg_ranking": 1200,
        "bgg_rating": 6.6,
    },
    {
        "bgg_id": 171,
        "name": "Ajedrez (Chess)",
        "description": "El milenario juego de estrategia de información perfecta y dos jugadores con reyes, reinas, caballos y peones.",
        "image_url": "https://cf.geekdo-images.com/chess.jpg",
        "thumbnail_url": "https://cf.geekdo-images.com/chess.jpg",
        "min_players": 2,
        "max_players": 2,
        "avg_playtime_minutes": 60,
        "year_published": 1475,
        "bgg_ranking": 500,
        "bgg_rating": 7.1,
    },
]

ACHIEVEMENTS: list[dict[str, object]] = [
    {
        "code": "FIRST_BLOOD",
        "name": "Primera Sangre",
        "description": "Gana tu primera partida con un juego que nunca habías ganado.",
        "condition": {"type": "first_win_with_game"},
    },
    {
        "code": "WIN_STREAK_5",
        "name": "Racha de Victorias",
        "description": "Consigue 5 victorias seguidas en el mismo grupo.",
        "condition": {"type": "win_streak", "streak": 5},
    },
    {
        "code": "GAMES_10",
        "name": "Veterano de Mesa",
        "description": "Juega 10 partidas verificadas en un grupo.",
        "condition": {"type": "games_played", "threshold": 10},
    },
    {
        "code": "GAMES_50",
        "name": "Leyenda del Grupo",
        "description": "Juega 50 partidas verificadas en un grupo.",
        "condition": {"type": "games_played", "threshold": 50},
    },
]


def seed_roles(db: Session) -> None:
    for name, description in GLOBAL_ROLES.items():
        exists = db.scalar(select(Role).where(Role.name == name))
        if exists is None:
            db.add(Role(name=name, description=description))
    db.commit()


def seed_achievements(db: Session) -> None:
    for item in ACHIEVEMENTS:
        exists = db.scalar(select(Achievement).where(Achievement.code == item["code"]))
        if exists is None:
            db.add(
                Achievement(
                    code=item["code"],  # type: ignore[arg-type]
                    name=item["name"],  # type: ignore[arg-type]
                    description=item["description"],  # type: ignore[arg-type]
                    condition=item["condition"],  # type: ignore[arg-type]
                )
            )
    db.commit()


def seed_popular_games(db: Session, group_id: int, added_by_id: int | None = None) -> list[Game]:
    """Precarga los juegos de mesa más populares en el catálogo de un grupo."""
    created = []
    for g in POPULAR_GAMES:
        exists = db.scalar(
            select(Game.id).where(Game.group_id == group_id, Game.bgg_id == g["bgg_id"])
        )
        if exists is None:
            game = Game(
                group_id=group_id,
                bgg_id=g["bgg_id"],  # type: ignore[arg-type]
                name=g["name"],  # type: ignore[arg-type]
                description=g["description"],  # type: ignore[arg-type]
                image_url=g["image_url"],  # type: ignore[arg-type]
                thumbnail_url=g["thumbnail_url"],  # type: ignore[arg-type]
                min_players=g["min_players"],  # type: ignore[arg-type]
                max_players=g["max_players"],  # type: ignore[arg-type]
                avg_playtime_minutes=g["avg_playtime_minutes"],  # type: ignore[arg-type]
                year_published=g["year_published"],  # type: ignore[arg-type]
                bgg_ranking=g["bgg_ranking"],  # type: ignore[arg-type]
                bgg_rating=g["bgg_rating"],  # type: ignore[arg-type]
                added_by_id=added_by_id,
            )
            db.add(game)
            created.append(game)
    db.commit()
    for game in created:
        db.refresh(game)
    return created

