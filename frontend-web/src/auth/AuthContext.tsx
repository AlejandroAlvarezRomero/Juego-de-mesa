import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setSessionExpiredHandler } from '../api/client';
import { endpoints } from '../api/endpoints';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../api/tokenStorage';
import type { TokenResponse, User } from '../api/types';

export type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  isAdmin: boolean;
  isGestor: boolean;
  canCreateGroups: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initial');
  const [user, setUser] = useState<User | null>(null);

  const loadCurrentUser = useCallback(async (): Promise<User | null> => {
    const response = await api.get<User>(endpoints.me);
    return response.data;
  }, []);

  // Al montar, comprobamos si hay una sesión activa (access token + cookie).
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!getAccessToken()) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      try {
        const current = await loadCurrentUser();
        if (!cancelled) {
          setUser(current);
          setStatus('authenticated');
        }
      } catch {
        clearAccessToken();
        if (!cancelled) setStatus('unauthenticated');
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadCurrentUser]);

  // Si el cliente HTTP detecta que la sesión caducó, la reflejamos en el estado.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setStatus('loading');
    try {
      const response = await api.post<TokenResponse>(endpoints.login, {
        email,
        password,
      });
      saveAccessToken(response.data.access_token);
      const current = await loadCurrentUser();
      setUser(current);
      setStatus('authenticated');
    } catch (error) {
      clearAccessToken();
      setUser(null);
      setStatus('unauthenticated');
      throw error;
    }
  }, [loadCurrentUser]);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      setStatus('loading');
      try {
        await api.post(endpoints.register, { email, username, password });
        await login(email, password);
      } catch (error) {
        setStatus('unauthenticated');
        throw error;
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await api.post(endpoints.logout);
    } catch {
      /* la cookie puede no existir: se limpia igualmente */
    }
    clearAccessToken();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    const current = await loadCurrentUser();
    setUser(current);
  }, [loadCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      register,
      logout,
      refreshUser,
      setUser,
      isAdmin: user?.role?.name === 'ADMIN',
      isGestor: user?.role?.name === 'GESTOR',
      canCreateGroups: user?.role?.name === 'ADMIN' || user?.role?.name === 'GESTOR',
    }),
    [status, user, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
