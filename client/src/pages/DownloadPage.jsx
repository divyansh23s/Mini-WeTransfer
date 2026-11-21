import { useState } from 'react';
import { ArrowDownToLine, ArrowLeft, CircleAlert, Clock3, FileKey2, LoaderCircle, ShieldCheck } from 'lucide-react';
import Brand from '../components/Brand';
import { downloadSharedFile, filenameFromDisposition } from '../lib/api';

export default function DownloadPage({ token }) {
  const [state, setState] = useState('ready');
  const [error, setError] = useState('');

  async function download() {
    setState('downloading');
    setError('');
    try {
      const result = await downloadSharedFile(token);
      const objectUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filenameFromDisposition(result.disposition);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      setState('complete');
    } catch (downloadError) {
      setError(downloadError.status === 404
        ? 'This drop is no longer available. Its link may have expired, been revoked, or reached its download limit.'
        : downloadError.message || 'The download could not be completed. Please try again.');
      setState(downloadError.status === 404 ? 'unavailable' : 'error');
    }
  }

  return (
    <main className="receive-page paper-grid">
      <header className="receive-nav"><Brand compact /><span className="receive-nav-note"><ShieldCheck size={14} /> A PRIVATE DROP</span></header>
      <section className="receive-card" aria-labelledby="receive-title">
        <div className={`receive-icon${state === 'unavailable' ? ' receive-icon--error' : ''}`} aria-hidden="true">
          {state === 'downloading' ? <LoaderCircle size={27} className="spin" /> : state === 'unavailable' || state === 'error' ? <CircleAlert size={27} /> : state === 'complete' ? <ShieldCheck size={27} /> : <FileKey2 size={27} />}
        </div>
        <p className="eyebrow"><span className="eyebrow-line" /> MINI WETRANSFER · PRIVATE DELIVERY</p>
        <h1 id="receive-title">{state === 'unavailable' ? <>This drop has<br /><em>left the room.</em></> : state === 'complete' ? <>On its way<br /><em>to your device.</em></> : <>Something is<br /><em>on its way.</em></>}</h1>
        {state === 'ready' && <p className="receive-copy">A private file is waiting for you. The link is checked when you start; if it has expired or reached its limit, we’ll let you know.</p>}
        {state === 'downloading' && <p className="receive-copy">Checking the link and preparing your download. Keep this page open for a moment.</p>}
        {state === 'complete' && <p className="receive-copy">Your browser has started the download. This link may now be used up, depending on the sender’s settings.</p>}
        {(state === 'unavailable' || state === 'error') && <p className="receive-error" role="alert">{error}</p>}
        {(state === 'ready' || state === 'error') ? (
          <button className="button button--primary receive-button" type="button" onClick={download}>
            <ArrowDownToLine size={18} /> {state === 'error' ? 'Try again' : 'Download file'}
          </button>
        ) : state === 'downloading' ? (
          <button className="button button--primary receive-button" type="button" disabled><LoaderCircle size={17} className="spin" /> Preparing…</button>
        ) : (
          <a className="button button--dark receive-button" href="/"><ArrowLeft size={16} /> Back to Mini WeTransfer</a>
        )}
        <div className="receive-divider"><span>LINK DETAILS STAY PRIVATE</span><span>—</span></div>
        <p className="receive-foot"><Clock3 size={14} /> Expiring links are checked at download time.</p>
      </section>
      <footer className="receive-footer"><span>MINI WETRANSFER</span><span>THE INTERNET CAN FORGET.</span></footer>
    </main>
  );
}
