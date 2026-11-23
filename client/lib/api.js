const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
export const API_BASE = configuredBase || '/api';

function healthUrl() {
  if (!configuredBase || configuredBase === '/api') return '/health';
  const origin = configuredBase.replace(/\/api$/i, '');
  return `${origin}/health`;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function authHeaders(token, headers = {}) {
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers };
}

export async function checkHealth() {
  try {
    const response = await fetch(healthUrl(), { headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => ({}));
    return { reachable: response.ok, database: body.database || 'unknown', status: response.status };
  } catch {
    return { reachable: false, database: 'unknown', status: 0 };
  }
}

export async function authenticate(mode, data) {
  const response = await fetch(`${API_BASE}/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data)
  });
  return parseResponse(response);
}

export async function fetchFiles(token) {
  const response = await fetch(`${API_BASE}/files`, {
    headers: authHeaders(token, { Accept: 'application/json' })
  });
  const body = await parseResponse(response);
  return body.files || [];
}

export function uploadFile(token, file, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${API_BASE}/files`);
    request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.setRequestHeader('Accept', 'application/json');
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () => {
      let payload = {};
      try { payload = JSON.parse(request.responseText || '{}'); } catch { /* handled below */ }
      if (request.status >= 200 && request.status < 300 && payload?.file?.id) resolve(payload);
      else if (request.status >= 200 && request.status < 300) reject(new Error('The upload response was incomplete. Refresh your files and try again.'));
      else {
        const error = new Error(payload?.error?.message || `Upload failed (${request.status})`);
        error.status = request.status;
        reject(error);
      }
    });
    request.addEventListener('error', () => reject(new Error('Could not reach the file service. Check that the API is running.')));
    request.addEventListener('abort', () => reject(new Error('Upload was cancelled.')));
    const form = new FormData();
    form.append('file', file);
    request.send(form);
  });
}

export async function createShareLink(token, settings) {
  const response = await fetch(`${API_BASE}/links`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(settings)
  });
  return parseResponse(response);
}

export async function revokeShareLink(token, linkId) {
  const response = await fetch(`${API_BASE}/links/${encodeURIComponent(linkId)}`, {
    method: 'DELETE',
    headers: authHeaders(token, { Accept: 'application/json' })
  });
  return parseResponse(response);
}

export async function downloadSharedFile(token) {
  const response = await fetch(`${API_BASE}/links/${encodeURIComponent(token)}`, {
    headers: { Accept: '*/*' }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload?.error?.message || 'This drop is unavailable. It may have expired or reached its download limit.');
    error.status = response.status;
    throw error;
  }
  return { blob: await response.blob(), disposition: response.headers.get('content-disposition') || '' };
}

export function filenameFromDisposition(disposition) {
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) {
    try { return decodeURIComponent(utf8[1].replace(/^"|"$/g, '')); } catch { /* fallback below */ }
  }
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : 'shared-file';
}
