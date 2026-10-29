import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, extractErrorMessage } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Group } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import { ErrorAlert, LoadingBlock } from '../../components/ui';
import GamesTab from './GamesTab';
import LeaderboardTab from './LeaderboardTab';
import MatchesTab from './MatchesTab';
import MembersTab from './MembersTab';

type TabKey = 'matches' | 'leaderboard' | 'games' | 'members';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'matches', label: 'Partidas', icon: '🎲' },
  { key: 'leaderboard', label: 'Clasificación', icon: '🏆' },
  { key: 'games', label: 'Catálogo', icon: '🃏' },
  { key: 'members', label: 'Miembros', icon: '👥' },
];

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const id = Number(groupId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('matches');
  const [showInvite, setShowInvite] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadGroup = useCallback(async () => {
    if (!Number.isFinite(id)) return;
    try {
      setError(null);
      const response = await api.get<Group>(endpoints.groupDetail(id));
      setGroup(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cargar el grupo'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup, reloadKey]);

  if (loading) return <LoadingBlock label="Cargando grupo..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!group) return <ErrorAlert message="Grupo no encontrado" />;

  const isManager = group.my_role === 'MANAGER';

  return (
    <>
      <div className="row between mb">
        <div>
          <h1 className="page-title">{group.name}</h1>
          <p className="muted">
            {group.description ?? 'Sin descripción'} · 👤 {group.member_count} · 🎲{' '}
            {group.game_count}
          </p>
        </div>
        <div className="row">
          <span className={`badge ${isManager ? 'manager' : 'soft'}`}>
            {isManager ? '👑 Gestor' : '🎮 Jugador'}
          </span>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setShowInvite(true)}
          >
            Código de invitación
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`tab${tab === item.key ? ' active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            <span aria-hidden>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>

      {tab === 'matches' && (
        <MatchesTab groupId={id} onChanged={() => setReloadKey((k) => k + 1)} />
      )}
      {tab === 'leaderboard' && <LeaderboardTab groupId={id} isManager={isManager} />}
      {tab === 'games' && <GamesTab groupId={id} isManager={isManager} />}
      {tab === 'members' && (
        <MembersTab
          groupId={id}
          isManager={isManager}
          isOwner={user?.id === group.owner_id}
          group={group}
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}

      {showInvite && (
        <Modal
          title="Código de invitación"
          onClose={() => setShowInvite(false)}
          actions={
            <button
              type="button"
              className="btn"
              onClick={() => setShowInvite(false)}
            >
              Cerrar
            </button>
          }
        >
          <p className="muted text-center">
            Comparte este código para que tus amigos se unan al grupo:
          </p>
          <div className="code-box">{group.invite_code}</div>
          <div className="mt text-center">
            <button
              type="button"
              className="btn secondary small"
              onClick={() => {
                void navigator.clipboard?.writeText(group.invite_code);
              }}
            >
              Copiar código
            </button>
          </div>
        </Modal>
      )}

      <div className="mt">
        <button
          type="button"
          className="btn danger small"
          onClick={async () => {
            if (!window.confirm('¿Eliminar el grupo y todas sus partidas?')) return;
            try {
              await api.delete(endpoints.groupDetail(id));
              navigate('/groups', { replace: true });
            } catch (err) {
              window.alert(extractErrorMessage(err));
            }
          }}
        >
          Eliminar grupo
        </button>
      </div>
    </>
  );
}
