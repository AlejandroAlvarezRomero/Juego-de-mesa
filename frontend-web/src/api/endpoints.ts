/**
 * Rutas de la API y resolución de URLs.
 *
 * La URL base es configurable en tiempo de build:
 *   VITE_API_BASE_URL=/api/v1          (producción: mismo origen tras nginx)
 *   VITE_API_BASE_URL=http://localhost:8000/api/v1   (desarrollo)
 */
const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1';

const API_MARKER = '/api/v1';

export const API_BASE_URL = RAW_BASE_URL || DEFAULT_BASE_URL;

/** Origen del servidor sin el prefijo `/api/v1`. */
export function originUrl(): string {
  const idx = API_BASE_URL.indexOf(API_MARKER);
  return idx >= 0 ? API_BASE_URL.slice(0, idx) : API_BASE_URL;
}

/** Resuelve una URL relativa del backend (p.ej. `/uploads/avatars/x.png`). */
export function resolveUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin = originUrl();
  return path.startsWith('/') ? `${origin}${path}` : `${origin}/${path}`;
}

export const endpoints = {
  // Auth
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
  avatar: '/auth/avatar',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',

  // Grupos
  groups: '/groups',
  joinGroup: '/groups/join',
  groupDetail: (id: number) => `/groups/${id}`,
  groupMembers: (id: number) => `/groups/${id}/members`,
  groupMember: (groupId: number, userId: number) =>
    `/groups/${groupId}/members/${userId}`,
  leaveGroup: (id: number) => `/groups/${id}/leave`,
  transferOwnership: (id: number) => `/groups/${id}/transfer-ownership`,

  // Juegos
  groupGames: (id: number) => `/groups/${id}/games`,
  groupGame: (groupId: number, gameId: number) =>
    `/groups/${groupId}/games/${gameId}`,
  searchBgg: (id: number) => `/groups/${id}/games/search`,
  seedPopularGames: (id: number) => `/groups/${id}/games/seed-popular`,

  // Partidas
  groupMatches: (id: number) => `/groups/${id}/matches`,
  groupMatch: (groupId: number, matchId: number) =>
    `/groups/${groupId}/matches/${matchId}`,
  confirmMatch: (groupId: number, matchId: number) =>
    `/groups/${groupId}/matches/${matchId}/confirm`,
  rejectMatch: (groupId: number, matchId: number) =>
    `/groups/${groupId}/matches/${matchId}/reject`,
  cancelMatch: (groupId: number, matchId: number) =>
    `/groups/${groupId}/matches/${matchId}/cancel`,

  // Temporadas
  groupSeasons: (id: number) => `/groups/${id}/seasons`,
  seasonRollover: (id: number) => `/groups/${id}/seasons/rollover`,

  // Estadísticas
  leaderboard: (id: number) => `/groups/${id}/leaderboard`,
  myStats: (id: number) => `/groups/${id}/stats/me`,
  userStats: (groupId: number, userId: number) =>
    `/groups/${groupId}/stats/users/${userId}`,

  // Notificaciones
  notifications: '/notifications',
  notificationStream: '/notifications/stream',
  markNotificationRead: (id: number) => `/notifications/${id}/read`,
  markAllNotificationsRead: '/notifications/read-all',

  // Logros
  achievements: '/achievements',
  myAchievements: '/users/me/achievements',

  // Administración
  adminOverview: '/admin/overview',
  adminUsers: '/admin/users',
  adminUser: (id: number) => `/admin/users/${id}`,
} as const;

/** Endpoints públicos: no deben disparar el refresco de token ante un 401. */
const PUBLIC_PATHS: string[] = [
  endpoints.register,
  endpoints.login,
  endpoints.refresh,
  endpoints.forgotPassword,
  endpoints.resetPassword,
];

export function isPublicEndpoint(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path.includes(p));
}
