import { useCallback, useEffect, useState } from 'react';
import { api, extractErrorMessage } from '../api/client';
import { endpoints } from '../api/endpoints';
import type { Achievement, UserAchievement } from '../api/types';
import { EmptyState, ErrorAlert, LoadingBlock, formatDateTime } from '../components/ui';

export default function AchievementsPage() {
  const [catalog, setCatalog] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [catRes, myRes] = await Promise.all([
        api.get<Achievement[]>(endpoints.achievements),
        api.get<UserAchievement[]>(endpoints.myAchievements),
      ]);
      setCatalog(catRes.data);
      setUnlocked(myRes.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar los logros'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingBlock label="Cargando vitrina de logros..." />;
  if (error) return <ErrorAlert message={error} />;

  const unlockedCodes = new Set(unlocked.map((u) => u.achievement.code));
  const unlockedMap = new Map(unlocked.map((u) => [u.achievement.code, u.unlocked_at]));

  return (
    <>
      <div className="row between mb">
        <div>
          <h1 className="page-title">Vitrina de Logros</h1>
          <p className="muted">
            Desbloquea insignias ganando partidas, rachas y jugando con amigos.
          </p>
        </div>
        <div className="badge confirmed" style={{ fontSize: 14 }}>
          🏆 {unlocked.length} / {catalog.length} Desbloqueados
        </div>
      </div>

      {catalog.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🎖️"
            title="Sin logros en el catálogo"
            description="No hay insignias configuradas en la plataforma."
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {catalog.map((item) => {
            const isUnlocked = unlockedCodes.has(item.code);
            const dateStr = unlockedMap.get(item.code);
            return (
              <div
                key={item.id}
                className="card"
                style={{
                  opacity: isUnlocked ? 1 : 0.6,
                  borderColor: isUnlocked ? 'var(--primary)' : 'var(--border)',
                  background: isUnlocked ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface)',
                }}
              >
                <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 36 }}>{isUnlocked ? '🎖️' : '🔒'}</span>
                  <div className="grow">
                    <div className="row between">
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>{item.name}</h3>
                      <span className={`badge ${isUnlocked ? 'confirmed' : 'soft'}`}>
                        {isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                      </span>
                    </div>
                    <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {item.description}
                    </p>
                    {isUnlocked && dateStr && (
                      <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>
                        ✓ Obtenido el {formatDateTime(dateStr)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
