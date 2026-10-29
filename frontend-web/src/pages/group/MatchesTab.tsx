import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractErrorMessage } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Match } from '../../api/types';
import { EmptyState, ErrorAlert, LoadingBlock, formatDateTime } from '../../components/ui';

const STATUS_META: Record<string, { label: string; className: string; icon: string }> = {
  PENDING: { label: 'Pendiente', className: 'pending', icon: '⏳' },
  CONFIRMED: { label: 'Confirmada', className: 'confirmed', icon: '🏆' },
  REJECTED: { label: 'Rechazada', className: 'rejected', icon: '❌' },
  CANCELLED: { label: 'Anulada', className: 'cancelled', icon: '🚫' },
};

export default function MatchesTab({
  groupId,
  onChanged: _onChanged,
}: {
  groupId: number;
  onChanged?: () => void;
}) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Match[]>(endpoints.groupMatches(groupId));
      setMatches(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar las partidas'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingBlock label="Cargando partidas..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <>
      <div className="row between mb">
        <h2 className="section-title" style={{ margin: 0 }}>
          Partidas registradas
        </h2>
        <button
          type="button"
          className="btn"
          onClick={() => navigate(`/groups/${groupId}/matches/new`)}
        >
          + Nueva partida
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🕹️"
            title="No hay partidas registradas aún"
            description="Registra la primera partida del grupo para empezar a contabilizar el ELO."
            action={
              <button
                type="button"
                className="btn"
                onClick={() => navigate(`/groups/${groupId}/matches/new`)}
              >
                Registrar primera partida
              </button>
            }
          />
        </div>
      ) : (
        <div className="list">
          {matches.map((match) => {
            const meta = STATUS_META[match.status] ?? STATUS_META.PENDING;
            const winner = match.participants.find((p) => p.user_id === match.winner_id);
            return (
              <div
                key={match.id}
                className="list-row clickable"
                onClick={() => navigate(`/groups/${groupId}/matches/${match.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/groups/${groupId}/matches/${match.id}`);
                }}
              >
                <span style={{ fontSize: 26, width: 38, textAlign: 'center' }}>
                  {meta.icon}
                </span>
                <div className="grow">
                  <div className="row" style={{ gap: 8 }}>
                    <p className="row-title">
                      {match.game_name ?? `Partida #${match.id}`}
                    </p>
                    <span className={`badge ${meta.className}`}>{match.status}</span>
                  </div>
                  <p className="row-subtitle">
                    Ganador: {winner?.display_name ?? winner?.username ?? `#${match.winner_id}`}
                    {' • '}
                    {formatDateTime(match.played_at)}
                  </p>
                </div>
                <span className="muted">›</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
