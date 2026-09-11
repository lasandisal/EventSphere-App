// =========================================================
// EventSphere — Organizer Bookings Module
// Handles multi-event order tracking, date disambiguation,
// and cross-event search.
// =========================================================

let orgBookingsCache = window.orgBookingsCache || [];
let orgBookingsPromise = null;

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Shared loader so Bookings, Attendees, and Analytics reuse one bookings list
async function getSharedOrganizerBookings(forceRefresh = false) {
  if (!forceRefresh && window.orgBookingsCache && window.orgBookingsCache.length > 0) {
    orgBookingsCache = window.orgBookingsCache;
    return orgBookingsCache;
  }
  if (!forceRefresh && orgBookingsPromise) {
    return orgBookingsPromise;
  }

  orgBookingsPromise = (async () => {
    try {
      const getEventsFn = window.getSharedOrganizerEvents || (async () => {
        const res = await EventsAPI.myEvents({ page: 0, size: 50 });
        return Array.isArray(res) ? res : (res?.data || res?.content || []);
      });

      const events = await getEventsFn(forceRefresh);
      if (!events || !events.length) {
        orgBookingsCache = [];
        window.orgBookingsCache = [];
        return [];
      }

      // Populate Event Filter dropdown with date/ID disambiguation
      populateOrgBookingEventFilter(events);

      // Fetch in gentle batches of 2 to avoid overwhelming cloud backend connection pools
      const allBookings = [];
      const batchSize = 2;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (ev) => {
            try {
              const raw = await EventsAPI.getEventBookings(ev.id);
              const bList = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);
              return bList.map(b => ({
                ...b,
                eventId: ev.id,
                eventTitle: ev.title,
                eventStartDatetime: ev.startDatetime,
                eventEndDatetime: ev.endDatetime,
                eventVenue: ev.venueName || (ev.venue && ev.venue.name) || (ev.venue && ev.venue.city) || '',
                eventStatus: ev.status
              }));
            } catch (err) {
              console.warn(`Could not load bookings for event ${ev.id}:`, err);
              return [];
            }
          })
        );
        allBookings.push(...batchResults.flat());
      }

      orgBookingsCache = allBookings;
      window.orgBookingsCache = allBookings;
      return allBookings;
    } finally {
      orgBookingsPromise = null;
    }
  })();

  return orgBookingsPromise;
}

window.getSharedOrganizerBookings = getSharedOrganizerBookings;
window.orgBookingsCache = orgBookingsCache;

