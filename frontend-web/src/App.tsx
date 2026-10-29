import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import { LoadingBlock } from './components/ui';
import AchievementsPage from './pages/AchievementsPage';
import GroupsPage from './pages/GroupsPage';
import LoginPage from './pages/LoginPage';
import MatchDetailPage from './pages/MatchDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import RegisterMatchPage from './pages/RegisterMatchPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import GroupDetailPage from './pages/group/GroupDetailPage';
import './styles.css';

function ProtectedRoutes() {
  const { status } = useAuth();

  if (status === 'initial' || status === 'loading') {
    return <LoadingBlock label="Verificando sesión..." />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === 'initial' || status === 'loading') {
    return <LoadingBlock label="Cargando..." />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/groups" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicOnlyRoute>
                <ResetPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/* Rutas protegidas dentro del Layout */}
          <Route element={<ProtectedRoutes />}>
            <Route index element={<Navigate to="/groups" replace />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/groups/:groupId/matches/new" element={<RegisterMatchPage />} />
            <Route path="/groups/:groupId/matches/:matchId" element={<MatchDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/groups" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
