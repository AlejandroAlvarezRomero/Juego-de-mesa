import { useCallback, useEffect, useRef, useState } from 'react';
import { api, extractErrorMessage } from '../api/client';
import { API_BASE_URL, endpoints } from '../api/endpoints';
import type { AppNotification } from '../api/types';
import { EmptyState, ErrorAlert, LoadingBlock, formatDateTime } from '../components/ui';

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<AppNotification[]>(endpoints.notifications);
      setItems(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar las notificaciones'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Canal SSE en tiempo real (Server-Sent Events).
  useEffect(() => {
    const token = window.localStorage.getItem('bgt_access_token');
    if (!token || typeof EventSource === 'undefined') return;

    // EventSource no admite cabeceras: se pasa el token por query param.
    const url = `${API_BASE_URL}${endpoints.notificationStream}?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url, { withCredentials: true });
    sourceRef.current = source;

    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.onmessage = () => {
      void load();
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setLive(false);
    };
  }, [load]);

  const markRead = async (id: number) => {
    try {
      await api.post(endpoints.markNotificationRead(id));
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const markAllRead = async () => {
    try {
      await api.post(endpoints.markAllNotificationsRead);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (loading) return <LoadingBlock label="Cargando notificaciones..." />;

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="row between mb">
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="muted">
            {unread > 0 ? `${unread} sin leer` : 'Todas leídas'}
            {live && ' · 🟢 canal en vivo activo'}
          </p>
        </div>
        <button
          type="button"
          className="btn secondary"
          onClick={markAllRead}
          disabled={unread === 0}
        >
          Marcar todas como leídas
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🔔"
            title="No tienes notificaciones"
            description="Aquí verás las confirmaciones de partidas, logros desbloqueados y avisos de tus grupos."
          />
        </div>
      ) : (
        <div className="list">
          {items.map((notification) => (
            <div
              key={notification.id}
              className="list-row"
              style={{
                borderLeft: notification.is_read
                  ? '3px solid var(--border)'
                  : '3px solid var(--primary)',
              }}
            >
              <span style={{ fontSize: 22 }} aria-hidden>
                {notification.type === 'MATCH_CONFIRMATION'
                  ? '🎲'
                  : notification.type === 'ACHIEVEMENT_UNLOCKED'
                    ? '🏅'
                    : '🔔'}
              </span>
              <div className="grow">
                <p className="row-title">{notification.title}</p>
                {notification.body && (
                  <p className="row-subtitle">{notification.body}</p>
                )}
                <p className="row-subtitle">{formatDateTime(notification.created_at)}</p>
              </div>
              {!notification.is_read && (
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => markRead(notification.id)}
                >
                  Marcar leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
