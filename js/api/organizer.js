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
    return esFetch(`/admin/organizers/${id}/verify`, { method: 'PATCH' });
  },
  rejectOrganizer(id) {
    return esFetch(`/admin/organizers/${id}/reject`, { method: 'DELETE' });
  },
  promoteToAdmin(userId) {
    return esFetch(`/admin/users/${userId}/promote-to-admin`, { method: 'PATCH' });
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
