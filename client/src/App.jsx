import { useCallback, useEffect, useRef, useState } from 'react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DownloadPage from './pages/DownloadPage';
import { authenticate, checkHealth } from './lib/api';

const TOKEN_KEY = 'mini-wetransfer-session-token';
const USER_KEY = 'mini-wetransfer-session-user';

function readSession(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function readUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}

function MainApp() {
  const [token, setToken] = useState(() => readSession(TOKEN_KEY));
  const [user, setUser] = useState(readUser);
  const [health, setHealth] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    checkHealth().then(setHealth);
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4600);
  }, []);
  const clearToast = useCallback(() => {
    window.clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const handleAuth = useCallback(async (mode, form) => {
    const response = await authenticate(mode, form);
    if (!response?.token || !response?.user) throw new Error('The API response was incomplete. Please try again.');
    try {
      sessionStorage.setItem(TOKEN_KEY, response.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch {
      throw new Error('This browser could not start a private session. Check storage permissions and try again.');
    }
    setToken(response.token);
    setUser(response.user);
    notify({ kind: 'success', message: mode === 'register' ? 'Your private space is ready.' : 'You’re signed in. Welcome back.' });
  }, [notify]);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem('mini-wetransfer-created-links');
    } catch { /* memory state is cleared either way */ }
    setToken(null);
    setUser(null);
    setToast(null);
  }, []);

  const dropMatch = window.location.pathname.match(/^\/drop\/([A-Za-z0-9_-]+)\/?$/);
  if (window.location.pathname.startsWith('/drop/')) return <DownloadPage token={dropMatch?.[1] || 'invalid'} />;
  if (window.location.pathname !== '/') return <main className="receive-page paper-grid"><a className="button button--dark" href="/">Return to Mini WeTransfer</a></main>;
  return token
    ? <Dashboard user={user} token={token} health={health} setHealth={setHealth} onLogout={logout} notify={notify} toast={toast} clearToast={clearToast} />
    : <AuthPage health={health} onCheckHealth={async () => setHealth(await checkHealth())} onAuthenticated={handleAuth} />;
}

export default function App() {
  return <MainApp />;
}
