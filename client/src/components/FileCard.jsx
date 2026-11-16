import { useState } from 'react';
import { Check, ChevronDown, Clipboard, FileImage, FileText, Link2, LoaderCircle, LockKeyhole, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';

const EXPIRIES = [
  { hours: 1, label: '1 hour' },
  { hours: 6, label: '6 hours' },
  { hours: 24, label: '24 hours' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '7 days' }
];
const DOWNLOAD_LIMITS = [1, 3, 5, 10, 25, 50, 100];

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
}

export default function FileCard({ file, links, onCreateLink, onRevokeLink, toast }) {
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState(24);
  const [limit, setLimit] = useState(1);
  const [creating, setCreating] = useState(false);
  const [copying, setCopying] = useState('');
  const isImage = file.mimeType?.startsWith('image/');
  const Icon = isImage ? FileImage : FileText;

  async function handleCreate() {
    setCreating(true);
    try {
      await onCreateLink(file.id, { expiresInHours: Number(expiry), maxDownloads: Number(limit) });
    } finally { setCreating(false); }
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      setCopying(link.id);
      toast({ kind: 'success', message: 'Private link copied to clipboard.' });
      window.setTimeout(() => setCopying(''), 1800);
    } catch {
      toast({ kind: 'error', message: 'Clipboard access is unavailable. Select and copy the link instead.' });
    }
  }

  return (
    <article className="file-card">
      <div className="file-card-main">
        <div className={`file-type-icon${isImage ? ' file-type-icon--image' : ''}`}><Icon size={21} strokeWidth={1.7} /></div>
        <div className="file-ident">
          <h3 title={file.name}>{file.name}</h3>
          <p>{formatBytes(file.sizeBytes)} <span>·</span> Added {new Date(file.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
        </div>
        <span className="file-private"><LockKeyhole size={13} /> PRIVATE</span>
        <button className={`icon-button file-share-toggle${open ? ' is-open' : ''}`} type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? 'Close' : 'Create'} share link for ${file.name}`}>
          <Link2 size={17} /><span>{open ? 'Close' : 'Share'}</span><ChevronDown size={14} className="share-chevron" />
        </button>
      </div>

      {open && (
        <div className="share-panel">
          <div className="share-panel-rule"><span>LINK SETTINGS</span><span>01 / 02</span></div>
          <div className="share-controls">
            <label className="select-field"><span>Expires after</span><select value={expiry} onChange={(event) => setExpiry(event.target.value)}>{EXPIRIES.map((option) => <option key={option.hours} value={option.hours}>{option.label}</option>)}</select></label>
            <label className="select-field"><span>Download limit</span><select value={limit} onChange={(event) => setLimit(event.target.value)}>{DOWNLOAD_LIMITS.map((value) => <option key={value} value={value}>{value} {value === 1 ? 'download' : 'downloads'}</option>)}</select></label>
            <button className="button button--primary create-link-button" type="button" disabled={creating} onClick={handleCreate}>
              {creating ? <LoaderCircle size={16} className="spin" /> : <Link2 size={16} />}{creating ? 'Making link…' : 'Create link'}
            </button>
          </div>
          {links.length > 0 ? (
            <div className="created-links">
              <p className="created-links-heading"><ShieldCheck size={14} /> YOUR PRIVATE LINKS <span>{links.length}</span></p>
              {links.map((link) => {
                const expired = Date.parse(link.expiresAt) <= Date.now();
                return (
                  <div className={`created-link${expired ? ' created-link--expired' : ''}`} key={link.id}>
                    <div className="created-link-info">
                      <span className={`link-state-dot${expired ? ' link-state-dot--expired' : ''}`} />
                      <span className="created-link-url" title={link.shareUrl}>{link.shareUrl}</span>
                      <span className="created-link-meta">{expired ? 'EXPIRED' : `UNTIL ${new Date(link.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`} · {link.maxDownloads} {link.maxDownloads === 1 ? 'DL' : 'DLS'}</span>
                    </div>
                    <div className="created-link-actions">
                      <button className="icon-button small-icon-button" type="button" onClick={() => copyLink(link)} aria-label={`Copy link for ${file.name}`}><span className="desktop-action">{copying === link.id ? <Check size={15} /> : <Clipboard size={15} />}</span><span className="mobile-action">{copying === link.id ? 'COPIED' : 'COPY'}</span></button>
                      <button className="icon-button small-icon-button revoke-button" type="button" onClick={() => onRevokeLink(link.id)} aria-label={`Revoke link for ${file.name}`}><span className="desktop-action"><Trash2 size={15} /></span><span className="mobile-action">REVOKE</span></button>
                    </div>
                  </div>
                );
              })}
              <p className="link-note"><RotateCcw size={12} /> Link details are held in this browser session; a used-up link may be unavailable before its expiry.</p>
            </div>
          ) : (
            <p className="share-footnote"><ShieldCheck size={13} /> The link is shown once here. Revoke it any time.</p>
          )}
        </div>
      )}
    </article>
  );
}
