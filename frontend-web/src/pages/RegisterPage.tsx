import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ErrorAlert } from '../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setBusy(true);
    try {
      await register(email.trim(), username.trim(), password);
      navigate('/groups', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo crear la cuenta'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="text-center mb">
          <h1 className="page-title">Crear cuenta</h1>
          <p className="muted">Regístrate para unirte a tus grupos de juegos</p>
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
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="solo letras, números, punto y guion bajo"
              pattern="[a-zA-Z0-9_.]{3,50}"
              title="Entre 3 y 50 caracteres: letras, números, punto o guion bajo"
              autoComplete="username"
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
              placeholder="mínimo 8 caracteres"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
            <p className="hint">
              Entre 8 y 72 caracteres. Se almacena cifrada con bcrypt (nunca en
              texto plano).
            </p>
          </div>

          <div className="field">
            <label htmlFor="confirm">Repite la contraseña</label>
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
            {busy ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt text-center text-sm muted">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
