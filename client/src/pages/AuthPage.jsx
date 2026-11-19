import { useState } from 'react';
import { ArrowUpRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import Brand from '../components/Brand';
import StatusPill from '../components/StatusPill';

export default function AuthPage({ health, onCheckHealth, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (error) setError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onAuthenticated(mode, form);
    } catch (requestError) {
      setError(requestError.message || 'We could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page paper-grid">
      <section className="auth-story" aria-labelledby="auth-title">
        <Brand />
        <div className="story-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> PRIVATE BY DESIGN</p>
          <h1 id="auth-title">Send files.<br /><em>Then they vanish.</em></h1>
          <p className="story-intro">A file gets a link. The link gets a deadline. When its time is up, the drop is gone.</p>
          <div className="promise-list" aria-label="Product promises">
            <span>EXPIRES IN 7 DAYS</span>
            <span>1—100 DOWNLOADS</span>
            <span>REVOKE ANYTIME</span>
          </div>
        </div>
        <div className="story-footer">
          <div className="privacy-note"><ShieldCheck size={17} /><span>Your files stay yours. Links stay on a leash.</span></div>
          <span className="edition-note">A SMALLER KIND OF CLOUD&nbsp; · &nbsp;NO. 01</span>
        </div>
        <div className="story-stamp" aria-hidden="true"><span>PRIVATE<br />DROP</span><LockKeyhole size={19} /></div>
      </section>

      <section className="auth-side" aria-label={isRegister ? 'Create your account' : 'Sign in'}>
        <div className="auth-mobile-brand"><Brand compact /></div>
        <div className="auth-card">
          <div className="auth-card-top">
            <div>
              <p className="eyebrow auth-kicker">{isRegister ? 'START WITH A CLEAN SLATE' : 'GOOD TO HAVE YOU BACK'}</p>
              <h2>{isRegister ? 'Create account' : 'Sign in'}</h2>
            </div>
            <StatusPill health={health} onRetry={onCheckHealth} compact />
          </div>
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <label className="field">
                <span>Your name</span>
                <input name="name" autoComplete="name" value={form.name} onChange={handleChange} required minLength={2} maxLength={80} placeholder="Ada Lovelace" />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={handleChange} required minLength={isRegister ? 10 : 1} maxLength={72} placeholder={isRegister ? 'At least 10 characters' : 'Your password'} />
              {isRegister && <small>10 characters minimum. Keep it somewhere safe.</small>}
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button--primary auth-submit" type="submit" disabled={busy || (health && !health.reachable)}>
              <span>{busy ? (isRegister ? 'Creating your space…' : 'Checking your details…') : (isRegister ? 'Create account' : 'Sign in')}</span>
              {!busy && <ArrowUpRight size={17} />}
            </button>
          </form>
          <div className="auth-switch">
            <span>{isRegister ? 'Already have an account?' : 'New here?'}</span>
            <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </div>
          <div className="auth-assurance"><LockKeyhole size={14} /><span>Encrypted in transit. Shared on your terms.</span></div>
        </div>
        <p className="auth-caption">A little space for the files that need to move.</p>
      </section>
    </main>
  );
}
