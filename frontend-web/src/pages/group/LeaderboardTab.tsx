import { useCallback, useEffect, useState } from 'react';
import { api, extractErrorMessage } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Leaderboard } from '../../api/types';
import EloBadge from '../../components/EloBadge';
import UserAvatar from '../../components/UserAvatar';
import Modal from '../../components/Modal';
import { EmptyState, ErrorAlert, LoadingBlock, formatDate } from '../../components/ui';

export default function LeaderboardTab({
  groupId,
  isManager,
}: {
  groupId: number;
  isManager: boolean;
}) {
  const [data, setData] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Leaderboard>(endpoints.leaderboard(groupId));
      setData(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cargar la clasificación'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rollover = async () => {
    setBusy(true);
    try {
      await api.post(endpoints.seasonRollover(groupId));
      setConfirmOpen(false);
      setNotice('¡Nueva temporada iniciada con éxito!');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cerrar la temporada'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock label="Cargando clasificación..." />;
  if (error && !data) return <ErrorAlert message={error} />;
  if (!data) return null;

  return (
    <>
      {notice && <div className="alert success">{notice}</div>}
      {error && <ErrorAlert message={error} />}

      <div className="card row between" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            {data.season.name}
          </h2>
          <p className="row-subtitle">
            Finaliza: {formatDate(data.season.end_date)}
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => setConfirmOpen(true)}
          >
            🔄 Cerrar temporada
          </button>
        )}
      </div>

      {data.entries.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🏁"
            title="Aún no hay puntuaciones en esta temporada"
            description="Las posiciones aparecerán cuando se confirmen las primeras partidas."
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 6 }}>
          {data.entries.map((entry, index) => {
            const position = index + 1;
            return (
              <div
                key={entry.user_id}
                className="list-row"
                style={{ border: 'none', background: 'transparent' }}
              >
                <span className={`position p${position}`}>{position}</span>
                <UserAvatar
                  avatarUrl={entry.avatar_url}
                  name={entry.display_name ?? entry.username}
                  size={36}
                />
                <div className="grow">
                  <p className="row-title">
                    {entry.display_name ?? entry.username}
                  </p>
                  <p className="row-subtitle">
                    {entry.wins}V / {entry.losses}D ({entry.win_rate.toFixed(0)}%) •{' '}
                    {entry.games_played} partidas
                  </p>
                </div>
                <EloBadge elo={entry.elo} rank={entry.rank} compact />
              </div>
            );
          })}
        </div>
      )}

      {confirmOpen && (
        <Modal
          title="Iniciar nueva temporada"
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                onClick={rollover}
                disabled={busy}
              >
                {busy ? 'Cerrando...' : 'Confirmar rollover'}
              </button>
            </>
          }
        >
          <p>
            Al cerrar la temporada actual, se guardará el histórico y se aplicará un{' '}
            <strong>soft reset del 50%</strong> al ELO de todos los jugadores hacia la
            media (1200). ¿Deseas continuar?
          </p>
        </Modal>
      )}
    </>
  );
}
