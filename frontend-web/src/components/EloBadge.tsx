import type { Rank } from '../api/types';

interface EloBadgeProps {
  elo: number;
  rank: string;
  compact?: boolean;
}

/** Colores por rango (idénticos a AppColors.forRank del frontend Flutter). */
const RANK_COLORS: Record<string, string> = {
  HIERRO: '#71717a',
  BRONCE: '#b45309',
  PLATA: '#94a3b8',
  ORO: '#eab308',
  PLATINO: '#06b6d4',
  DIAMANTE: '#8b5cf6',
};

export function rankColor(rank: string): string {
  return RANK_COLORS[rank?.toUpperCase()] ?? '#6366f1';
}

/**
 * Distintivo de ELO con el color del rango.
 * Replica el widget `EloBadge` de la app Flutter.
 */
export default function EloBadge({ elo, rank, compact = false }: EloBadgeProps) {
  const color = rankColor(rank);

  if (compact) {
    return (
      <span
        className="badge"
        style={{
          background: `${color}2e`,
          border: `1px solid ${color}66`,
          color,
          fontSize: 12,
          letterSpacing: 0,
        }}
      >
        <span aria-hidden>🛡️</span>
        {elo}
      </span>
    );
  }

  return (
    <span
      className="badge"
      style={{
        background: `${color}26`,
        border: `1px solid ${color}80`,
        color,
        fontSize: 13,
      }}
    >
      <span aria-hidden>🏅</span>
      {rank.toUpperCase()}
      <span
        style={{
          background: `${color}33`,
          borderRadius: 6,
          padding: '2px 6px',
          fontSize: 12,
        }}
      >
        {elo} ELO
      </span>
    </span>
  );
}

export function rankLabel(rank: Rank | string): string {
  const names: Record<string, string> = {
    HIERRO: 'Hierro',
    BRONCE: 'Bronce',
    PLATA: 'Plata',
    ORO: 'Oro',
    PLATINO: 'Platino',
    DIAMANTE: 'Diamante',
  };
  return names[rank?.toUpperCase()] ?? rank;
}
