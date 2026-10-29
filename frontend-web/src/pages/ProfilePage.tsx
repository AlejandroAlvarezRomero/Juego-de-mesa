import { useState, type FormEvent } from 'react';
import { api, extractErrorMessage } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { ErrorAlert } from '../components/ui';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const roleName = user.role.name;
  const isGestor = roleName === 'GESTOR';
  const isAdmin = roleName === 'ADMIN';

  const roleBadgeColor = isAdmin
    ? '#a855f7'
    : isGestor
    ? '#f59e0b'
    : '#3b82f6';

  const roleTitle = isAdmin
    ? 'ADMINISTRADOR GLOBAL'
    : isGestor
    ? 'GESTOR DE PLATAFORMA'
    : 'CLIENTE / JUGADOR';

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      await api.patch(endpoints.me, {
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo actualizar el perfil'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="page-title">Mi Perfil</h1>
      <p className="muted mb">Información de tu cuenta y rol de usuario en la plataforma.</p>

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="card mb" style={{ borderLeft: '4px solid var(--success)', padding: 12 }}>
          ✓ Perfil actualizado correctamente.
        </div>
      )}

      <div className="card mb">
        <div className="row" style={{ gap: 18, alignItems: 'center' }}>
          <UserAvatar
            avatarUrl={user.avatar_url}
            name={user.display_name ?? user.username}
            size={72}
          />
          <div className="grow">
            <h2 style={{ margin: 0, fontSize: 20 }}>
              {user.display_name || user.username}
            </h2>
            <p className="muted" style={{ margin: '2px 0 8px 0', fontSize: 14 }}>
              @{user.username} • {user.email}
            </p>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 'bold',
                fontSize: 12,
                border: `1px solid ${roleBadgeColor}`,
                color: roleBadgeColor,
                background: 'rgba(0,0,0,0.25)',
              }}
            >
              ROL: {roleTitle}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 13 }} className="muted">
          {isAdmin && (
            <p>👑 Cuentas con permisos de Administrador Global: acceso a paneles, moderación y mantenimiento.</p>
          )}
          {isGestor && (
            <p>🛡️ Cuentas con rol de Gestor: puedes crear y administrar grupos, precargar juegos y moderar partidas.</p>
          )}
          {!isAdmin && !isGestor && (
            <p>🎮 Cuentas con rol de Cliente/Jugador: puedes unirte a grupos mediante código de invitación y registrar partidas.</p>
          )}
        </div>
      </div>

      <div className="card mb">
        <h3 style={{ marginTop: 0 }}>Actualizar Datos</h3>
        <form onSubmit={submitProfile}>
          <div className="field">
            <label htmlFor="display-name">Nombre visible</label>
            <input
              id="display-name"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej. Ana Jugadora"
              maxLength={100}
            />
          </div>

          <div className="field">
            <label htmlFor="avatar-url">URL del avatar / foto</label>
            <input
              id="avatar-url"
              className="input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://ejemplo.com/avatar.png"
              maxLength={500}
            />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
        <button
          type="button"
          className="btn secondary danger"
          onClick={() => void logout()}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
