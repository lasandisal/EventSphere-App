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

  async verifyOtp({ email, otp }) {
    const data = await esFetch('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp }
    });
    if (data && data.token) {
      EsAuthStore.setToken(data.token);
      EsAuthStore.setUser(data.user || data);
    }
    return data;
  },

  async resendOtp({ email }) {
    return await esFetch('/auth/resend-otp', {
      method: 'POST',
      body: { email }
    });
  },

  logout() {
    EsAuthStore.clear();
    window.location.href = esPathPrefix().toRoot + 'index.html';
  },

  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    try {
      return await esFetch('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmPassword }
      });
    } catch (e) {
      try {
        return await esFetch('/users/change-password', {
          method: 'PUT',
          body: { currentPassword, newPassword, confirmPassword }
        });
      } catch (e2) {
        return await esFetch('/users/password', {
          method: 'PATCH',
          body: { currentPassword, newPassword, confirmPassword }
        });
      }
    }
  },

  async updateUserProfile(payload) {
    try {
      const data = await esFetch('/users/profile', { method: 'PUT', body: payload });
      if (data) {
        const u = EsAuthStore.getUser() || {};
        EsAuthStore.setUser({ ...u, ...(data.data || data) });
      }
      return data;
    } catch (e) {
      const data = await esFetch('/users/me', { method: 'PATCH', body: payload });
      if (data) {
        const u = EsAuthStore.getUser() || {};
        EsAuthStore.setUser({ ...u, ...(data.data || data) });
      }
      return data;
    }
  }
};
window.AuthAPI = AuthAPI;
window.UserAPI = {
  changePassword: AuthAPI.changePassword,
  updateProfile: AuthAPI.updateUserProfile
};
