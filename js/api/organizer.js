/* Organizer application API — matches OrganizerController (/api/v1/organizer/**) */
const OrganizerAPI = {
  apply(payload) {
    return esFetch('/organizer/apply', { method: 'POST', body: payload });
  },
  getMyProfile() {
    return esFetch('/organizer/me');
  }
};

/* Check-in API — matches CheckInController (/api/v1/organizer/check-in/**) */
const CheckInAPI = {
  scan(qrPayload) {
    return esFetch('/organizer/check-in/scan', { method: 'POST', body: { qrPayload } });
  }
};

/* Admin API — matches AdminOrganizerController, AdminUserController */
const AdminAPI = {
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
