// =========================================================
// EventSphere — Organizer Attendees Module
// =========================================================

let orgAttendeesCache = [];

// Load Attendees across all organizer events
async function loadOrganizerAttendees() {
  const tbody = document.getElementById('attendeesBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading attendees...</td></tr>`;

  try {
    const res = await EventsAPI.myEvents({ page: 0, size: 50 });
    const events = Array.isArray(res) ? res : (res?.data || res?.content || []);

    if (!events.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4">No events found yet.</td></tr>`;
      orgAttendeesCache = [];
      return;
    }

    const bookingPromises = events.map(async (ev) => {
      try {
        const raw = await EventsAPI.getEventBookings(ev.id);
        const bList = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);
        return bList.map(b => ({ ...b, eventTitle: ev.title }));
      } catch (err) {
        console.warn(`Could not load attendees for event ${ev.id}:`, err);
        return [];
      }
    });

    const results = await Promise.all(bookingPromises);
    orgAttendeesCache = results.flat();

    renderOrganizerAttendeesTable();
  } catch (e) {
    console.error('Failed to load organizer attendees:', e);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load attendees: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Render Attendees Table with filter
function renderOrganizerAttendeesTable(keyword = '') {
  const tbody = document.getElementById('attendeesBody');
  if (!tbody) return;

  const q = (keyword || document.getElementById('orgAttendeeSearchInput')?.value || '').toLowerCase().trim();

  let filtered = orgAttendeesCache;
  if (q) {
    filtered = orgAttendeesCache.filter(b => {
      const name = (b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || '').toLowerCase();
      const email = (b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '').toLowerCase();
      const ev = (b.eventTitle || '').toLowerCase();
      const code = (b.ticketCode || b.ticketId || b.bookingReference || `#${b.id}`).toLowerCase();
      return name.includes(q) || email.includes(q) || ev.includes(q) || code.includes(q);
    });
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted-soft py-5">
          <i class="bi bi-people fs-2 text-muted d-block mb-2"></i>
          No registered attendees found.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const name = b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || 'Attendee';
    const email = b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '—';
    const evTitle = b.eventTitle || '—';
    const ticketType = b.ticketTypeName || b.ticketType || 'General';
    const ticketId = b.ticketCode || b.ticketId || b.bookingReference || `#${b.id}`;
    const bookingRef = b.bookingReference || `#${b.id}`;
    const isCheckedIn = b.checkedIn || b.checkInStatus === 'CHECKED_IN' || b.status === 'CHECKED_IN';

    return `
      <tr>
        <td data-label="Name"><span class="fw-semibold text-white">${name}</span></td>
        <td data-label="Email" class="small text-muted-soft">${email}</td>
        <td data-label="Event" class="text-white">${evTitle}</td>
        <td data-label="Ticket Type"><span class="pill-badge pill-beige">${ticketType}</span></td>
        <td data-label="Ticket ID"><code>${ticketId}</code></td>
        <td data-label="Booking"><span class="small text-muted-soft">${bookingRef}</span></td>
        <td data-label="Check-in">
          ${isCheckedIn 
            ? '<span class="status-badge status-confirmed"><i class="bi bi-check-circle me-1"></i>Checked-in</span>' 
            : '<span class="status-badge status-pending">Not Checked-in</span>'}
        </td>
      </tr>`;
  }).join('');
}

// Live search listener on Attendees
document.getElementById('orgAttendeeSearchInput')?.addEventListener('input', (e) => {
  renderOrganizerAttendeesTable(e.target.value);
});
