/* =========================================================
   EventSphere — API config & fetch wrapper
   Talks to the Spring Boot backend under /api/v1/*.
   ========================================================= */

(function (global) {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
  );

  // If ES_CONFIG was not already defined by env.js, initialize it with safe defaults
  if (!global.ES_CONFIG || !global.ES_CONFIG.API_BASE) {
    global.ES_CONFIG = {
      API_BASE: isLocalhost
        ? "http://localhost:7080/api/v1"
        : "https://its-1114-eventsphere-booking-platform.onrender.com/api/v1",
      PAYHERE_GATEWAY_URL: "https://sandbox.payhere.lk/pay/checkout",
      CLOUDINARY_CLOUD_NAME: "ze21miiw",
      CLOUDINARY_UPLOAD_PRESET: "eventsphere_preset"
    };
  }

  const ES_API_BASE = global.ES_CONFIG.API_BASE;
  const ES_TOKEN_KEY = 'es_token';
  const ES_USER_KEY = 'es_user';

  function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  const EsAuthStore = {
    getToken() {
      const token = localStorage.getItem(ES_TOKEN_KEY);
      if (!token) return null;
      const claims = parseJwt(token);
      if (claims && claims.exp) {
        if (Date.now() >= claims.exp * 1000 - 5000) {
          this.clear();
          return null;
        }
      }
      return token;
    },
    setToken(t) { localStorage.setItem(ES_TOKEN_KEY, t); },
    clear() { localStorage.removeItem(ES_TOKEN_KEY); localStorage.removeItem(ES_USER_KEY); },
    getUser() {
      if (!this.getToken()) return null;
      try { return JSON.parse(localStorage.getItem(ES_USER_KEY)); } catch (e) { return null; }
    },
    setUser(u) { localStorage.setItem(ES_USER_KEY, JSON.stringify(u)); },
    isLoggedIn() { return !!this.getToken(); },
    hasRole(role) {
      const u = this.getUser();
      if (!u || !u.roles || !Array.isArray(u.roles)) return false;
      const target = role.toUpperCase();
      const targetPrefixed = target.startsWith('ROLE_') ? target : `ROLE_${target}`;
      const targetClean = target.replace(/^ROLE_/, '');
      return u.roles.some(r => {
        const norm = String(r).toUpperCase();
        return norm === target || norm === targetPrefixed || norm === targetClean;
      });
    }
  };

  /**
   * esFetch — thin wrapper around fetch() for the EventSphere API.
   */
  async function esFetch(path, { method = 'GET', body, params, isForm = false } = {}) {
    let cleanPath = path || '';
    if (cleanPath.startsWith('/api/v1')) {
      cleanPath = cleanPath.substring(7);
    }
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    let url = `${global.ES_CONFIG.API_BASE}${cleanPath}`;
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
      fetchBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const res = await fetch(url, { method, headers, body: fetchBody });
      let payload = null;
      try { payload = await res.json(); } catch (e) { /* no body */ }

      if (!res.ok) {
        if (res.status === 401 && headers['Authorization']) {
          EsAuthStore.clear();
          // If this is a public GET request, retry once without the expired Authorization header
          const isProtected = ['/admin', '/organizer', '/bookings', '/users'].some(p => cleanPath.startsWith(p));
          if (method === 'GET' && !isProtected) {
            delete headers['Authorization'];
            try {
              const retryRes = await fetch(url, { method, headers, body: fetchBody });
              let retryPayload = null;
              try { retryPayload = await retryRes.json(); } catch (e) {}
              if (retryRes.ok) {
                if (retryPayload !== null && typeof retryPayload === 'object' && 'data' in retryPayload) {
                  return retryPayload.data !== undefined ? retryPayload.data : retryPayload;
                }
                return retryPayload;
              }
            } catch (retryErr) {
              /* fall through to error */
            }
          }
        }

        const message = (payload && payload.message) || `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.payload = payload;
        throw err;
      }
      if (payload !== null && typeof payload === 'object' && 'data' in payload) {
        return payload.data !== undefined ? payload.data : payload;
      }
      return payload;
    } catch (networkErr) {
      if (networkErr.status) throw networkErr;
      const err = new Error('Could not reach EventSphere servers.');
      err.status = 0;
      throw err;
    }
  }

  function esPathPrefix() {
    const isSubPage = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
    return { toRoot: isSubPage ? '../' : './', toPages: isSubPage ? '' : 'pages/' };
  }

  global.ES_API_BASE = ES_API_BASE;
  global.EsAuthStore = EsAuthStore;
  global.esFetch = esFetch;
  global.esPathPrefix = esPathPrefix;
})(typeof window !== 'undefined' ? window : this);