/**
 * Contratos de datos de la API (mapean 1:1 con los schemas Pydantic del backend).
 */

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  role: Role;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export type GlobalRole = 'ADMIN' | 'GESTOR' | 'PLAYER';
export type GroupRole = 'MANAGER' | 'MEMBER';
export type MatchStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
export type Rank =
  | 'HIERRO'
  | 'BRONCE'
  | 'PLATA'
  | 'ORO'
  | 'PLATINO'
  | 'DIAMANTE';

export interface Group {
  id: number;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: number;
  created_at: string;
  my_role: string | null;
  member_count: number;
  game_count: number;
}

export interface Member {
  user_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

export interface Season {
  id: number;
  number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Game {
  id: number;
  group_id: number;
  bgg_id: number | null;
  name: string;
  description: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  min_players: number | null;
  max_players: number | null;
  avg_playtime_minutes: number | null;
  year_published: number | null;
  bgg_ranking: number | null;
  bgg_rating: number | null;
  created_at: string;
}

export interface BggSearchResult {
  bgg_id: number;
  name: string;
  year_published: number | null;
}

export interface Participant {
  user_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  placement: number | null;
  elo_delta: number | null;
}

export interface Confirmation {
  user_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  /** null = todavía no ha respondido */
  confirmed: boolean | null;
  responded_at: string | null;
}

export interface Match {
  id: number;
  group_id: number;
  game_id: number;
  game_name: string | null;
  season_id: number;
  registered_by_id: number;
  winner_id: number;
  status: MatchStatus;
  played_at: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  verified_at: string | null;
  participants: Participant[];
  confirmations: Confirmation[];
}

export interface GroupStats {
  user_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo: number;
  rank: Rank;
  wins: number;
  losses: number;
  games_played: number;
  win_rate: number;
  total_play_minutes: number;
}

export interface Leaderboard {
  season: Season;
  entries: GroupStats[];
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

export interface UserAchievement {
  achievement: Achievement;
  group_id: number | null;
  unlocked_at: string;
}

export interface PlatformOverview {
  users: number;
  groups: number;
  matches_pending: number;
  matches_confirmed: number;
}
