import { CircleCheck, CircleAlert, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.kind === 'error' ? CircleAlert : CircleCheck;
  return (
    <div className={`toast toast--${toast.kind || 'success'}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss message"><X size={16} /></button>
    </div>
  );
}
