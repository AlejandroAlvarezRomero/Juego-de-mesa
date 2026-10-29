import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, extractErrorMessage } from '../api/client';
import { endpoints } from '../api/endpoints';
import { ErrorAlert } from '../components/ui';

/**
 * Recuperación de contraseña en dos pasos:
 *  1) se solicita el token (el backend lo devuelve en el.body en desarrollo)
 *  2) se usa ese token para fijar la nueva contraseña.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialToken =
    searchParams.get('token') ??
    (location.state as { token?: string } | null)?.token ??
    '';
  const notice = (location.state as { message?: string } | null)?.message;

  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(notice ?? null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'request' | 'reset'>(initialToken ? 'reset' : 'request');

  const requestToken = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const response = await api.post<{ message: string; reset_token?: string }>(
        endpoints.forgotPassword,
        { email: email.trim() },
      );
      setInfo(response.data.message);
      if (response.data.reset_token) {
        setToken(response.data.reset_token);
        setStep('reset');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo solicitar el restablecimiento'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setBusy(true);
    try {
      await api.post(endpoints.resetPassword, {
        token: token.trim(),
        new_password: newPassword,
      });
      navigate('/login', { replace: true, state: { reset: true } });
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo restablecer la contraseña'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <h1 className="page-title">Restablecer contraseña</h1>
        <p className="muted">
          {step === 'request'
            ? 'Indica tu correo y te enviaremos las instrucciones.'
            : 'Introduce el token recibido y la nueva contraseña.'}
        </p>

        {error && <ErrorAlert message={error} />}
        {info && <div className="alert info">{info}</div>}

        {step === 'request' ? (
          <form onSubmit={requestToken}>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <button type="submit" className="btn block" disabled={busy}>
              {busy ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="token">Token de restablecimiento</label>
              <input
                id="token"
                className="input mono text-sm"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm">Repite la nueva contraseña</label>
              <input
                id="confirm"
                type="password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="btn block" disabled={busy}>
              {busy ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
            <div className="mt text-center">
              <button
                type="button"
                className="btn secondary small"
                onClick={() => setStep('request')}
              >
                Solicitar otro token
              </button>
            </div>
          </form>
        )}

        <p className="mt text-center text-sm muted">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
