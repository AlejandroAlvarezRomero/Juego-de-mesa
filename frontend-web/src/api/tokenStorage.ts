/**
 * Almacén del Access Token.
 *
 * El Refresh Token NO se guarda aquí: viaja en una cookie `HttpOnly` que el
 * navegador no permite leer desde JavaScript (solo el backend puede).
 *
 * Nota de seguridad: el Access Token se persiste en `localStorage` para que
 * la sesión sobreviva a un reinicio del navegador. Esto implica que un
 * XSS podría leerlo; la mitigación real es el refresh token `HttpOnly` +
 * rotación con detección de reuso (ver backend/app/api/v1/auth.py).
 */
const ACCESS_TOKEN_KEY = 'bgt_access_token';

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveAccessToken(token: string): void {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    /* almacenamiento no disponible (modo privado): la sesión durará lo que la pestaña */
  }
}

export function clearAccessToken(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* noop */
  }
}
