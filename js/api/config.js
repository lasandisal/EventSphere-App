/* =========================================================
   EventSphere — API config & fetch wrapper
   ========================================================= */

// Updated to point directly to your live Render backend
const ES_API_BASE = window.ES_API_BASE || 'https://its-1114-eventsphere-booking-platform.onrender.com/api/v1';
const ES_TOKEN_KEY = 'es_token';
const ES_USER_KEY = 'es_user';

const EsAuthStore = {
  getToken(){ return localStorage.getItem(ES_TOKEN_KEY); },
  setToken(t){ localStorage.setItem(ES_TOKEN_KEY, t); },
  clear(){ localStorage.removeItem(ES_TOKEN_KEY); localStorage.removeItem(ES_USER_KEY); },
  getUser(){ try{ return JSON.parse(localStorage.getItem(ES_USER_KEY)); }catch(e){ return null; } },
  setUser(u){ localStorage.setItem(ES_USER_KEY, JSON.stringify(u)); },
  isLoggedIn(){ return !!this.getToken(); },
  hasRole(role){ const u = this.getUser(); return !!(u && u.roles && u.roles.includes(role)); }
};

/**
 * esFetch — thin wrapper around fetch() for the EventSphere API.
 * Unwraps the backend's CommonResponse{status,message,data} envelope,
 * attaches the JWT if present, and normalizes errors.
 */
async function esFetch(path, { method = 'GET', body, params, isForm = false } = {}) {
  let url = `${ES_API_BASE}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  const token = EsAuthStore.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  let fetchBody;
  if (isForm && body) {
    fetchBody = new URLSearchParams(body).toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (body !== undefined) {
    fetchBody = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, { method, headers, body: fetchBody });
    let payload = null;
    try { payload = await res.json(); } catch (e) { /* no body */ }

    if (!res.ok) {
      const message = (payload && payload.message) || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return payload ? payload.data : null;
  } catch (networkErr) {
    if (networkErr.status) throw networkErr;
    // Network/demo-mode fallback is handled by callers via mock data.
    const err = new Error('Could not reach EventSphere servers.');
    err.status = 0;
    throw err;
  }
}

window.EsAuthStore = EsAuthStore;
window.esFetch = esFetch;