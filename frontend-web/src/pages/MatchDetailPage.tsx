import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, extractErrorMessage } from '../api/client';
import { endpoints } from '../api/endpoints';
import type { Match } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { ErrorAlert, LoadingBlock, formatDateTime } from '../components/ui';

const STATUS_META: Record<string, { label: string; className: string; icon: string }> = {
  PENDING: { label: 'Pendiente de confirmación', className: 'pending', icon: '⏳' },
  CONFIRMED: { label: 'Confirmada', className: 'confirmed', icon: '🏆' },
  REJECTED: { label: 'Rechazada', className: 'rejected', icon: '❌' },
  CANCELLED: { label: 'Anulada', className: 'cancelled', icon: '🚫' },
};

export default function MatchDetailPage() {
  const { groupId, matchId } = useParams<{ groupId: string; matchId: string }>();
  const gid = Number(groupId);
  const mid = Number(matchId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Match>(endpoints.groupMatch(gid, mid));
      setMatch(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cargar la partida'));
    } finally {
      setLoading(false);
    }
  }, [gid, mid]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    path: string,
    successMessage: string,
  ) => {
    setBusy(true);
    setError(null);
    try {
      const response = await api.post<Match>(path);
      setMatch(response.data);
      setNotice(successMessage);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo completar la acción'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock label="Cargando partida..." />;
  if (error && !match) return <ErrorAlert message={error} />;
  if (!match) return null;

  const meta = STATUS_META[match.status] ?? STATUS_META.PENDING;
  const winner = match.participants.find((p) => p.user_id === match.winner_id);
  const myConfirmation = match.confirmations.find((c) => c.user_id === user?.id);
  const isRegistrar = match.registered_by_id === user?.id;
  const isManager = match.status === 'PENDING' && !myConfirmation;

  const canRespond =
    match.status === 'PENDING' && !!myConfirmation && myConfirmation.confirmed === null;
  const canCancel = match.status === 'PENDING';

  const confirmedCount = match.confirmations.filter((c) => c.confirmed === true).length;

  return (
    <>
      <button
        type="button"
        className="btn secondary small mb"
        onClick={() => navigate(`/groups/${gid}`)}
      >
        ← Volver al grupo
      </button>

      {notice && <div className="alert success">{notice}</div>}
      {error && <ErrorAlert message={error} />}

      <div className="card">
        <div className="row between wrap">
          <div>
            <h1 className="page-title">{match.game_name ?? `Partida #${match.id}`}</h1>
            <p className="muted">
              {formatDateTime(match.played_at)}
              {match.duration_minutes ? ` · ${match.duration_minutes} min` : ''}
            </p>
          </div>
          <span className={`badge ${meta.className}`}>
            {meta.icon} {meta.label}
          </span>
        </div>

        {match.notes && (
          <p className="mt muted">
            <strong>Notas:</strong> {match.notes}
          </p>
        )}

        <div className="row mt" style={{ gap: 10 }}>
          <span className="muted">Ganador:</span>
          <strong>
            {winner?.display_name ?? winner?.username ?? `#${match.winner_id}`}
          </strong>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Participantes</h2>
        <div className="list">
          {match.participants.map((participant) => (
            <div
              key={participant.user_id}
              className="list-row"
              style={{ border: 'none', background: 'transparent' }}
            >
              <UserAvatar
                avatarUrl={participant.avatar_url}
                name={participant.display_name ?? participant.username}
                size={36}
              />
              <div className="grow">
                <p className="row-title">
                  {participant.display_name ?? participant.username}
                  {participant.user_id === match.winner_id && ' 🏆'}
                </p>
                <p className="row-subtitle">@{participant.username}</p>
              </div>
              {participant.elo_delta != null && (
                <span
                  className="badge"
                  style={{
                    background:
                      participant.elo_delta >= 0
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    color:
                      participant.elo_delta >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {participant.elo_delta >= 0 ? '+' : ''}
                  {participant.elo_delta} ELO
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">
          Confirmaciones ({confirmedCount}/{match.confirmations.length})
        </h2>
        <p className="muted text-sm">
          La partida se consolida cuando el 100% de los participantes confirma el
          resultado. El ELO se aplica en ese momento.
        </p>
        <div className="list mt">
          {match.confirmations.map((confirmation) => (
            <div
              key={confirmation.user_id}
              className="list-row"
              style={{ border: 'none', background: 'transparent' }}
            >
              <UserAvatar
                avatarUrl={confirmation.avatar_url}
                name={confirmation.display_name ?? confirmation.username}
                size={32}
              />
              <div className="grow">
                <p className="row-title">
                  {confirmation.display_name ?? confirmation.username}
                </p>
                <p className="row-subtitle">
                  {confirmation.responded_at
                    ? formatDateTime(confirmation.responded_at)
                    : 'Sin responder'}
                </p>
              </div>
              <span
                className={`badge ${
                  confirmation.confirmed === true
                    ? 'confirmed'
                    : confirmation.confirmed === false
                      ? 'rejected'
                      : 'pending'
                }`}
              >
                {confirmation.confirmed === true
                  ? '✓ Confirmado'
                  : confirmation.confirmed === false
                    ? '✗ Rechazado'
                    : '⏳ Pendiente'}
              </span>
            </div>
          ))}
        </div>

        <div className="row wrap mt gap-lg">
          {canRespond && (
            <>
              <button
                type="button"
                className="btn success"
                disabled={busy}
                onClick={() =>
                  act(
                    endpoints.confirmMatch(gid, mid),
                    'Resultado confirmado. Gracias!',
                  )
                }
              >
                ✓ Confirmar resultado
              </button>
              <button
                type="button"
                className="btn danger"
                disabled={busy}
                onClick={() =>
                  act(
                    endpoints.rejectMatch(gid, mid),
                    'Has rechazado el resultado de la partida.',
                  )
                }
              >
                ✗ Rechazar
              </button>
            </>
          )}

          {isRegistrar && match.status === 'PENDING' && (
            <span className="muted text-sm">
              Registraste esta partida: se da por confirmada automáticamente.
            </span>
          )}

          {!myConfirmation && !isRegistrar && match.status === 'PENDING' && (
            <span className="muted text-sm">
              No formas parte de los participantes de esta partida.
            </span>
          )}

          {canCancel && isManager && (
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={() => {
                if (!window.confirm('¿Anular esta partida?')) return;
                void act(endpoints.cancelMatch(gid, mid), 'Partida anulada.');
              }}
            >
              Anular partida
            </button>
          )}
        </div>
      </div>
    </>
  );
}
