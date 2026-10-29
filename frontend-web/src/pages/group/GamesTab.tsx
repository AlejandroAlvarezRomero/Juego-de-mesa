import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, extractErrorMessage } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { BggSearchResult, Game } from '../../api/types';
import Modal from '../../components/Modal';
import { EmptyState, ErrorAlert, LoadingBlock } from '../../components/ui';

function playersSpan(game: Game): string {
  if (game.min_players != null && game.max_players != null) {
    return game.min_players === game.max_players
      ? `${game.min_players} jug.`
      : `${game.min_players}-${game.max_players} jug.`;
  }
  return '';
}

export default function GamesTab({
  groupId,
  isManager,
}: {
  groupId: number;
  isManager: boolean;
}) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BggSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Game[]>(endpoints.groupGames(groupId));
      setGames(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cargar el catálogo'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const seedPopular = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await api.post(endpoints.seedPopularGames(groupId));
      setNotice('Juegos populares precargados con éxito');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron precargar los juegos'));
    } finally {
      setBusy(false);
    }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    setSearching(true);
    setSearchError(null);
    try {
      const response = await api.get<BggSearchResult[]>(endpoints.searchBgg(groupId), {
        params: { query: query.trim() },
      });
      setResults(response.data);
    } catch (err) {
      setSearchError(extractErrorMessage(err, 'Error en la búsqueda en BGG'));
    } finally {
      setSearching(false);
    }
  };

  const addGame = async (bggId: number) => {
    setBusy(true);
    setSearchError(null);
    try {
      await api.post(endpoints.groupGames(groupId), { bgg_id: bggId });
      setShowSearch(false);
      setQuery('');
      setResults([]);
      setNotice('Juego añadido al catálogo');
      await load();
    } catch (err) {
      setSearchError(extractErrorMessage(err, 'No se pudo añadir el juego'));
    } finally {
      setBusy(false);
    }
  };

  const removeGame = async (game: Game) => {
    if (!window.confirm(`¿Eliminar "${game.name}" del catálogo?`)) return;
    try {
      await api.delete(endpoints.groupGame(groupId, game.id));
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo eliminar el juego'));
    }
  };

  if (loading) return <LoadingBlock label="Cargando catálogo..." />;

  return (
    <>
      {notice && <div className="alert success">{notice}</div>}
      {error && <ErrorAlert message={error} />}

      <div className="row between mb">
        <h2 className="section-title" style={{ margin: 0 }}>
          Catálogo de juegos
        </h2>
        {isManager && (
          <div className="row">
            <button
              type="button"
              className="btn secondary"
              onClick={seedPopular}
              disabled={busy}
            >
              ✨ Precargar populares
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSearchError(null);
                setShowSearch(true);
              }}
            >
              🔍 Buscar en BGG
            </button>
          </div>
        )}
      </div>

      {games.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🃏"
            title="El catálogo está vacío"
            description={
              isManager
                ? 'Busca juegos en BoardGameGeek o precarga los más populares.'
                : 'El gestor del grupo todavía no ha añadido juegos.'
            }
            action={
              isManager ? (
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowSearch(true)}
                  >
                    Buscar en BGG
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={seedPopular}
                    disabled={busy}
                  >
                    Precargar populares
                  </button>
                </div>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="list">
          {games.map((game) => (
            <div key={game.id} className="list-row">
              {game.thumbnail_url ? (
                <img
                  className="game-thumb"
                  src={game.thumbnail_url}
                  alt={game.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="game-thumb-placeholder" aria-hidden>
                  🎲
                </div>
              )}
              <div className="grow">
                <p className="row-title">{game.name}</p>
                <p className="row-subtitle">
                  {playersSpan(game) && <span>{playersSpan(game)} · </span>}
                  {game.avg_playtime_minutes != null && (
                    <span>{game.avg_playtime_minutes} min</span>
                  )}
                  {game.bgg_rating != null && (
                    <span> · ⭐ {game.bgg_rating.toFixed(1)}</span>
                  )}
                </p>
              </div>
              {isManager && (
                <button
                  type="button"
                  className="btn danger small"
                  onClick={() => removeGame(game)}
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showSearch && (
        <Modal
          title="Buscar en BoardGameGeek"
          onClose={() => setShowSearch(false)}
          wide
          actions={
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowSearch(false)}
            >
              Cerrar
            </button>
          }
        >
          {searchError && <ErrorAlert message={searchError} />}
          <form onSubmit={search}>
            <div className="field row" style={{ alignItems: 'flex-end' }}>
              <div className="grow">
                <label htmlFor="bgg-query">Juego</label>
                <input
                  id="bgg-query"
                  className="input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="catan"
                />
              </div>
              <button type="submit" className="btn" disabled={searching}>
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>

          {results.length > 0 && (
            <div className="list">
              {results.map((result) => (
                <div key={result.bgg_id} className="list-row">
                  <div className="grow">
                    <p className="row-title">{result.name}</p>
                    <p className="row-subtitle">
                      BGG #{result.bgg_id}
                      {result.year_published ? ` · ${result.year_published}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => addGame(result.bgg_id)}
                    disabled={busy}
                  >
                    Añadir
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
