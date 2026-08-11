/* Events / Categories / Venues API */

const EventsAPI = {
  // Public — EventController
  searchPublished({ keyword, categoryId, page = 0, size = 10 } = {}) {
    return esFetch('/events', { params: { keyword, categoryId, page, size } });
  },
  getById(id) {
    return esFetch(`/events/${id}`);
  },

  // Organizer — OrganizerEventController (/api/v1/organizer/events/**)
  createEvent(payload) {
    return esFetch('/organizer/events', { method: 'POST', body: payload });
  },
  updateEvent(id, payload) {
    return esFetch(`/organizer/events/${id}`, { method: 'PUT', body: payload });
  },
  publishEvent(id) {
    return esFetch(`/organizer/events/${id}/publish`, { method: 'PATCH' });
  },
  cancelEvent(id) {
    return esFetch(`/organizer/events/${id}/cancel`, { method: 'PATCH' });
  },
  myEvents({ page = 0, size = 10 } = {}) {
    return esFetch('/organizer/events/my-events', { params: { page, size } });
  },
  addTicketType(eventId, payload) {
    return esFetch(`/organizer/events/${eventId}/ticket-types`, { method: 'POST', body: payload });
  }
};

const CategoriesAPI = {
  getAll() { return esFetch('/categories'); },
  getById(id) { return esFetch(`/categories/${id}`); },
  // Admin — AdminCategoryController
  create(payload) { return esFetch('/admin/categories', { method: 'POST', body: payload }); },
  update(id, payload) { return esFetch(`/admin/categories/${id}`, { method: 'PUT', body: payload }); },
  remove(id) { return esFetch(`/admin/categories/${id}`, { method: 'DELETE' }); }
};

const VenuesAPI = {
  getAll() { return esFetch('/venues'); },
  getById(id) { return esFetch(`/venues/${id}`); },
  // Admin — AdminVenueController
  create(payload) { return esFetch('/admin/venues', { method: 'POST', body: payload }); },
  update(id, payload) { return esFetch(`/admin/venues/${id}`, { method: 'PUT', body: payload }); },
  remove(id) { return esFetch(`/admin/venues/${id}`, { method: 'DELETE' }); }
};

window.EventsAPI = EventsAPI;
window.CategoriesAPI = CategoriesAPI;
window.VenuesAPI = VenuesAPI;
