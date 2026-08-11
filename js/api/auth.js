/* Auth API — matches AuthController (/api/v1/auth/**) */
const AuthAPI = {
  async register({ fullName, email, password, confirmPassword }) {
    const data = await esFetch('/auth/register', {
      method: 'POST',
      body: { fullName, email, password, confirmPassword }
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
    window.location.href = '/index.html';
  }
};
window.AuthAPI = AuthAPI;
