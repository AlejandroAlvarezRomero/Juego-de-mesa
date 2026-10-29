import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, extractErrorMessage } from '../api/client';
import { endpoints } from '../api/endpoints';
import type { Group } from '../api/types';
import Modal from '../components/Modal';
import { EmptyState, ErrorAlert, LoadingBlock } from '../components/ui';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { canCreateGroups } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seedPopular, setSeedPopular] = useState(true);
  const [inviteCode, setInviteCode] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Group[]>(endpoints.groups);
      setGroups(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar los grupos'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const createGroup = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      const response = await api.post<Group>(endpoints.groups, {
        name: name.trim(),
        description: description.trim() || null,
        seed_popular: seedPopular,
      });
      setShowCreate(false);
      setName('');
      setDescription('');
      navigate(`/groups/${response.data.id}`);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'No se pudo crear el grupo'));
    } finally {
      setBusy(false);
    }
  };

  const joinGroup = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      const response = await api.post<Group>(endpoints.joinGroup, {
        invite_code: inviteCode.trim().toUpperCase(),
      });
      setShowJoin(false);
      setInviteCode('');
      navigate(`/groups/${response.data.id}`);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'No se pudo unir al grupo'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock label="Cargando tus grupos..." />;

  return (
    <>
      <div className="row between mb">
        <div>
          <h1 className="page-title">Mis grupos</h1>
          <p className="muted">
            Crea un grupo o únete con un código de invitación.
          </p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setFormError(null);
              setShowJoin(true);
            }}
          >
            Unirme por código
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (!canCreateGroups) {
                setShowPermissionAlert(true);
                return;
              }
              setFormError(null);
              setShowCreate(true);
            }}
          >
            + Nuevo grupo
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="👥"
            title="Todavía no perteneces a ningún grupo"
            description="Crea tu primer grupo o únete a uno con el código que te hayan compartido."
            action={
              <button
                type="button"
                className="btn"
                onClick={() => setShowCreate(true)}
              >
                Crear mi primer grupo
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid">
          {groups.map((group) => (
            <div
              key={group.id}
              className="card list-row clickable"
              style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 8 }}
              onClick={() => navigate(`/groups/${group.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/groups/${group.id}`);
              }}
            >
              <div className="row between" style={{ width: '100%' }}>
                <h3 className="row-title">{group.name}</h3>
                <span
                  className={`badge ${group.my_role === 'MANAGER' ? 'manager' : 'soft'}`}
                >
                  {group.my_role === 'MANAGER' ? 'Gestor' : 'Jugador'}
                </span>
              </div>
              {group.description && (
                <p className="row-subtitle">{group.description}</p>
              )}
              <p className="row-subtitle">
                👤 {group.member_count} miembros · 🎲 {group.game_count} juegos
              </p>
              <div className="row text-sm muted">
                <span className="mono">{group.invite_code}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Crear grupo privado"
          onClose={() => setShowCreate(false)}
          actions={
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="create-group-form"
                className="btn"
                disabled={busy}
              >
                {busy ? 'Creando...' : 'Crear grupo'}
              </button>
            </>
          }
        >
          {formError && <ErrorAlert message={formError} />}
          <form id="create-group-form" onSubmit={createGroup}>
            <div className="field">
              <label htmlFor="group-name">Nombre del grupo</label>
              <input
                id="group-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={100}
                placeholder="Los Dados"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="group-description">Descripción (opcional)</label>
              <textarea
                id="group-description"
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Partidas semanales los viernes"
              />
            </div>
            <label className="row text-sm" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={seedPopular}
                onChange={(e) => setSeedPopular(e.target.checked)}
              />
              Precargar catálogo con juegos populares (Catan, Carcassonne, Pandemic...)
            </label>
          </form>
        </Modal>
      )}

      {showJoin && (
        <Modal
          title="Unirse a un grupo"
          onClose={() => setShowJoin(false)}
          actions={
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowJoin(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="join-group-form"
                className="btn"
                disabled={busy}
              >
                {busy ? 'Uniendo...' : 'Unirme'}
              </button>
            </>
          }
        >
          {formError && <ErrorAlert message={formError} />}
          <form id="join-group-form" onSubmit={joinGroup}>
            <div className="field">
              <label htmlFor="invite-code">Código de invitación</label>
              <input
                id="invite-code"
                className="input mono text-center"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="ABC123"
                maxLength={12}
                style={{ letterSpacing: 4, fontSize: 20 }}
                required
              />
              <p className="hint">
                Pide el código a la persona que gestiona el grupo.
              </p>
            </div>
          </form>
        </Modal>
      )}

      {showPermissionAlert && (
        <Modal
          title="Permisos insuficientes"
          onClose={() => setShowPermissionAlert(false)}
          actions={
            <button
              type="button"
              className="btn"
              onClick={() => setShowPermissionAlert(false)}
            >
              Entendido
            </button>
          }
        >
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <span style={{ fontSize: 48 }}>🔒</span>
            <h3 style={{ marginTop: 12 }}>Rol de Gestor o Administrador requerido</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Tu cuenta tiene rol <strong>CLIENTE / JUGADOR</strong>. Solo los usuarios con rol{' '}
              <strong>GESTOR</strong> o <strong>ADMINISTRADOR</strong> pueden crear nuevos grupos en la plataforma.
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              Puedes unirte a un grupo existente usando el botón <em>"Unirme por código"</em> o solicitar a un administrador que asigne el rol de Gestor a tu cuenta.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
