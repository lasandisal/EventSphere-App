/* Auth API — matches AuthController (/api/v1/auth/**) */
const AuthAPI = {
  async register({ fullName, email, password, confirmPassword, accountType }) {
    const data = await esFetch('/auth/register', {
      method: 'POST',
      body: { fullName, email, password, confirmPassword, accountType }
    });
    if (data && data.token) {
      EsAuthStore.setToken(data.token);
      EsAuthStore.setUser(data.user || data);
    }
    return data;
  },

  async login({ email, password }) {
    const data = await esFetch('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (data && data.token) {
      EsAuthStore.setToken(data.token);
      EsAuthStore.setUser(data.user || data);
    }
    return data;
  },

  logout() {
    EsAuthStore.clear();
    window.location.href = esPathPrefix().toRoot + 'index.html';
  }
};
window.AuthAPI = AuthAPI;
