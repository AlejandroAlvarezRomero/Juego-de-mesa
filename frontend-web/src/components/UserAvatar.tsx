import { useState } from 'react';
import { resolveUrl } from '../api/endpoints';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: number;
}

/** Paleta determinista para las iniciales (fallback cuando no hay foto). */
const PALETTE = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  const clean = name.trim();
  if (!clean) return '?';
  const parts = clean.split(/[\s_.-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Avatar con carga remota, fallback a iniciales y color determinista.
 * Replica el widget `UserAvatar` de la app Flutter.
 */
export default function UserAvatar({
  avatarUrl,
  name,
  size = 40,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveUrl(avatarUrl);

  if (!resolved || failed) {
    return (
      <span
        className="avatar"
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.4),
          background: PALETTE[hashName(name) % PALETTE.length],
        }}
        title={name}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <img
        src={resolved}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
