import { Activity, CircleAlert } from 'lucide-react';

export default function StatusPill({ health, onRetry, compact = false }) {
  if (!health) return <span className="status-pill status-pill--checking"><Activity size={13} /> checking service</span>;
  const ready = health.reachable && health.database === 'connected';
  return (
    <button
      className={`status-pill ${ready ? 'status-pill--ready' : 'status-pill--down'}${compact ? ' status-pill--compact' : ''}`}
      onClick={onRetry}
      type="button"
      title="Check API and database status"
    >
      {ready ? <span className="status-dot" /> : <CircleAlert size={13} />}
      <span>{ready ? 'API connected' : health.reachable ? 'Database offline' : 'API unreachable'}</span>
    </button>
  );
}
