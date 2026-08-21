// =========================================================
// EventSphere — Admin Events & Attendees Inspector Module
// =========================================================

let allEventsMap = {};
let venuesMap = {};

// Load Venues for Event Editing
async function loadVenues() {
  try {
    const res = await VenuesAPI.getAll();
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    venuesMap = {};
    list.forEach(v => venuesMap[v.id] = v);
  } catch (e) {
    console.error('Failed to load venues:', e);
  }
}

// Load All Events with search & edit actions
async function loadAllEvents(keyword = '') {
  const tbody = document.getElementById('eventsBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading platform events...</td></tr>`;

  try {
    const params = { page: 0, size: 50 };
    if (keyword) params.keyword = keyword;

    const res = await EventsAPI.searchPublished(params);
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4">No events found</td></tr>`;
      return;
    }

    allEventsMap = {};
    list.forEach(e => allEventsMap[e.id] = e);

    tbody.innerHTML = list.map(e => {
      const escapedTitle = (e.title || 'Event').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `
        <tr>
          <td data-label="Event Title">
            <span class="fw-bold text-white">${e.title}</span>
          </td>
          <td data-label="Organizer">${e.organizerName || '—'}</td>
          <td data-label="Category"><span class="pill-badge pill-beige">${e.categoryName || 'General'}</span></td>
          <td data-label="Date">${e.startDatetime ? new Date(e.startDatetime).toLocaleString() : 'TBA'}</td>
          <td data-label="Status"><span class="status-badge status-${(e.status || 'PUBLISHED').toLowerCase()}">${e.status || 'PUBLISHED'}</span></td>
          <td data-label="Actions" class="text-end">
            <div class="d-inline-flex gap-1">
              <button type="button" class="btn btn-quiet btn-sm" onclick="openEventAttendeesModal(${e.id}, '${escapedTitle}')" title="View Registered Attendees">
                <i class="bi bi-people me-1"></i> Attendees
              </button>
              <button type="button" class="btn btn-quiet btn-sm" onclick="openEditEventModal(${e.id})" title="Edit Event Details">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <a href="event-details.html?id=${e.id}" class="btn btn-outline-soft btn-sm" title="View Public Page">
                <i class="bi bi-eye"></i>
              </a>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (e) {
    console.error('Failed to load events:', e);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load events</td></tr>`;
  }
}

// Open Event Attendees Modal
async function openEventAttendeesModal(eventId, eventTitle) {
  document.getElementById('attModalEventTitle').textContent = eventTitle || 'Event Attendees';
  const summaryEl = document.getElementById('attModalSummary');
  const tbody = document.getElementById('attModalTableBody');
  summaryEl.textContent = 'Loading registered guest list...';
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading bookings...</td></tr>`;

  const modalEl = document.getElementById('adminEventAttendeesModal');
  if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();

  try {
    const raw = await EventsAPI.getEventBookings(eventId);
    const bookings = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);

    if (!bookings.length) {
      summaryEl.textContent = '0 Attendees registered so far.';
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted-soft py-5">
            <i class="bi bi-ticket-perforated fs-2 text-muted d-block mb-2"></i>
            No bookings recorded for this event yet.
          </td>
        </tr>`;
      return;
    }

    const totalTickets = bookings.reduce((sum, b) => sum + (b.ticketCount || b.quantity || 1), 0);
    summaryEl.textContent = `${bookings.length} Bookings (${totalTickets} Total Tickets)`;

    tbody.innerHTML = bookings.map(b => {
      const ref = b.bookingReference || b.bookingId || `#${b.id}`;
      const name = b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || 'Attendee';
      const email = b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '—';
      const ticketType = b.ticketTypeName || b.ticketType || 'General Admission';
      const qty = b.ticketCount || b.quantity || 1;
      const amount = b.totalPrice != null ? `LKR ${Number(b.totalPrice).toLocaleString()}` : (b.totalAmount != null ? `LKR ${Number(b.totalAmount).toLocaleString()}` : 'Free');
      const bDate = b.createdAt || b.bookingDate ? new Date(b.createdAt || b.bookingDate).toLocaleDateString() : '—';
      const status = (b.status || 'CONFIRMED').toUpperCase();
      const statusCls = status === 'CONFIRMED' ? 'status-confirmed' : (status === 'CANCELLED' ? 'status-cancelled' : 'status-pending');

      return `
        <tr>
          <td data-label="Booking Ref"><code>${ref}</code></td>
          <td data-label="Attendee">
            <div class="fw-semibold text-white">${name}</div>
            <div class="small text-muted-soft">${email}</div>
          </td>
          <td data-label="Tickets">
            <span class="pill-badge pill-beige me-1" style="font-size:0.65rem;">${ticketType}</span>
            <span class="fw-bold text-white">×${qty}</span>
          </td>
          <td data-label="Total Paid"><strong class="text-white">${amount}</strong></td>
          <td data-label="Booking Date" class="small text-muted-soft">${bDate}</td>
          <td data-label="Status"><span class="status-badge ${statusCls}">${status}</span></td>
        </tr>`;
    }).join('');
  } catch (err) {
    summaryEl.textContent = 'Could not load bookings';
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load attendees: ${err.message || 'Server error'}</td></tr>`;
  }
}

// Live search on All Events table
document.getElementById('adminEventSearch')?.addEventListener('input', (e) => {
  loadAllEvents(e.target.value.trim());
});

// Open Edit Event Modal
async function openEditEventModal(id) {
  const catSelect = document.getElementById('adminEditEventCategory');
  catSelect.innerHTML = '<option value="">Select Category</option>' +
    Object.values(categoriesMap || {}).map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  if (Object.keys(venuesMap).length === 0) {
    await loadVenues();
  }
  const venSelect = document.getElementById('adminEditEventVenue');
  venSelect.innerHTML = '<option value="">Select Venue</option>' +
    Object.values(venuesMap).map(v => `<option value="${v.id}">${v.name}${v.city ? ` (${v.city})` : ''}</option>`).join('');

  document.getElementById('editEventForm').reset();
  document.getElementById('adminBannerPreviewWrap').innerHTML = '';
  document.getElementById('adminEditEventId').value = id;

  try {
    let ev = allEventsMap[id];
    try {
      const fullEv = await EventsAPI.getById(id);
      if (fullEv) ev = fullEv?.data || fullEv;
    } catch (err) {
      console.warn('Could not fetch full event from API, using cached:', err);
    }

    if (!ev) {
      esToast('Event not found', 'error');
      return;
    }

    document.getElementById('adminEditEventTitle').value = ev.title || '';
    document.getElementById('adminEditEventDescription').value = ev.description || '';

    const catId = ev.categoryId || ev.category?.id;
    if (catId && categoriesMap[catId]) {
      catSelect.value = catId;
    } else if (ev.categoryName) {
      const foundCat = Object.values(categoriesMap).find(c => c.name.toLowerCase() === ev.categoryName.toLowerCase());
      if (foundCat) catSelect.value = foundCat.id;
    }

    const venId = ev.venueId || ev.venue?.id;
    if (venId && venuesMap[venId]) {
      venSelect.value = venId;
    } else if (ev.venueName) {
      const foundVen = Object.values(venuesMap).find(v => v.name.toLowerCase().includes(ev.venueName.toLowerCase()));
      if (foundVen) venSelect.value = foundVen.id;
    }

    if (ev.startDatetime) {
      if (typeof ev.startDatetime === 'string' && ev.startDatetime.includes('T')) {
        const parts = ev.startDatetime.split('T');
        document.getElementById('adminEditEventDate').value = parts[0];
        document.getElementById('adminEditEventStartTime').value = parts[1].slice(0, 5);
      } else {
        const dt = new Date(ev.startDatetime);
        if (!isNaN(dt.getTime())) {
          const year = dt.getFullYear();
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          document.getElementById('adminEditEventDate').value = `${year}-${month}-${day}`;
          document.getElementById('adminEditEventStartTime').value = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
        }
      }
    }
    if (ev.endDatetime) {
      if (typeof ev.endDatetime === 'string' && ev.endDatetime.includes('T')) {
        const parts = ev.endDatetime.split('T');
        document.getElementById('adminEditEventEndTime').value = parts[1].slice(0, 5);
      } else {
        const dt = new Date(ev.endDatetime);
        if (!isNaN(dt.getTime())) {
          document.getElementById('adminEditEventEndTime').value = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
        }
      }
    }

    const banner = ev.bannerUrl || ev.imageUrl || '';
    document.getElementById('adminEditEventBanner').value = banner;
    if (banner) {
      document.getElementById('adminBannerPreviewWrap').innerHTML = `<img src="${banner}" alt="Banner Preview" style="max-width:200px;height:100px;object-fit:cover;border-radius:6px;" class="border shadow-sm">`;
    }

    const modalEl = document.getElementById('editEventModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
  } catch (e) {
    esToast('Failed to open event for editing: ' + e.message, 'error');
  }
}

// Submit Edit Event Form
document.getElementById('editEventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('adminEditEventId').value;
  if (!id) return;

  const saveBtn = document.getElementById('adminSaveEventBtn');
  const originalHtml = saveBtn.innerHTML;

  const date = document.getElementById('adminEditEventDate').value;
  const startTime = document.getElementById('adminEditEventStartTime').value;
  const endTime = document.getElementById('adminEditEventEndTime').value || startTime;

  const payload = {
    title: document.getElementById('adminEditEventTitle').value.trim(),
    description: document.getElementById('adminEditEventDescription').value.trim(),
    categoryId: Number(document.getElementById('adminEditEventCategory').value) || null,
    venueId: Number(document.getElementById('adminEditEventVenue').value) || null,
    startDatetime: `${date}T${startTime}:00`,
    endDatetime: `${date}T${endTime}:00`,
    bannerUrl: document.getElementById('adminEditEventBanner').value.trim() || null
  };

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="bi bi-arrow-repeat spin me-1"></i> Saving...`;

    await EventsAPI.updateEvent(id, payload);
    esToast('Event updated successfully!', 'success');

    const modalEl = document.getElementById('editEventModal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    loadAllEvents();
  } catch (err) {
    esToast(err.message || 'Failed to update event', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHtml;
  }
});

// Cancel Event from modal
document.getElementById('adminCancelEventBtn')?.addEventListener('click', async () => {
  const id = document.getElementById('adminEditEventId').value;
  if (!id) return;

  if (!confirm('Are you sure you want to cancel this event?')) return;

  try {
    await EventsAPI.cancelEvent(id);
    esToast('Event marked as cancelled', 'info');

    const modalEl = document.getElementById('editEventModal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    loadAllEvents();
  } catch (err) {
    esToast(err.message || 'Failed to cancel event', 'error');
  }
});

// Preview Banner Button & Input Listener
document.getElementById('adminPreviewBannerBtn')?.addEventListener('click', () => {
  const url = document.getElementById('adminEditEventBanner').value.trim();
  const wrap = document.getElementById('adminBannerPreviewWrap');
  if (url) {
    wrap.innerHTML = `<img src="${url}" alt="Banner Preview" style="max-width:200px;height:100px;object-fit:cover;border-radius:6px;" class="border shadow-sm" onerror="this.parentElement.innerHTML='<span class=\\'text-danger small\\'>Invalid image URL</span>'">`;
  } else {
    wrap.innerHTML = '';
  }
});

document.getElementById('adminEditEventBanner')?.addEventListener('change', (e) => {
  const url = e.target.value.trim();
  const wrap = document.getElementById('adminBannerPreviewWrap');
  if (url) {
    wrap.innerHTML = `<img src="${url}" alt="Banner Preview" style="max-width:200px;height:100px;object-fit:cover;border-radius:6px;" class="border shadow-sm" onerror="this.parentElement.innerHTML='<span class=\\'text-danger small\\'>Invalid image URL</span>'">`;
  } else {
    wrap.innerHTML = '';
  }
});

// Cloudinary Direct Upload from Admin Dashboard
async function uploadAdminEventImage(file) {
  const cloudName = window.ES_CONFIG?.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = window.ES_CONFIG?.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary config missing in js/env.js.');
  }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Image upload failed');
  }
  const data = await res.json();
  return data.secure_url;
}

