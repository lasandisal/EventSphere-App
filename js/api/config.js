/* =========================================================
   EventSphere — API config & fetch wrapper
   Talks to the Spring Boot backend under /api/v1/*.
   ========================================================= */

if (!window.ES_CONFIG || !window.ES_CONFIG.API_BASE) {
  const errMsg = 'EventSphere frontend configuration is missing. Please check js/env.js.';
  console.error(errMsg);
  if (typeof esToast === 'function') esToast(errMsg, 'error');
  throw new Error(errMsg);
}

const ES_API_BASE = window.ES_CONFIG.API_BASE;
const ES_TOKEN_KEY = 'es_token';
const ES_USER_KEY = 'es_user';

const EsAuthStore = {
  getToken() { return localStorage.getItem(ES_TOKEN_KEY); },
  setToken(t) { localStorage.setItem(ES_TOKEN_KEY, t); },
  clear() { localStorage.removeItem(ES_TOKEN_KEY); localStorage.removeItem(ES_USER_KEY); },
  getUser() { try { return JSON.parse(localStorage.getItem(ES_USER_KEY)); } catch (e) { return null; } },
  setUser(u) { localStorage.setItem(ES_USER_KEY, JSON.stringify(u)); },
  isLoggedIn() { return !!this.getToken(); },
  hasRole(role) { const u = this.getUser(); return !!(u && u.roles && u.roles.includes(role)); }
};

/**
 * esFetch — thin wrapper around fetch() for the EventSphere API.
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
    const err = new Error('Could not reach EventSphere servers.');
    err.status = 0;
    throw err;
  }
}

function esPathPrefix() {
  const isSubPage = window.location.pathname.includes('/pages/');
  return { toRoot: isSubPage ? '../' : './', toPages: isSubPage ? '' : 'pages/' };
}

window.EsAuthStore = EsAuthStore;
window.esFetch = esFetch;
window.esPathPrefix = esPathPrefix;