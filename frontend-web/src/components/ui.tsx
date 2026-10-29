export function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />;
}

export function LoadingBlock({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="center-screen">
      <div className="text-center">
        <Spinner />
        <p className="muted">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="icon">{icon}</span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div className="mt">{action}</div>}
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="alert error" role="alert">
      {message}
    </div>
  );
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
