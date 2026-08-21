// =========================================================
// EventSphere — Organizer Bookings Module
// =========================================================

let orgBookingsCache = [];

// Load Bookings across all organizer events
async function loadOrganizerBookings() {
  const tbody = document.getElementById('bookingsBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading bookings...</td></tr>`;

  try {
    const res = await EventsAPI.myEvents({ page: 0, size: 50 });
    const events = Array.isArray(res) ? res : (res?.data || res?.content || []);

    if (!events.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4">No events found yet.</td></tr>`;
      orgBookingsCache = [];
      return;
    }

    const bookingPromises = events.map(async (ev) => {
      try {
        const raw = await EventsAPI.getEventBookings(ev.id);
        const bList = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);
        return bList.map(b => ({ ...b, eventTitle: ev.title }));
      } catch (err) {
        console.warn(`Could not load bookings for event ${ev.id}:`, err);
        return [];
      }
    });

    const results = await Promise.all(bookingPromises);
    orgBookingsCache = results.flat();

    renderOrganizerBookingsTable();
  } catch (e) {
    console.error('Failed to load organizer bookings:', e);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load bookings: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Render Bookings Table with filter
function renderOrganizerBookingsTable(keyword = '') {
  const tbody = document.getElementById('bookingsBody');
  if (!tbody) return;

  const q = (keyword || document.getElementById('orgBookingSearchInput')?.value || '').toLowerCase().trim();

  let filtered = orgBookingsCache;
  if (q) {
    filtered = orgBookingsCache.filter(b => {
      const ref = (b.bookingReference || b.bookingId || `#${b.id}`).toLowerCase();
      const ev = (b.eventTitle || '').toLowerCase();
      const name = (b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || '').toLowerCase();
      return ref.includes(q) || ev.includes(q) || name.includes(q);
    });
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted-soft py-5">
          <i class="bi bi-ticket-perforated fs-2 text-muted d-block mb-2"></i>
          No bookings placed for your events yet.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const ref = b.bookingReference || b.bookingId || `#${b.id}`;
    const evTitle = b.eventTitle || '—';
    const name = b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || 'Attendee';
    const qty = b.ticketCount || b.quantity || 1;
    const ticketType = b.ticketTypeName || b.ticketType || 'General';
    const amount = b.totalPrice != null ? `LKR ${Number(b.totalPrice).toLocaleString()}` : (b.totalAmount != null ? `LKR ${Number(b.totalAmount).toLocaleString()}` : 'Free');
    const status = (b.status || 'CONFIRMED').toUpperCase();
    const statusCls = status === 'CONFIRMED' ? 'status-confirmed' : (status === 'CANCELLED' ? 'status-cancelled' : 'status-pending');

    return `
      <tr>
        <td data-label="Booking Ref"><code>${ref}</code></td>
        <td data-label="Event"><span class="fw-semibold text-white">${evTitle}</span></td>
        <td data-label="Attendee" class="text-white">${name}</td>
        <td data-label="Tickets">${ticketType} × <strong class="text-white">${qty}</strong></td>
        <td data-label="Total"><strong class="text-white">${amount}</strong></td>
        <td data-label="Status"><span class="status-badge ${statusCls}">${status}</span></td>
      </tr>`;
  }).join('');
}

// Live search listener on Bookings
document.getElementById('orgBookingSearchInput')?.addEventListener('input', (e) => {
  renderOrganizerBookingsTable(e.target.value);
});
