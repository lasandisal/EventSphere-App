/* Bookings API — matches BookingController (/api/v1/bookings/**) */
const BookingsAPI = {
  create(payload) {
    // payload: { eventId, items: [{ ticketTypeId, quantity, attendees:[{name,email}] }] }
    return esFetch('/bookings', { method: 'POST', body: payload });
  },
  getById(id) {
    return esFetch(`/bookings/${id}`);
  },
  myBookings({ page = 0, size = 10 } = {}) {
    return esFetch('/bookings', { params: { page, size } });
  },
  cancel(id) {
    return esFetch(`/bookings/${id}/cancel`, { method: 'PATCH' });
  }
};
window.BookingsAPI = BookingsAPI;
