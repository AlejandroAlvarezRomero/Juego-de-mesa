import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import UserAvatar from './UserAvatar';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/groups" className="app-brand">
          <span className="logo" aria-hidden>
            🎲
          </span>
          Board Game Tracker
        </NavLink>

        <nav className="app-nav">
          <NavLink
            to="/groups"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Grupos
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Notificaciones
          </NavLink>
          <NavLink
            to="/achievements"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Logros
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              Administración
            </NavLink>
          )}
        </nav>

        <NavLink
          to="/profile"
          className="row"
          style={{ gap: 10, textDecoration: 'none' }}
        >
          <UserAvatar
            avatarUrl={user?.avatar_url}
            name={user?.display_name ?? user?.username ?? '?'}
            size={34}
          />
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            {user?.display_name ?? user?.username}
          </span>
        </NavLink>

        <button type="button" className="btn secondary small" onClick={handleLogout}>
          Salir
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        Board Game Tracker · API FastAPI + JWT · Frontend React
      </footer>
    </div>
  );
}
