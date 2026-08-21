// =========================================================
// EventSphere — Platform Attendees & Bookings Module
// =========================================================

let allAttendeesCache = [];
let currentAttendeeStatusFilter = 'ALL';
let currentAttendeeEventFilter = 'ALL';

function isBookingConfirmed(status) {
  const s = String(status || '').toUpperCase();
  return s === 'CONFIRMED' || s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS';
}

function isBookingPending(status) {
  const s = String(status || '').toUpperCase();
  return s === 'PENDING' || s === 'UNPAID' || s === 'PROCESSING';
}

function isBookingCancelled(status) {
  const s = String(status || '').toUpperCase();
  return s === 'CANCELLED' || s === 'REFUNDED' || s === 'REJECTED' || s === 'FAILED';
}

// Load All Attendees across Platform Events
async function loadAllAttendees() {
  const tbody = document.getElementById('allAttendeesBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading platform attendees...</td></tr>`;

  try {
    const res = await EventsAPI.searchPublished({ page: 0, size: 50 });
    const events = Array.isArray(res) ? res : (res?.data || res?.content || []);

    if (!events.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4">No published events found</td></tr>`;
      return;
    }

    // Fetch bookings across all published events
    const bookingPromises = events.map(async (ev) => {
      try {
        const raw = await EventsAPI.getEventBookings(ev.id);
        const bList = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);
        return bList.map(b => ({
          ...b,
          eventId: ev.id,
          eventTitle: ev.title,
          organizerName: ev.organizerName || '—'
        }));
      } catch (err) {
        console.warn(`Could not load bookings for event ${ev.id}:`, err);
        return [];
      }
    });

    const results = await Promise.all(bookingPromises);
    allAttendeesCache = results.flat();

    // Populate Events Filter Dropdown
    populateEventFilterDropdown(events);

    // Update Counter Badges
    updateAttendeeFilterCounts();

    renderAllAttendeesTable();
  } catch (e) {
    console.error('Failed to load platform attendees:', e);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load attendees: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Populate Event dropdown filter
function populateEventFilterDropdown(events) {
  const select = document.getElementById('adminAttendeeEventFilter');
  if (!select) return;

  const currentVal = select.value || 'ALL';
  const eventOptions = events.map(ev => `<option value="${ev.id}">${ev.title}</option>`).join('');

  select.innerHTML = `
    <option value="ALL">All Events</option>
    ${eventOptions}
  `;
  select.value = currentVal;
}

// Update Filter Count Badges
function updateAttendeeFilterCounts() {
  const list = allAttendeesCache;
  const countAll = list.length;
  const countConfirmed = list.filter(b => isBookingConfirmed(b.status)).length;
  const countPending = list.filter(b => isBookingPending(b.status)).length;
  const countCancelled = list.filter(b => isBookingCancelled(b.status)).length;

  const allEl = document.getElementById('countAllAttendees');
  const confEl = document.getElementById('countConfirmedAttendees');
  const pendEl = document.getElementById('countPendingAttendees');
  const cancEl = document.getElementById('countCancelledAttendees');

  if (allEl) allEl.textContent = countAll;
  if (confEl) confEl.textContent = countConfirmed;
  if (pendEl) pendEl.textContent = countPending;
  if (cancEl) cancEl.textContent = countCancelled;
}

// Filter Tab Click Handler for Status
function filterAttendeesByStatus(statusFilter, clickedBtn) {
  currentAttendeeStatusFilter = statusFilter;
  if (clickedBtn) {
    document.querySelectorAll('#attendeeStatusFilterTabs .filter-pill').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
  }
  renderAllAttendeesTable();
}

// Filter Dropdown Change Handler for Event
function filterAttendeesByEvent(eventVal) {
  currentAttendeeEventFilter = eventVal;
  renderAllAttendeesTable();
}

// Render Platform Attendees Table with Filters & Search
function renderAllAttendeesTable() {
  const tbody = document.getElementById('allAttendeesBody');
  if (!tbody) return;

  const q = (document.getElementById('adminAttendeeSearch')?.value || '').toLowerCase().trim();

  let filtered = allAttendeesCache.filter(b => {
    // 1. Status Filter
    const st = b.status || 'CONFIRMED';
    if (currentAttendeeStatusFilter === 'CONFIRMED' && !isBookingConfirmed(st)) return false;
    if (currentAttendeeStatusFilter === 'PENDING' && !isBookingPending(st)) return false;
    if (currentAttendeeStatusFilter === 'CANCELLED' && !isBookingCancelled(st)) return false;

    // 2. Event Filter
    if (currentAttendeeEventFilter !== 'ALL') {
      if (String(b.eventId) !== String(currentAttendeeEventFilter) && String(b.eventTitle) !== String(currentAttendeeEventFilter)) {
        return false;
      }
    }

    // 3. Search Query Filter
    if (q) {
      const name = (b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || '').toLowerCase();
      const email = (b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '').toLowerCase();
      const evTitle = (b.eventTitle || '').toLowerCase();
      const ref = (b.bookingReference || b.bookingId || `#${b.id}`).toLowerCase();
      const org = (b.organizerName || '').toLowerCase();
      const ticket = (b.ticketTypeName || b.ticketType || '').toLowerCase();

      return name.includes(q) || email.includes(q) || evTitle.includes(q) || ref.includes(q) || org.includes(q) || ticket.includes(q);
    }

    return true;
  });

  if (!filtered.length) {
    let emptyMsg = 'No attendees or bookings found.';
    if (currentAttendeeStatusFilter !== 'ALL') emptyMsg = `No ${currentAttendeeStatusFilter.toLowerCase()} bookings found.`;
    if (q) emptyMsg += ` matching "${q}".`;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted-soft py-5">
          <i class="bi bi-people fs-2 text-muted d-block mb-2"></i>
          ${emptyMsg}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const ref = b.bookingReference || b.bookingId || `#${b.id}`;
    const name = b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || 'Attendee';
    const email = b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '—';
    const evTitle = b.eventTitle || '—';
    const org = b.organizerName || '—';
    const ticketType = b.ticketTypeName || b.ticketType || 'General';
    const qty = b.ticketCount || b.quantity || 1;
    const amount = b.totalPrice != null ? `LKR ${Number(b.totalPrice).toLocaleString()}` : (b.totalAmount != null ? `LKR ${Number(b.totalAmount).toLocaleString()}` : 'Free');
    const bDate = b.createdAt || b.bookingDate ? new Date(b.createdAt || b.bookingDate).toLocaleDateString() : '—';
    const rawStatus = (b.status || 'CONFIRMED').toUpperCase();

    let statusBadge = '<span class="status-badge status-confirmed">Confirmed</span>';
    if (isBookingPending(rawStatus)) {
      statusBadge = '<span class="status-badge status-pending">Pending</span>';
    } else if (isBookingCancelled(rawStatus)) {
      statusBadge = '<span class="status-badge status-cancelled">Cancelled</span>';
    }

    return `
      <tr>
        <td data-label="Attendee & Contact">
          <div class="fw-semibold text-white">${name}</div>
          <div class="small text-muted-soft">${email}</div>
        </td>
        <td data-label="Event & Organizer">
          <div class="fw-semibold text-white">${evTitle}</div>
          <div class="small text-muted-soft">${org}</div>
        </td>
        <td data-label="Booking Ref"><code>${ref}</code></td>
        <td data-label="Tickets & Type">
          <span class="pill-badge pill-beige me-1" style="font-size:0.65rem;">${ticketType}</span>
          <span class="fw-bold text-white">×${qty}</span>
        </td>
        <td data-label="Total Paid"><strong class="text-white">${amount}</strong></td>
        <td data-label="Booking Date" class="small text-muted-soft">${bDate}</td>
        <td data-label="Status">${statusBadge}</td>
      </tr>`;
  }).join('');
}

// Live search on Platform Attendees table
document.getElementById('adminAttendeeSearch')?.addEventListener('input', () => {
  renderAllAttendeesTable();
});

