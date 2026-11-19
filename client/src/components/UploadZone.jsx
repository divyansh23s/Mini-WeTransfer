import { useRef, useState } from 'react';
import { ArrowUpFromLine, FileUp, FolderOpen, LockKeyhole } from 'lucide-react';

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp,application/pdf';

export default function UploadZone({ onFiles, uploads, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  function submitFiles(files) {
    setLocalError('');
    const chosen = Array.from(files || []);
    if (!chosen.length) return;
    const overLimit = chosen.filter((file) => file.size > 100 * 1024 * 1024);
    if (overLimit.length) {
      setLocalError(`${overLimit[0].name} is larger than the 100 MB limit.`);
      return;
    }
    onFiles(chosen);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) submitFiles(event.dataTransfer.files);
  }

  return (
    <section
      className={`upload-zone${dragging ? ' upload-zone--dragging' : ''}${disabled ? ' upload-zone--disabled' : ''}`}
      onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={handleDrop}
      aria-label="Upload files"
    >
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={(event) => { submitFiles(event.target.files); event.target.value = ''; }}
        aria-label="Choose files to upload"
      />
      <div className="upload-art" aria-hidden="true">
        <span className="upload-art-square"><FileUp size={24} strokeWidth={1.6} /></span>
        <span className="upload-art-spark">✳</span>
      </div>
      <div className="upload-copy">
        <p className="upload-heading">Drop it like it’s <em>temporary.</em></p>
        <p className="upload-description">Drag files here, or choose them from your device.</p>
      </div>
      <button className="button button--dark" type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>
        <FolderOpen size={16} /> Choose files
      </button>
      <div className="upload-meta"><span><LockKeyhole size={13} /> Private until shared</span><span>PDF · PNG · JPG · GIF · WEBP</span><span>MAX 100 MB EACH</span></div>
      {localError && <p className="inline-error" role="alert">{localError}</p>}
      {uploads?.length > 0 && (
        <div className="upload-queue" aria-live="polite">
          {uploads.map((item, index) => (
            <div className="upload-queue-item" key={`${item.file.name}-${index}`}>
              <span className={`queue-state queue-state--${item.state}`} />
              <span className="queue-name">{item.file.name}</span>
              <span className="queue-detail">{item.state === 'uploading' ? `${item.progress}%` : item.state === 'error' ? 'FAILED' : item.state === 'done' ? 'READY' : 'WAITING'}</span>
              <div className="queue-progress"><span style={{ width: `${item.progress || (item.state === 'done' ? 100 : 0)}%` }} /></div>
              {item.error && <span className="queue-error">{item.error}</span>}
            </div>
          ))}
        </div>
      )}
      <span className="upload-arrow" aria-hidden="true"><ArrowUpFromLine size={16} /></span>
    </section>
  );
}