// Populate Event Filter Dropdown with date and ID disambiguation
function populateOrgBookingEventFilter(events) {
  const select = document.getElementById('orgBookingEventFilter');
  if (!select) return;

  const currentVal = select.value || 'ALL';
  const options = (events || []).map(ev => {
    const dateStr = ev.startDatetime ? new Date(ev.startDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Date TBA';
    const venue = ev.venueName || (ev.venue && ev.venue.name) || '';
    return `<option value="${ev.id}">${escapeHtml(ev.title)} — ${dateStr} (#${ev.id})${venue ? ` [${escapeHtml(venue)}]` : ''}</option>`;
  }).join('');

  select.innerHTML = `<option value="ALL">All Events (Entire Portfolio)</option>${options}`;
  select.value = currentVal;
}

// Load Bookings across all organizer events
async function loadOrganizerBookings(forceRefresh = false) {
  const tbody = document.getElementById('bookingsBody');
  if (!tbody) return;

  if (!orgBookingsCache.length || forceRefresh) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading bookings...</td></tr>`;
  }

  try {
    const list = await getSharedOrganizerBookings(forceRefresh);
    orgBookingsCache = list;
    window.orgBookingsCache = list;

    renderOrganizerBookingsTable();
  } catch (e) {
    console.error('Failed to load organizer bookings:', e);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load bookings: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Render Bookings Table with filter & date disambiguation
function renderOrganizerBookingsTable(keyword = '') {
  const tbody = document.getElementById('bookingsBody');
  if (!tbody) return;

  const q = (keyword || document.getElementById('orgBookingSearchInput')?.value || '').toLowerCase().trim();
  const selectedEvent = document.getElementById('orgBookingEventFilter')?.value || 'ALL';

  let filtered = orgBookingsCache;

  // 1. Filter by specific event
  if (selectedEvent !== 'ALL') {
    filtered = filtered.filter(b => String(b.eventId) === String(selectedEvent));
  }

  // 2. Multi-field search across Attendee, Ref, Title, Date, ID, Venue
  if (q) {
    filtered = filtered.filter(b => {
      const ref = (b.bookingReference || b.bookingId || `#${b.id}`).toLowerCase();
      const evTitle = (b.eventTitle || '').toLowerCase();
      const evId = String(b.eventId || '');
      const evDate = b.eventStartDatetime ? new Date(b.eventStartDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }).toLowerCase() : '';
      const evDateIso = b.eventStartDatetime ? String(b.eventStartDatetime).toLowerCase() : '';
      const evVenue = (b.eventVenue || '').toLowerCase();
      const name = (b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || '').toLowerCase();
      const email = (b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '').toLowerCase();
      const ticketType = (b.ticketTypeName || b.ticketType || '').toLowerCase();

      return ref.includes(q) ||
        evTitle.includes(q) ||
        evId === q ||
        (`#${evId}`) === q ||
        evDate.includes(q) ||
        evDateIso.includes(q) ||
        evVenue.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        ticketType.includes(q);
    });
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted-soft py-5">
          <i class="bi bi-ticket-perforated fs-2 text-muted d-block mb-2"></i>
          ${q || selectedEvent !== 'ALL' ? 'No bookings found matching your search or event filter.' : 'No bookings placed for your events yet.'}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const ref = b.bookingReference || b.bookingId || `#${b.id}`;
    const evTitle = b.eventTitle || '—';
    const evDateStr = b.eventStartDatetime ? new Date(b.eventStartDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Date TBA';
    const evVenue = b.eventVenue || '';
    const name = b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || 'Attendee';
    const qty = b.ticketCount || b.quantity || 1;
    const ticketType = b.ticketTypeName || b.ticketType || 'General';
    const amount = b.totalPrice != null ? `LKR ${Number(b.totalPrice).toLocaleString()}` : (b.totalAmount != null ? `LKR ${Number(b.totalAmount).toLocaleString()}` : 'Free');
    const status = (b.status || 'CONFIRMED').toUpperCase();
    const statusCls = status === 'CONFIRMED' ? 'status-confirmed' : (status === 'CANCELLED' ? 'status-cancelled' : 'status-pending');

    return `
      <tr>
        <td data-label="Booking Ref"><code>${escapeHtml(ref)}</code></td>
        <td data-label="Event (Date & Venue)">
          <div class="fw-bold text-white">${escapeHtml(evTitle)}</div>
          <div class="small text-muted-soft d-flex flex-wrap align-items-center gap-2 mt-1">
            <span><i class="bi bi-calendar3 text-primary me-1"></i>${evDateStr}</span>
            ${evVenue ? `<span><i class="bi bi-geo-alt text-primary me-1"></i>${escapeHtml(evVenue)}</span>` : ''}
            <span class="badge font-monospace" style="background:rgba(255,255,255,0.08); font-size:0.7rem; color:#E0E7FF;">#${b.eventId || '—'}</span>
          </div>
        </td>
        <td data-label="Attendee" class="text-white">${escapeHtml(name)}</td>
        <td data-label="Tickets">${escapeHtml(ticketType)} × <strong class="text-white">${qty}</strong></td>
        <td data-label="Total"><strong class="text-white">${amount}</strong></td>
        <td data-label="Status"><span class="status-badge ${statusCls}">${status}</span></td>
      </tr>`;
  }).join('');
}

// Live search listener on Bookings
document.getElementById('orgBookingSearchInput')?.addEventListener('input', (e) => {
  renderOrganizerBookingsTable(e.target.value);
});

// Event filter listener on Bookings
document.getElementById('orgBookingEventFilter')?.addEventListener('change', () => {
  renderOrganizerBookingsTable();
});
