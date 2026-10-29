import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, endpoints } from '../api/endpoints';
import { getAccessToken } from '../api/tokenStorage';

/**
 * Suscripción al canal de notificaciones en tiempo real (Server-Sent Events).
 *
 * Por qué `fetch` y no `EventSource`: `EventSource` no permite añadir la
 * cabecera `Authorization: Bearer`, y el endpoint `/notifications/stream`
 * exige un Access Token válido. Con `fetch` + `ReadableStream` sí podemos
 * enviar la cabecera y leer el flujo de eventos correctamente.
 *
 * Formato que emite el backend:
 *   event: connected
 *   data: {"status": "connected", "user_id": 1}
 *
 *   event: notification
 *   data: {...}
 */
export function useNotificationStream(onNotification: () => void): boolean {
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const controller = new AbortController();
    let stopped = false;

    const connect = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoints.notificationStream}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`El canal devolvió ${response.status}`);
        }

        setIsLive(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Los eventos SSE se separan con una línea en blanco.
          let separator = buffer.indexOf('\n\n');
          while (separator !== -1) {
            const chunk = buffer.slice(0, separator);
            buffer = buffer.slice(separator + 2);

            if (chunk.includes('event: notification')) {
              callbackRef.current();
            }
            separator = buffer.indexOf('\n\n');
          }
        }
      } catch {
        // Red caída o abortado: se reintenta con backoff mientras siga montado.
      } finally {
        setIsLive(false);
      }

      if (!stopped) {
        window.setTimeout(connect, 5000);
      }
    };

    void connect();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, []);

  return isLive;
}
