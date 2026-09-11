/* Bookings API — matches BookingController (/api/v1/bookings/**) with User-Scoped Cache & SWR */

(function (global) {
  const esFetch = (...args) => (global.esFetch || (typeof window !== 'undefined' ? window.esFetch : null))(...args);

  function getCurrentUserId() {
    const user = global.EsAuthStore?.getUser();
    return user?.id || user?.userId || 'me';
  }

  const BookingsAPI = {
    async create(payload) {
      // payload: { eventId, items: [{ ticketTypeId, quantity, attendees:[{name,email}] }] }
      const res = await esFetch('/bookings', { method: 'POST', body: payload });
      // Invalidate bookings cache upon creating a new reservation
      if (global.EsCache) {
        global.EsCache.invalidateUserBookings(getCurrentUserId());
        if (payload?.eventId) {
          global.EsCache.invalidateEvent(payload.eventId);
        }
      }
      return res;
    },

    async getById(id, { skipCache = false, onRevalidate = null } = {}) {
      if (!skipCache && global.EsCache) {
        const cached = global.EsCache.getBooking(id);
        if (cached) {
          if (typeof onRevalidate === 'function') {
            esFetch(`/bookings/${id}`)
              .then(fresh => {
                if (fresh) {
                  global.EsCache.setBooking(id, fresh);
                  onRevalidate(fresh);
                }
              })
              .catch(err => console.warn('Background booking revalidation:', err));
          }
          return cached;
        }
      }

      const res = await esFetch(`/bookings/${id}`);
      if (global.EsCache && res) {
        global.EsCache.setBooking(id, res);
      }
      return res;
    },

    async myBookings({ page = 0, size = 50, tab, skipCache = false, onRevalidate = null } = {}) {
      const uid = getCurrentUserId();
      const cacheKey = `${uid}_${page}_${size}_${tab || 'all'}`;

      if (!skipCache && global.EsCache) {
        const cached = global.EsCache.get(`user_bookings_${cacheKey}`);
        if (cached) {
          if (typeof onRevalidate === 'function') {
            esFetch('/bookings', { params: { page, size, tab } })
              .then(fresh => {
                if (fresh) {
                  global.EsCache.set(`user_bookings_${cacheKey}`, fresh, 180); // 3 min TTL
                  onRevalidate(fresh);
                }
              })
              .catch(err => console.warn('Background myBookings revalidation:', err));
          }
          return cached;
        }
      }

      const res = await esFetch('/bookings', { params: { page, size, tab } });
      if (global.EsCache && res) {
        global.EsCache.set(`user_bookings_${cacheKey}`, res, 180);
      }
      return res;
    },

    async cancel(id) {
      const res = await esFetch(`/bookings/${id}/cancel`, { method: 'PATCH' });
      if (global.EsCache) {
        global.EsCache.invalidateUserBookings(getCurrentUserId());
        global.EsCache.remove(`booking_${id}`);
      }
      return res;
    }
  };

  global.BookingsAPI = BookingsAPI;
})(typeof window !== 'undefined' ? window : this);

