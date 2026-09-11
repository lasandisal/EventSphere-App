/* Organizer application API — matches OrganizerController (/api/v1/organizer/**) */
const OrganizerAPI = {
  apply(payload) {
    return esFetch('/organizer/apply', { method: 'POST', body: payload });
  },
  getMyProfile() {
    return esFetch('/organizer/me');
  },
  async updateProfile(payload) {
    try {
      return await esFetch('/organizer/profile', { method: 'PUT', body: payload });
    } catch (e) {
      try {
        return await esFetch('/organizer/me', { method: 'PUT', body: payload });
      } catch (e2) {
        return await esFetch('/organizer/profile', { method: 'PATCH', body: payload });
      }
    }
  },
  async getAnalyticsOverview({ skipCache = false, onRevalidate = null } = {}) {
    if (!skipCache && window.EsCache) {
      const cached = window.EsCache.getOrgAnalytics();
      if (cached) {
        if (typeof onRevalidate === 'function') {
          esFetch('/organizer/analytics/overview')
            .then(fresh => {
              if (fresh) {
                window.EsCache.setOrgAnalytics(fresh, 120);
                onRevalidate(fresh);
              }
            })
            .catch(err => console.warn('Background organizer analytics revalidation:', err));
        }
        return cached;
      }
    }
    const res = await esFetch('/organizer/analytics/overview');
    if (window.EsCache && res) {
      window.EsCache.setOrgAnalytics(res, 120);
    }
    return res;
  }
};

/* Check-in API — matches CheckInController (/api/v1/organizer/check-in/**) */
const CheckInAPI = {
  scan(signedPayload) {
    return esFetch('/organizer/check-in/scan', { method: 'POST', body: { signedPayload } });
  }
};

/* Admin API — matches AdminOrganizerController, AdminUserController */
const AdminAPI = {
  async getUsers(params = {}) {
    try {
      return await esFetch('/admin/users', { params });
    } catch (e) {
      if (params && Object.keys(params).length > 0) {
        // Fallback without query params in case backend expects no parameters
        return await esFetch('/admin/users');
      }
      throw e;
    }
  },
  async getAllOrganizers(params = {}) {
    return await esFetch('/admin/organizers/all', { params });
  },
  getPendingOrganizers() {
    return esFetch('/admin/organizers/pending');
  },
  verifyOrganizer(id) {
    if (window.EsCache) window.EsCache.invalidateAnalytics();
    return esFetch(`/admin/organizers/${id}/verify`, { method: 'PATCH' });
  },
  rejectOrganizer(id) {
    if (window.EsCache) window.EsCache.invalidateAnalytics();
    return esFetch(`/admin/organizers/${id}/reject`, { method: 'DELETE' });
  },
  promoteToAdmin(userId) {
    if (window.EsCache) window.EsCache.invalidateAnalytics();
    return esFetch(`/admin/users/${userId}/promote-to-admin`, { method: 'PATCH' });
  },
  async getAnalyticsOverview({ skipCache = false, onRevalidate = null } = {}) {
    if (!skipCache && window.EsCache) {
      const cached = window.EsCache.getAdminAnalytics();
      if (cached) {
        if (typeof onRevalidate === 'function') {
          esFetch('/admin/analytics/overview')
            .then(fresh => {
              if (fresh) {
                window.EsCache.setAdminAnalytics(fresh, 120);
                onRevalidate(fresh);
              }
            })
            .catch(err => console.warn('Background admin analytics revalidation:', err));
        }
        return cached;
      }
    }
    const res = await esFetch('/admin/analytics/overview');
    if (window.EsCache && res) {
      window.EsCache.setAdminAnalytics(res, 120);
    }
    return res;
  }
};

/* Assistant API — matches AssistantController (/api/v1/assistant/chat) */
const AssistantAPI = {
  chat(message, context) {
    return esFetch('/assistant/chat', { method: 'POST', body: { message, context } });
  }
};

window.OrganizerAPI = OrganizerAPI;
window.CheckInAPI = CheckInAPI;
window.AdminAPI = AdminAPI;
window.AssistantAPI = AssistantAPI;
