/// Centraliza las rutas de la API y la URL base.
///
/// La URL base es configurable en tiempo de compilación con `--dart-define`:
///
/// ```bash
/// # Web servida por nginx (mismo origen -> proxy /api/):
/// flutter build web --dart-define=API_BASE_URL=/api/v1
///
/// # Móvil apuntando a una IP de la red local:
/// flutter build apk --dart-define=API_BASE_URL=http://192.168.1.50:8000/api/v1
/// ```
///
/// Si no se define, se usa el backend local por defecto.
class ApiEndpoints {
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _defaultBaseUrl = 'http://localhost:8000/api/v1';

  /// Prefijo del backend (`/api/v1`) usado para derivar el origen.
  static const String _apiMarker = '/api/v1';

  /// URL base de la API (con sufijo `/api/v1`).
  static String get baseUrl =>
      _definedBaseUrl.isNotEmpty ? _definedBaseUrl : _defaultBaseUrl;

  /// Origen del servidor sin el prefijo `/api/v1`.
  /// - `http://localhost:8000/api/v1` -> `http://localhost:8000`
  /// - `/api/v1` (mismo origen)          -> `` (vacío)
  static String get originUrl {
    final base = baseUrl;
    final idx = base.indexOf(_apiMarker);
    if (idx >= 0) return base.substring(0, idx);
    return base;
  }

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String accountStats = '/auth/me/stats';
  static const String avatar = '/auth/avatar';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Groups
  static const String groups = '/groups';
  static const String joinGroup = '/groups/join';
  static String groupDetail(int groupId) => '/groups/$groupId';
  static String groupMembers(int groupId) => '/groups/$groupId/members';
  static String groupMember(int groupId, int userId) =>
      '/groups/$groupId/members/$userId';
  static String leaveGroup(int groupId) => '/groups/$groupId/leave';
  static String transferOwnership(int groupId) =>
      '/groups/$groupId/transfer-ownership';

  // Games
  static String groupGames(int groupId) => '/groups/$groupId/games';
  static String groupGame(int groupId, int gameId) =>
      '/groups/$groupId/games/$gameId';
  static String searchBgg(int groupId) => '/groups/$groupId/games/search';
  static String seedPopularGames(int groupId) =>
      '/groups/$groupId/games/seed-popular';

  // Matches
  static String groupMatches(int groupId) => '/groups/$groupId/matches';
  static String groupMatch(int groupId, int matchId) =>
      '/groups/$groupId/matches/$matchId';
  static String confirmMatch(int groupId, int matchId) =>
      '/groups/$groupId/matches/$matchId/confirm';
  static String rejectMatch(int groupId, int matchId) =>
      '/groups/$groupId/matches/$matchId/reject';
  static String cancelMatch(int groupId, int matchId) =>
      '/groups/$groupId/matches/$matchId/cancel';

  // Seasons
  static String groupSeasons(int groupId) => '/groups/$groupId/seasons';
  static String seasonRollover(int groupId) =>
      '/groups/$groupId/seasons/rollover';

  // Stats
  static String leaderboard(int groupId) => '/groups/$groupId/leaderboard';
  static String gameLeaderboard(int groupId, int gameId) =>
      '/groups/$groupId/games/$gameId/leaderboard';
  static String myStats(int groupId) => '/groups/$groupId/stats/me';
  static String userStats(int groupId, int userId) =>
      '/groups/$groupId/stats/users/$userId';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationStream = '/notifications/stream';
  static String markNotificationRead(int id) => '/notifications/$id/read';
  static const String markAllNotificationsRead = '/notifications/read-all';

  // Achievements
  static const String achievements = '/achievements';
  static const String myAchievements = '/users/me/achievements';

  /// Resuelve una URL relativa del backend (p.ej. `/uploads/avatars/x.png`)
  /// a una URL absoluta, sea el backend local o el mismo origen (nginx).
  static String resolveUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final origin = originUrl;
    return path.startsWith('/') ? '$origin$path' : '$origin/$path';
  }
}
