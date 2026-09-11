// =========================================================
// EventSphere — Organizer Attendees & Gate Desk Module
// Handles multi-event guest lists, date disambiguation,
// individual ticket expansion, and interactive check-in.
// =========================================================

let orgAttendeesCache = [];

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatLocalTime(isoStr) {
  if (!isoStr) return '';
  let str = String(isoStr).trim();
  if (!str.endsWith('Z') && !str.includes('+') && !str.includes('Z')) {
    str += 'Z';
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Populate Event Filter dropdown for Attendees
function populateOrgAttendeeEventFilter(events) {
  const select = document.getElementById('orgAttendeeEventFilter');
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

// Load Attendees across all organizer events
async function loadOrganizerAttendees(forceRefresh = false) {
  const tbody = document.getElementById('attendeesBody');
  if (!tbody) return;

  if (!orgAttendeesCache.length || forceRefresh) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading guest list & tickets...</td></tr>`;
  }

  try {
    const getEventsFn = window.getSharedOrganizerEvents || (async () => {
      const res = await EventsAPI.myEvents({ page: 0, size: 50 });
      return Array.isArray(res) ? res : (res?.data || res?.content || []);
    });
    const events = await getEventsFn(forceRefresh);
    populateOrgAttendeeEventFilter(events);

    const getBookingsFn = window.getSharedOrganizerBookings || (async () => []);
    const bList = await getBookingsFn(forceRefresh);

    // Expand bookings into individual ticket attendee passes
    const expanded = [];
    (bList || []).forEach(b => {
      if (b.tickets && Array.isArray(b.tickets) && b.tickets.length > 0) {
        b.tickets.forEach((t, idx) => {
          const isCheckedIn = t.status === 'USED' || t.status === 'CHECKED_IN' || t.checkedIn === true || b.checkedIn === true || b.status === 'USED';
          expanded.push({
            id: t.id || `${b.id}-${idx + 1}`,
            bookingId: b.id,
            eventId: b.eventId,
            eventTitle: b.eventTitle,
            eventStartDatetime: b.eventStartDatetime,
            eventVenue: b.eventVenue,
            name: t.attendeeName || t.name || b.userName || b.attendeeName || (b.user && (b.user.fullName || b.user.name)) || 'Attendee',
            email: t.attendeeEmail || t.email || b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '—',
            phone: t.phone || b.userPhone || b.attendeePhone || (b.user && b.user.phoneNumber) || '—',
            ticketType: t.ticketTypeName || t.ticketType || b.ticketTypeName || 'General Admission',
            ticketCode: t.ticketCode || `${b.bookingReference || 'TK'}-${idx + 1}`,
            signedPayload: t.signedPayload || t.qrPayload || t.signedQrPayload || t.ticketCode || `${b.bookingReference || 'TK'}-${idx + 1}`,
            bookingRef: b.bookingReference || `#${b.id}`,
            isCheckedIn,
            checkedInAt: t.checkedInAt || b.checkedInAt || null
          });
        });
      } else {
        const isCheckedIn = b.checkedIn === true || b.status === 'USED' || b.status === 'CHECKED_IN' || b.checkInStatus === 'CHECKED_IN';
        const ticketCode = b.ticketCode || b.ticketId || b.bookingReference || `#${b.id}`;
        const signedPayload = b.signedPayload || b.qrPayload || b.ticketCode || b.bookingReference || `#${b.id}`;

        expanded.push({
          id: b.id,
          bookingId: b.id,
          eventId: b.eventId,
          eventTitle: b.eventTitle,
          eventStartDatetime: b.eventStartDatetime,
          eventVenue: b.eventVenue,
          name: b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || 'Attendee',
          email: b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '—',
          phone: b.userPhone || b.attendeePhone || (b.user && b.user.phoneNumber) || '—',
          ticketType: b.ticketTypeName || b.ticketType || 'General Admission',
          ticketCode,
          signedPayload,
          bookingRef: b.bookingReference || `#${b.id}`,
          isCheckedIn,
          checkedInAt: b.checkedInAt || null
        });
      }
    });

    orgAttendeesCache = expanded;
    updateAttendeeCounters();
    renderOrganizerAttendeesTable();
  } catch (e) {
    console.error('Failed to load organizer attendees:', e);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load attendees: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Update Top Counter Badges
function updateAttendeeCounters() {
  const total = orgAttendeesCache.length;
  const checkedIn = orgAttendeesCache.filter(a => a.isCheckedIn).length;
  const pending = total - checkedIn;

  const elTotal = document.getElementById('orgAttendeeCountTotal');
  const elChecked = document.getElementById('orgAttendeeCountCheckedIn');
  const elPending = document.getElementById('orgAttendeeCountPending');

  if (elTotal) elTotal.textContent = total.toLocaleString();
  if (elChecked) elChecked.textContent = checkedIn.toLocaleString();
  if (elPending) elPending.textContent = pending.toLocaleString();
}

// Render Attendees Table with multi-event filters and check-in controls
function renderOrganizerAttendeesTable(keyword = '') {
  const tbody = document.getElementById('attendeesBody');
  if (!tbody) return;

  const q = (keyword || document.getElementById('orgAttendeeSearchInput')?.value || '').toLowerCase().trim();
  const selectedEvent = document.getElementById('orgAttendeeEventFilter')?.value || 'ALL';
  const selectedStatus = document.getElementById('orgAttendeeStatusFilter')?.value || 'ALL';

  let filtered = orgAttendeesCache;

  // 1. Filter by specific event
  if (selectedEvent !== 'ALL') {
    filtered = filtered.filter(a => String(a.eventId) === String(selectedEvent));
  }

  // 2. Filter by check-in status
  if (selectedStatus === 'CHECKED_IN') {
    filtered = filtered.filter(a => a.isCheckedIn);
  } else if (selectedStatus === 'NOT_CHECKED_IN') {
    filtered = filtered.filter(a => !a.isCheckedIn);
  }

  // 3. Multi-field search across Name, Email, Phone, Ticket, Ref, Event Title, Date, ID, Venue
  if (q) {
    filtered = filtered.filter(a => {
      const name = (a.name || '').toLowerCase();
      const email = (a.email || '').toLowerCase();
      const phone = (a.phone || '').toLowerCase();
      const evTitle = (a.eventTitle || '').toLowerCase();
      const evId = String(a.eventId || '');
      const evDate = a.eventStartDatetime ? new Date(a.eventStartDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }).toLowerCase() : '';
      const evDateIso = a.eventStartDatetime ? String(a.eventStartDatetime).toLowerCase() : '';
      const evVenue = (a.eventVenue || '').toLowerCase();
      const code = (a.ticketCode || '').toLowerCase();
      const ref = (a.bookingRef || '').toLowerCase();
      const ticketType = (a.ticketType || '').toLowerCase();

      return name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        evTitle.includes(q) ||
        evId === q ||
        (`#${evId}`) === q ||
        evDate.includes(q) ||
        evDateIso.includes(q) ||
        evVenue.includes(q) ||
        code.includes(q) ||
        ref.includes(q) ||
        ticketType.includes(q);
    });
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted-soft py-5">
          <i class="bi bi-people fs-2 text-muted d-block mb-2"></i>
          ${q || selectedEvent !== 'ALL' || selectedStatus !== 'ALL' ? 'No attendees found matching your search or filters.' : 'No registered attendees found.'}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(a => {
    const evDateStr = a.eventStartDatetime ? new Date(a.eventStartDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Date TBA';
    const evVenue = a.eventVenue || '';

    return `
      <tr>
        <td data-label="Attendee">
          <div class="fw-semibold text-white">${escapeHtml(a.name)}</div>
        </td>
        <td data-label="Contact">
          <div class="small text-white">${escapeHtml(a.email)}</div>
          ${a.phone && a.phone !== '—' ? `<div class="small text-muted-soft" style="font-size:0.75rem;">${escapeHtml(a.phone)}</div>` : ''}
        </td>
        <td data-label="Event (Date & Venue)">
          <div class="fw-bold text-white">${escapeHtml(a.eventTitle || 'Event')}</div>
          <div class="small text-muted-soft d-flex flex-wrap align-items-center gap-2 mt-1">
            <span><i class="bi bi-calendar3 text-primary me-1"></i>${evDateStr}</span>
            ${evVenue ? `<span><i class="bi bi-geo-alt text-primary me-1"></i>${escapeHtml(evVenue)}</span>` : ''}
            <span class="badge font-monospace" style="background:rgba(255,255,255,0.08); font-size:0.7rem; color:#E0E7FF;">#${a.eventId || '—'}</span>
          </div>
        </td>
        <td data-label="Ticket Type"><span class="pill-badge pill-beige">${escapeHtml(a.ticketType)}</span></td>
        <td data-label="Ticket ID"><code>${escapeHtml(a.ticketCode)}</code></td>
        <td data-label="Booking Ref"><span class="small text-muted-soft">${escapeHtml(a.bookingRef)}</span></td>
        <td data-label="Check-in Action">
          ${a.isCheckedIn ? `
            <div>
              <span class="status-badge status-confirmed"><i class="bi bi-check-circle-fill me-1"></i>Checked-in</span>
              ${a.checkedInAt ? `<div class="small text-muted-soft mt-1" style="font-size:0.72rem;"><i class="bi bi-clock me-1"></i>${formatLocalTime(a.checkedInAt)}</div>` : ''}
            </div>
          ` : `
            <div class="d-flex align-items-center gap-2">
              <span class="status-badge status-pending">Not Checked-in</span>
              <button type="button" class="btn btn-primary btn-sm py-1 px-2" style="font-size:0.75rem; white-space:nowrap;" onclick="manualCheckInAttendee('${escapeJs(a.signedPayload)}', '${a.id}', this)" title="Check in this attendee at the gate">
                <i class="bi bi-qr-code-scan me-1"></i> Check In
              </button>
            </div>
          `}
        </td>
      </tr>`;
  }).join('');
}

// Interactive Manual Check-In from Table
async function manualCheckInAttendee(signedPayload, attendeeId, btnElement) {
  if (!signedPayload) {
    if (typeof esToast === 'function') esToast('Invalid ticket payload', 'error');
    return;
  }

  const origHtml = btnElement ? btnElement.innerHTML : '';
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="bi bi-arrow-repeat spin"></i>`;
  }

  try {
    const res = await CheckInAPI.scan(signedPayload);

    // Locate and update record in local cache
    const match = orgAttendeesCache.find(a => String(a.id) === String(attendeeId) || String(a.signedPayload) === String(signedPayload) || String(a.ticketCode) === String(signedPayload));
    if (match) {
      match.isCheckedIn = true;
      match.checkedInAt = res?.checkedInAt || new Date().toISOString();
    }

    updateAttendeeCounters();
    renderOrganizerAttendeesTable();

    if (typeof esToast === 'function') {
      esToast(`Entry Granted: ${match?.name || 'Attendee'} checked in successfully!`, 'success');
    }
  } catch (err) {
    console.error('Manual check-in error:', err);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = origHtml;
    }
    const msg = err.message || 'Check-in failed. Ticket may be invalid or already used.';
    if (typeof esToast === 'function') {
      esToast(msg, 'error');
    }
  }
}

// Live search listener on Attendees
document.getElementById('orgAttendeeSearchInput')?.addEventListener('input', (e) => {
  renderOrganizerAttendeesTable(e.target.value);
});

// Event filter listener on Attendees
document.getElementById('orgAttendeeEventFilter')?.addEventListener('change', () => {
  renderOrganizerAttendeesTable();
});

// Status filter listener on Attendees
document.getElementById('orgAttendeeStatusFilter')?.addEventListener('change', () => {
  renderOrganizerAttendeesTable();
});

window.manualCheckInAttendee = manualCheckInAttendee;
