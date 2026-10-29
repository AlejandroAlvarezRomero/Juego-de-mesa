class Role {
  final int id;
  final String name;
  final String? description;

  Role({required this.id, required this.name, this.description});

  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
  };
}

class User {
  final int id;
  final String email;
  final String username;
  final String? displayName;
  final String? avatarUrl;
  final bool isActive;
  final Role role;
  final DateTime createdAt;

  User({
    required this.id,
    required this.email,
    required this.username,
    this.displayName,
    this.avatarUrl,
    required this.isActive,
    required this.role,
    required this.createdAt,
  });

  bool get isAdmin => role.name == 'ADMIN';
  bool get isGestor => role.name == 'GESTOR';
  bool get isPlayer => role.name == 'PLAYER';
  bool get canCreateGroups => isAdmin || isGestor;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String,
      username: json['username'] as String,
      displayName: json['display_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      role: Role.fromJson(json['role'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'username': username,
    'display_name': displayName,
    'avatar_url': avatarUrl,
    'is_active': isActive,
    'role': role.toJson(),
    'created_at': createdAt.toIso8601String(),
  };
}

class TokenResponse {
  final String accessToken;
  final String tokenType;
  final int expiresIn;

  TokenResponse({
    required this.accessToken,
    this.tokenType = 'bearer',
    required this.expiresIn,
  });

  factory TokenResponse.fromJson(Map<String, dynamic> json) {
    return TokenResponse(
      accessToken: json['access_token'] as String,
      tokenType: json['token_type'] as String? ?? 'bearer',
      expiresIn: json['expires_in'] as int,
    );
  }
}

class AccountStats {
  final int gamesPlayed;
  final int wins;
  final int losses;
  final double winRate;
  final int totalPlayMinutes;
  final int uniqueGames;
  final int experience;
  final int level;
  final int experienceInLevel;
  final int experienceToNextLevel;

  const AccountStats({
    required this.gamesPlayed,
    required this.wins,
    required this.losses,
    required this.winRate,
    required this.totalPlayMinutes,
    required this.uniqueGames,
    required this.experience,
    required this.level,
    required this.experienceInLevel,
    required this.experienceToNextLevel,
  });

  factory AccountStats.fromJson(Map<String, dynamic> json) {
    return AccountStats(
      gamesPlayed: json['games_played'] as int? ?? 0,
      wins: json['wins'] as int? ?? 0,
      losses: json['losses'] as int? ?? 0,
      winRate: (json['win_rate'] as num? ?? 0).toDouble(),
      totalPlayMinutes: json['total_play_minutes'] as int? ?? 0,
      uniqueGames: json['unique_games'] as int? ?? 0,
      experience: json['experience'] as int? ?? 0,
      level: json['level'] as int? ?? 1,
      experienceInLevel: json['experience_in_level'] as int? ?? 0,
      experienceToNextLevel: json['experience_to_next_level'] as int? ?? 500,
    );
  }
}
