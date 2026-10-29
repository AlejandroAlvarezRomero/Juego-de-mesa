import { useCallback, useEffect, useState } from 'react';
import { api, extractErrorMessage } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import type { Group, Member } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import Modal from '../../components/Modal';
import { ErrorAlert, LoadingBlock, formatDate } from '../../components/ui';

export default function MembersTab({
  groupId,
  isManager,
  isOwner,
  group,
  onChanged,
}: {
  groupId: number;
  isManager: boolean;
  isOwner: boolean;
  group: Group;
  onChanged?: () => void;
}) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<Member | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Member[]>(endpoints.groupMembers(groupId));
      setMembers(response.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar los miembros'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleRole = async (member: Member) => {
    const newRole = member.role === 'MANAGER' ? 'MEMBER' : 'MANAGER';
    try {
      await api.patch(endpoints.groupMember(groupId, member.user_id), {
        role: newRole,
      });
      setNotice(
        newRole === 'MANAGER'
          ? `${member.display_name ?? member.username} ahora es Gestor`
          : `${member.display_name ?? member.username} vuelve a ser Jugador`,
      );
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cambiar el rol'));
    }
  };

  const kick = async (member: Member) => {
    if (!window.confirm(`¿Expulsar a ${member.display_name ?? member.username}?`))
      return;
    try {
      await api.delete(endpoints.groupMember(groupId, member.user_id));
      setNotice('Miembro expulsado del grupo');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo expulsar al miembro'));
    }
  };

  const transfer = async () => {
    if (!pendingTransfer) return;
    try {
      await api.post(endpoints.transferOwnership(groupId), {
        new_owner_id: pendingTransfer.user_id,
      });
      setPendingTransfer(null);
      setNotice('Propiedad del grupo transferida con éxito');
      await load();
      onChanged?.();
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo transferir la propiedad'));
    }
  };

  if (loading) return <LoadingBlock label="Cargando miembros..." />;

  return (
    <>
      {notice && <div className="alert success">{notice}</div>}
      {error && <ErrorAlert message={error} />}

      <h2 className="section-title">Miembros ({members.length})</h2>

      <div className="card" style={{ padding: 6 }}>
        {members.map((member) => {
          const isSelf = member.user_id === user?.id;
          const isGroupOwner = member.user_id === group.owner_id;
          return (
            <div
              key={member.user_id}
              className="list-row"
              style={{ border: 'none', background: 'transparent' }}
            >
              <UserAvatar
                avatarUrl={member.avatar_url}
                name={member.display_name ?? member.username}
                size={40}
              />
              <div className="grow">
                <p className="row-title">
                  {member.display_name ?? member.username}
                  {isSelf && <span className="muted text-sm"> (tú)</span>}
                </p>
                <p className="row-subtitle">
                  @{member.username} · Miembro desde {formatDate(member.joined_at)}
                </p>
              </div>
              <span className={`badge ${member.role === 'MANAGER' ? 'manager' : 'soft'}`}>
                {member.role}
              </span>
              {isGroupOwner && (
                <span className="badge admin" title="Propietario del grupo">
                  👑
                </span>
              )}

              {isManager && !isGroupOwner && (
                <div className="row" style={{ gap: 6 }}>
                  <button
                    type="button"
                    className="btn secondary small"
                    onClick={() => toggleRole(member)}
                    title={
                      member.role === 'MANAGER'
                        ? 'Degradar a miembro'
                        : 'Promover a gestor'
                    }
                  >
                    {member.role === 'MANAGER' ? '⬇️' : '⬆️'}
                  </button>
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() => kick(member)}
                    title="Expulsar del grupo"
                  >
                    ✖
                  </button>
                </div>
              )}

              {isOwner && !isSelf && !isGroupOwner && (
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => setPendingTransfer(member)}
                  title="Transferir propiedad del grupo"
                >
                  👑 Transferir
                </button>
              )}
            </div>
          );
        })}
      </div>

      {pendingTransfer && (
        <Modal
          title="Transferir propiedad"
          onClose={() => setPendingTransfer(null)}
          actions={
            <>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setPendingTransfer(null)}
              >
                Cancelar
              </button>
              <button type="button" className="btn danger" onClick={transfer}>
                Transferir
              </button>
            </>
          }
        >
          <p>
            ¿Seguro que transfieres la propiedad del grupo a{' '}
            <strong>
              {pendingTransfer.display_name ?? pendingTransfer.username}
            </strong>
            ? Dejarás de ser el propietario y perderás los permisos de gestión.
          </p>
        </Modal>
      )}
    </>
  );
}