document.getElementById('adminEditEventFileInput')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('adminBannerPreviewWrap');
  const bannerInput = document.getElementById('adminEditEventBanner');
  if (!file) return;

  const localUrl = URL.createObjectURL(file);
  preview.innerHTML = `<div class="d-flex align-items-center gap-2 mt-2"><img src="${localUrl}" style="max-width:140px;height:70px;object-fit:cover;border-radius:6px;" class="border"><span class="text-muted-soft small"><i class="bi bi-arrow-repeat spin me-1"></i>Uploading to Cloudinary...</span></div>`;

  try {
    const uploadedUrl = await uploadAdminEventImage(file);
    bannerInput.value = uploadedUrl;
    preview.innerHTML = `<div class="d-flex align-items-center gap-2 mt-2"><img src="${uploadedUrl}" style="max-width:140px;height:70px;object-fit:cover;border-radius:6px;" class="border shadow-sm"><span class="text-success small fw-semibold"><i class="bi bi-check-circle me-1"></i>Uploaded!</span></div>`;
    esToast('Image uploaded successfully!', 'success');
  } catch (err) {
    preview.innerHTML = `<span class="text-danger small"><i class="bi bi-exclamation-triangle me-1"></i>${err.message || 'Upload failed'}</span>`;
    esToast('Image upload failed: ' + err.message, 'error');
  }
});
