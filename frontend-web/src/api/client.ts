import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, endpoints, isPublicEndpoint } from './endpoints';
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from './tokenStorage';

const REFRESHED_FLAG = '_authRetried';

interface RetriableConfig extends InternalAxiosRequestConfig {
  [REFRESHED_FLAG]?: boolean;
}

/** Callback invocado cuando la sesión deja de ser válida. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

/**
 * Cliente HTTP de la API.
 *
 * - `withCredentials: true` es obligatorio: es lo que hace que la cookie
 *   `HttpOnly` del refresh token viaje en las peticiones cross-origin.
 * - Ante un 401 se refresca el token de forma SILENCIOSA y se reintenta la
 *   petición original.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Refresco EN CURSO compartido.
 *
 * El refresh token rota en cada uso (un solo uso). Si varias peticiones
 * reciben un 401 a la vez y cada una lanzase su propio refresco, la segunda
 * invalidaría el token emitido por la primera y la sesión se perdería.
 * Por eso todas las peticiones concurrentes comparten este único `Promise`.
 */
let refreshPromise: Promise<string | null> | null = null;

/** Peticiones en vuelo que esperan al refresco (para no duplicar el trabajo). */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performRefresh(): Promise<string | null> {
  try {
    // Cliente independiente: no pasa por los interceptores (evita recursión).
    const response = await axios.post<{ access_token: string }>(
      `${API_BASE_URL}${endpoints.refresh}`,
      {},
      { withCredentials: true },
    );
    const token = response.data?.access_token;
    if (!token) return null;
    saveAccessToken(token);
    return token;
  } catch {
    return null;
  }
}

// --- Interceptor de petición: añade el Bearer token ---
api.interceptors.request.use((config) => {
  if (!isPublicEndpoint(config.url ?? '')) {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Interceptor de respuesta: refresco silencioso ante 401 ---
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthError =
      status === 401 &&
      original !== undefined &&
      !isPublicEndpoint(url) &&
      original[REFRESHED_FLAG] !== true;

    if (!isAuthError) {
      return Promise.reject(error);
    }

    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearAccessToken();
      onSessionExpired?.();
      return Promise.reject(error);
    }

    try {
      original[REFRESHED_FLAG] = true;
      original.headers.Authorization = `Bearer ${newToken}`;
      return await api.request(original);
    } catch (retryError) {
      return Promise.reject(retryError);
    }
  },
);

/** Extrae un mensaje legible de error del backend (FastAPI devuelve `detail`). */
export function extractErrorMessage(error: unknown, fallback = 'Ha ocurrido un error'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Comprueba que el backend esté en marcha.';
    }
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first && typeof first.msg === 'string') {
        const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : '';
        return field ? `${field}: ${first.msg}` : first.msg;
      }
    }
    const status = error.response.status;
    if (status === 401) return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
    if (status === 403) return 'No tienes permisos para realizar esta acción.';
    if (status === 404) return 'El recurso solicitado no existe.';
    if (status === 409) return 'Conflicto: la operación no se puede completar.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
