import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CircleHelp, LogOut, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import Brand from '../components/Brand';
import FileCard from '../components/FileCard';
import StatusPill from '../components/StatusPill';
import Toast from '../components/Toast';
import UploadZone from '../components/UploadZone';
import { checkHealth, createShareLink, fetchFiles, revokeShareLink, uploadFile } from '../lib/api';

const LINK_SESSION_KEY = 'mini-wetransfer-created-links';

function readLinks() {
  try { return JSON.parse(sessionStorage.getItem(LINK_SESSION_KEY) || '{}'); }
  catch { return {}; }
}

function persistLinks(links) {
  try { sessionStorage.setItem(LINK_SESSION_KEY, JSON.stringify(links)); }
  catch { /* the link still works for this page session */ }
}

export default function Dashboard({ user, token, health, setHealth, onLogout, notify, toast, clearToast }) {
  const [files, setFiles] = useState([]);
  const [linksByFile, setLinksByFile] = useState(readLinks);
  const [uploads, setUploads] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [listError, setListError] = useState('');
  const [showNote, setShowNote] = useState(false);

  const refreshHealth = useCallback(async () => setHealth(await checkHealth()), [setHealth]);
  const refreshFiles = useCallback(async () => {
    setLoadingFiles(true);
    setListError('');
    try {
      setFiles(await fetchFiles(token));
    } catch (error) {
      if (error.status === 401) onLogout();
      else setListError(error.message || 'Your files could not be loaded.');
    } finally { setLoadingFiles(false); }
  }, [token, onLogout]);

  useEffect(() => { refreshFiles(); }, [refreshFiles]);
  useEffect(() => { refreshHealth(); }, [refreshHealth]);

  async function handleFiles(chosenFiles) {
    setUploading(true);
    setUploads(chosenFiles.map((file) => ({ file, progress: 0, state: 'waiting' })));
    let completed = 0;
    let failures = 0;
    for (let index = 0; index < chosenFiles.length; index += 1) {
      const file = chosenFiles[index];
      setUploads((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, state: 'uploading' } : item));
      try {
        await uploadFile(token, file, (progress) => {
          setUploads((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, progress } : item));
        });
        completed += 1;
        setUploads((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, progress: 100, state: 'done' } : item));
      } catch (error) {
        failures += 1;
        setUploads((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, state: 'error', error: error.message } : item));
        if (error.status === 401) { onLogout(); break; }
      }
    }
    setUploading(false);
    if (completed) {
      await refreshFiles();
      notify({ kind: 'success', message: `${completed} ${completed === 1 ? 'file is' : 'files are'} safely in your space.` });
    }
    if (failures && !completed) notify({ kind: 'error', message: 'The upload did not finish. Check the file type, size, and API status.' });
    else if (failures) notify({ kind: 'error', message: `${failures} file${failures > 1 ? 's' : ''} could not be uploaded. See the details above.` });
  }

  async function handleCreateLink(fileId, settings) {
    try {
      const response = await createShareLink(token, { fileId, ...settings });
      const link = response.link;
      const secret = link.downloadPath.split('/').filter(Boolean).at(-1);
      const created = {
        ...link,
        shareUrl: `${window.location.origin}/drop/${encodeURIComponent(secret)}`
      };
      setLinksByFile((current) => {
        const next = { ...current, [fileId]: [created, ...(current[fileId] || [])] };
        persistLinks(next);
        return next;
      });
      notify({ kind: 'success', message: 'Your expiring link is ready. Copy it before you leave this session.' });
    } catch (error) {
      if (error.status === 401) onLogout();
      notify({ kind: 'error', message: error.message || 'The link could not be created.' });
    }
  }

  async function handleRevoke(linkId) {
    try {
      await revokeShareLink(token, linkId);
      setLinksByFile((current) => {
        const next = Object.fromEntries(Object.entries(current).map(([fileId, links]) => [fileId, links.filter((link) => link.id !== linkId)]));
        persistLinks(next);
        return next;
      });
      notify({ kind: 'success', message: 'That link has been revoked.' });
    } catch (error) {
      if (error.status === 401) onLogout();
      notify({ kind: 'error', message: error.message || 'The link could not be revoked.' });
    }
  }

  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + (file.sizeBytes || 0), 0), [files]);

  return (
    <div className="dashboard-page paper-grid">
      <header className="dashboard-nav">
        <Brand compact />
        <div className="nav-right">
          <StatusPill health={health} onRetry={refreshHealth} />
          <span className="nav-divider" />
          <span className="user-greeting"><span className="user-avatar">{(user?.name || user?.email || 'M').slice(0, 1).toUpperCase()}</span><span className="user-name">{user?.name || user?.email}</span></span>
          <button className="logout-button" type="button" onClick={onLogout}><LogOut size={15} /><span>Sign out</span></button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-intro">
          <div className="dashboard-title-wrap">
            <p className="eyebrow"><span className="eyebrow-line" /> YOUR PRIVATE WORKSPACE</p>
            <h1>Your files,<br /><em>on their way.</em></h1>
            <p className="dashboard-description">A quiet place for things in transit. Upload a file, set its shelf life, and share the link only where it needs to go.</p>
          </div>
          <div className="workspace-note">
            <span className="note-index">01 — PRIVATE DROP</span>
            <p>Every link has an end.<br />You decide where it is.</p>
            <span className="note-scribble" aria-hidden="true">↘</span>
          </div>
        </section>

        <section className="workspace-grid" aria-label="File workspace">
          <div className="workspace-primary">
            <div className="section-heading">
              <div><p className="eyebrow">THE INBOX</p><h2>Send something.</h2></div>
              <span className="section-count">01</span>
            </div>
            <UploadZone onFiles={handleFiles} uploads={uploads} disabled={uploading || !health?.reachable} />
            {!health?.reachable && <p className="api-help"><span className="api-help-dot" /> API connection required before uploading. Start the backend and retry the status check.</p>}

            <div className="storage-footnote"><span><ShieldCheck size={15} /> FILES ARE PRIVATE BY DEFAULT</span><button type="button" onClick={() => setShowNote(!showNote)} aria-expanded={showNote}><CircleHelp size={14} /> HOW IT WORKS</button></div>
            {showNote && <p className="how-note">Your file stays private until shared. A link is a separate key, limited by the expiry and download count you choose. Revoke it whenever you like.</p>}
          </div>

          <aside className="workspace-sidebar">
            <div className="ledger-head">
              <div><p className="eyebrow">THE HOLDING ROOM</p><h2>Your files <span>({files.length.toString().padStart(2, '0')})</span></h2></div>
              <button className="refresh-button" type="button" onClick={refreshFiles} disabled={loadingFiles} aria-label="Refresh file list"><RefreshCw size={15} className={loadingFiles ? 'spin' : ''} /></button>
            </div>
            <div className="storage-meter">
              <div className="storage-meter-copy"><span>IN THIS SESSION</span><span>{files.length} {files.length === 1 ? 'FILE' : 'FILES'} <i /> {formatStorage(totalBytes)}</span></div>
              <div className="storage-meter-track"><span style={{ width: `${Math.min(files.length * 8, 100)}%` }} /></div>
            </div>
            {listError && <div className="list-error" role="alert">{listError}<button type="button" onClick={refreshFiles}>Try again <ArrowUpRight size={13} /></button></div>}
            {loadingFiles ? (
              <div className="file-list-state"><span className="loading-orbit" /><p>Opening your space…</p></div>
            ) : files.length > 0 ? (
              <div className="file-list">{files.map((file) => <FileCard key={file.id} file={file} links={linksByFile[file.id] || []} onCreateLink={handleCreateLink} onRevokeLink={handleRevoke} toast={notify} />)}</div>
            ) : !listError ? (
              <div className="empty-files">
                <div className="empty-symbol" aria-hidden="true"><span>0</span><ArrowDownRight size={21} /></div>
                <p className="empty-title">Nothing in transit.</p>
                <p>Your files will find a home here after the first upload.</p>
              </div>
            ) : null}
            <div className="sidebar-bottom"><Sparkles size={14} /><span>A little less permanence feels good.</span></div>
          </aside>
        </section>

        <footer className="dashboard-footer"><span>MINI WETRANSFER <i /> SMALL FILES, SHORT MEMORIES.</span><span>YOUR SPACE, YOUR RULES <ShieldCheck size={13} /></span></footer>
      </main>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}

function formatStorage(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
