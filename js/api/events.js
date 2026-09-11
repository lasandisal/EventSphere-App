/* Events / Categories / Venues API with Intelligent Caching & SWR */

(function (global) {
  const esFetch = (...args) => (global.esFetch || (typeof window !== 'undefined' ? window.esFetch : null))(...args);

  function invalidateEventCaches(id) {
    if (global.EsCache) {
      if (id) global.EsCache.invalidateEvent(id);
      global.EsCache.clear('events_search_');
      global.EsCache.clear('org_events_');
      global.EsCache.invalidateAnalytics();
    }
    if (typeof window !== 'undefined') {
      window.myEventsCache = [];
    }
  }

  const EventsAPI = {
    // Public — EventController
    async searchPublished({ keyword, categoryId, page = 0, size = 10, skipCache = false, onRevalidate = null } = {}) {
      const searchKey = `${keyword || ''}_${categoryId || ''}_${page}_${size}`;
      if (!skipCache && global.EsCache) {
        const cached = global.EsCache.getSearch(searchKey);
        if (cached) {
          if (typeof onRevalidate === 'function') {
            esFetch('/events', { params: { keyword, categoryId, page, size } })
              .then(fresh => {
                if (fresh) {
                  global.EsCache.setSearch(searchKey, fresh);
                  const list = Array.isArray(fresh) ? fresh : (fresh?.content || []);
                  global.EsCache.seedEvents(list);
                  onRevalidate(fresh);
                }
              })
              .catch(err => console.warn('Background search revalidation:', err));
          }
          return cached;
        }
      }

      const res = await esFetch('/events', { params: { keyword, categoryId, page, size } });
      if (global.EsCache && res) {
        global.EsCache.setSearch(searchKey, res);
        const list = Array.isArray(res) ? res : (res?.content || []);
        global.EsCache.seedEvents(list);
      }
      return res;
    },

    async getById(id, { skipCache = false, onRevalidate = null } = {}) {
      if (!skipCache && global.EsCache) {
        const cached = global.EsCache.getEvent(id);
        if (cached) {
          // If caller supplied onRevalidate callback, perform silent background refresh
          if (typeof onRevalidate === 'function') {
            esFetch(`/events/${id}`)
              .then(fresh => {
                if (fresh) {
                  global.EsCache.setEvent(id, fresh);
                  onRevalidate(fresh);
                }
              })
              .catch(err => console.warn('Background event revalidation:', err));
          }
          return cached;
        }
      }

      const res = await esFetch(`/events/${id}`);
      if (global.EsCache && res) {
        global.EsCache.setEvent(id, res);
      }
      return res;
    },

    // Organizer — OrganizerEventController (/api/v1/organizer/events/**)
    async createEvent(payload) {
      const res = await esFetch('/organizer/events', { method: 'POST', body: payload });
      invalidateEventCaches();
      return res;
    },
    async updateEvent(id, payload) {
      const res = await esFetch(`/organizer/events/${id}`, { method: 'PUT', body: payload });
      invalidateEventCaches(id);
      return res;
    },
    async publishEvent(id) {
      const res = await esFetch(`/organizer/events/${id}/publish`, { method: 'PATCH' });
      invalidateEventCaches(id);
      return res;
    },
    async cancelEvent(id, reason = null) {
      const opts = { method: 'PATCH' };
      if (reason && typeof reason === 'string' && reason.trim()) {
        opts.body = { reason: reason.trim() };
      }
      const res = await esFetch(`/organizer/events/${id}/cancel`, opts);
      invalidateEventCaches(id);
      return res;
    },
    async myEvents({ page = 0, size = 50, skipCache = false, onRevalidate = null } = {}) {
      const cacheKey = `org_events_${page}_${size}`;
      if (!skipCache && global.EsCache) {
        const cached = global.EsCache.get(cacheKey);
        if (cached) {
          if (typeof onRevalidate === 'function') {
            esFetch('/organizer/events/my-events', { params: { page, size } })
              .then(fresh => {
                if (fresh) {
                  global.EsCache.set(cacheKey, fresh, 120);
                  onRevalidate(fresh);
                }
              })
              .catch(err => console.warn('Background myEvents revalidation:', err));
          }
          return cached;
        }
      }
      const res = await esFetch('/organizer/events/my-events', { params: { page, size } });
      if (global.EsCache && res) {
        global.EsCache.set(cacheKey, res, 120);
      }
      return res;
    },
    async addTicketType(eventId, payload) {
      const res = await esFetch(`/organizer/events/${eventId}/ticket-types`, { method: 'POST', body: payload });
      invalidateEventCaches(eventId);
      return res;
    },
    getEventBookings(eventId) {
      return esFetch(`/organizer/events/${eventId}/bookings`);
    }
  };

  const CategoriesAPI = {
    async getAll({ skipCache = false, onRevalidate = null } = {}) {
      if (!skipCache && global.EsCache) {
        const cached = global.EsCache.getCategories();
        if (cached) {
          if (typeof onRevalidate === 'function') {
            esFetch('/categories')
              .then(fresh => {
                if (fresh) {
                  global.EsCache.setCategories(fresh);
                  onRevalidate(fresh);
                }
              })
              .catch(err => console.warn('Background categories revalidation:', err));
          }
          return cached;
        }
      }
      const res = await esFetch('/categories');
      if (global.EsCache && res) {
        global.EsCache.setCategories(res);
      }
      return res;
    },
    getById(id) { return esFetch(`/categories/${id}`); },
    // Admin — AdminCategoryController
    async create(payload) {
      const res = await esFetch('/admin/categories', { method: 'POST', body: payload });
      if (global.EsCache) {
        global.EsCache.remove('categories_all');
        global.EsCache.clear('events_search_');
      }
      return res;
    },
    async update(id, payload) {
      const res = await esFetch(`/admin/categories/${id}`, { method: 'PUT', body: payload });
      if (global.EsCache) {
        global.EsCache.remove('categories_all');
        global.EsCache.clear('events_search_');
      }
      return res;
    },
    async remove(id) {
      const res = await esFetch(`/admin/categories/${id}`, { method: 'DELETE' });
      if (global.EsCache) {
        global.EsCache.remove('categories_all');
        global.EsCache.clear('events_search_');
      }
      return res;
    }
  };

  const VenuesAPI = {
    async getAll({ skipCache = false } = {}) {
      if (!skipCache && global.EsCache) {
        const cached = global.EsCache.get('venues_all');
        if (cached) return cached;
      }
      const res = await esFetch('/venues');
      if (global.EsCache && res) {
        global.EsCache.set('venues_all', res, 1800);
      }
      return res;
    },
    getById(id) { return esFetch(`/venues/${id}`); },
    async createCustom(payload) {
      const res = await esFetch('/organizer/venues', { method: 'POST', body: payload });
      if (global.EsCache) global.EsCache.remove('venues_all');
      return res;
    },
    // Admin — AdminVenueController
    async create(payload) {
      const res = await esFetch('/admin/venues', { method: 'POST', body: payload });
      if (global.EsCache) global.EsCache.remove('venues_all');
      return res;
    },
    async update(id, payload) {
      const res = await esFetch(`/admin/venues/${id}`, { method: 'PUT', body: payload });
      if (global.EsCache) global.EsCache.remove('venues_all');
      return res;
    },
    async remove(id) {
      const res = await esFetch(`/admin/venues/${id}`, { method: 'DELETE' });
      if (global.EsCache) global.EsCache.remove('venues_all');
      return res;
    }
  };

  global.EventsAPI = EventsAPI;
  global.CategoriesAPI = CategoriesAPI;
  global.VenuesAPI = VenuesAPI;
})(typeof window !== 'undefined' ? window : this);
