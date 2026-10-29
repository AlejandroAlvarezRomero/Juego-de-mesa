import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, extractErrorMessage } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { ErrorAlert } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/groups', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Credenciales incorrectas'));
    } finally {
      setBusy(false);
    }
  };

  const requestReset = async () => {
    if (!email.trim()) {
      setError('Introduce tu correo para restablecer la contraseña.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const response = await api.post<{ message: string; reset_token?: string }>(
        endpoints.forgotPassword,
        { email: email.trim() },
      );
      const token = response.data.reset_token;
      navigate(`/reset-password${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
        state: { message: response.data.message },
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo iniciar el proceso de recuperación'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="text-center mb">
          <div style={{ fontSize: 42 }} aria-hidden>
            🎲
          </div>
          <h1 className="page-title">Board Game Tracker</h1>
          <p className="muted">Inicia sesión para gestionar tus partidas</p>
        </div>

        {error && <ErrorAlert message={error} />}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn block" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt text-center text-sm">
          <button
            type="button"
            className="btn secondary small"
            onClick={requestReset}
            disabled={busy}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <p className="mt text-center text-sm muted">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
