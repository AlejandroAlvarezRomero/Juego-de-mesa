import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, extractErrorMessage } from '../api/client';
import { endpoints } from '../api/endpoints';
import type { Game, Member } from '../api/types';
import UserAvatar from '../components/UserAvatar';
import { ErrorAlert, LoadingBlock } from '../components/ui';

function playersSpan(game: Game): string {
  if (game.min_players != null && game.max_players != null) {
    return game.min_players === game.max_players
      ? `${game.min_players} jug.`
      : `${game.min_players}-${game.max_players} jug.`;
  }
  return '';
}

export default function RegisterMatchPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const id = Number(groupId);
  const navigate = useNavigate();

  const [games, setGames] = useState<Game[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gameId, setGameId] = useState<number | null>(null);
  const [participantIds, setParticipantIds] = useState<number[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [gamesRes, membersRes] = await Promise.all([
        api.get<Game[]>(endpoints.groupGames(id)),
        api.get<Member[]>(endpoints.groupMembers(id)),
      ]);
      setGames(gamesRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar los datos del grupo'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedMembers = useMemo(
    () => members.filter((m) => participantIds.includes(m.user_id)),
    [members, participantIds],
  );

  const toggleParticipant = (userId: number) => {
    setParticipantIds((prev) => {
      if (prev.includes(userId)) {
        setWinnerId((current) => (current === userId ? null : current));
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!gameId) {
      setError('Selecciona el juego de la partida.');
      return;
    }
    if (participantIds.length < 2) {
      setError('Deben participar al menos 2 jugadores.');
      return;
    }
    if (!winnerId) {
      setError('Selecciona quién ganó la partida.');
      return;
    }

    setBusy(true);
    try {
      const response = await api.post<{ id: number }>(endpoints.groupMatches(id), {
        game_id: gameId,
        winner_id: winnerId,
        participant_ids: participantIds,
        duration_minutes: duration ? Number(duration) : null,
        notes: notes.trim() || null,
      });
      navigate(`/groups/${id}/matches/${response.data.id}`);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo registrar la partida'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock label="Cargando formulario..." />;

  return (
    <>
      <h1 className="page-title">Registrar partida</h1>
      <p className="page-subtitle">
        La partida quedará <strong>pendiente</strong> hasta que el resto de
        participantes confirme el resultado.
      </p>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={submit}>
        <div className="card">
          <h2 className="section-title">1. Selecciona el juego</h2>
          {games.length === 0 ? (
            <div className="alert warning">
              No hay juegos en este grupo. El gestor debe añadir juegos al catálogo antes
              de registrar partidas.
            </div>
          ) : (
            <div className="field">
              <select
                className="select"
                value={gameId ?? ''}
                onChange={(e) => setGameId(Number(e.target.value))}
                required
              >
                <option value="">Elige un juego</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name} ({playersSpan(game) || '?'} jug.)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">2. Participantes (mínimo 2)</h2>
          <div className="list">
            {members.map((member) => {
              const checked = participantIds.includes(member.user_id);
              return (
                <label
                  key={member.user_id}
                  className="list-row"
                  style={{ cursor: 'pointer', gap: 12 }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleParticipant(member.user_id)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <UserAvatar
                    avatarUrl={member.avatar_url}
                    name={member.display_name ?? member.username}
                    size={34}
                  />
                  <div className="grow">
                    <p className="row-title">
                      {member.display_name ?? member.username}
                    </p>
                    <p className="row-subtitle">@{member.username}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">3. Ganador de la partida</h2>
          {selectedMembers.length === 0 ? (
            <p className="muted">Selecciona primero a los participantes.</p>
          ) : (
            <div className="field">
              <select
                className="select"
                value={winnerId ?? ''}
                onChange={(e) => setWinnerId(Number(e.target.value))}
                required
              >
                <option value="">Elige al ganador</option>
                {selectedMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.display_name ?? member.username}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">4. Detalles opcionales</h2>
          <div className="field">
            <label htmlFor="duration">Duración en minutos</label>
            <input
              id="duration"
              type="number"
              className="input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
              max={1440}
              placeholder="45"
            />
          </div>
          <div className="field">
            <label htmlFor="notes">Notas o comentarios</label>
            <textarea
              id="notes"
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              placeholder="Duelo final muy reñido..."
            />
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(`/groups/${id}`)}
          >
            Cancelar
          </button>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Registrando...' : 'Registrar partida'}
          </button>
        </div>
      </form>
    </>
  );
}
