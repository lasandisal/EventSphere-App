// =========================================================
// EventSphere — Organizer Events Module
// =========================================================

let myEventsCache = [];

function statusBadge(s) {
  const map = { 
    PUBLISHED: ['status-confirmed', 'Published'], 
    DRAFT: ['status-pending', 'Draft'], 
    CANCELLED: ['status-cancelled', 'Cancelled'] 
  };
  const key = String(s || 'DRAFT').toUpperCase();
  const [cls, label] = map[key] || ['status-pending', key];
  return `<span class="status-badge ${cls}">${label}</span>`;
}

// Load Organizer's Own Events
async function loadMyEvents(keyword = '') {
  const tbody = document.getElementById('myEventsBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading your events...</td></tr>`;

  try {
    const res = await EventsAPI.myEvents({ page: 0, size: 50 });
    const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
    myEventsCache = list;

    renderMyEventsTable(keyword);
  } catch (e) {
    console.error('Failed to load organizer events:', e);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Could not load events: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Render My Events Table with live search
function renderMyEventsTable(keyword = '') {
  const tbody = document.getElementById('myEventsBody');
  if (!tbody) return;

  const q = (keyword || document.getElementById('myEventsSearchInput')?.value || '').toLowerCase().trim();

  let filtered = myEventsCache;
  if (q) {
    filtered = myEventsCache.filter(e => {
      const title = (e.title || '').toLowerCase();
      const cat = (e.categoryName || (e.category && e.category.name) || '').toLowerCase();
      return title.includes(q) || cat.includes(q);
    });
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted-soft py-5">
          <i class="bi bi-calendar-x fs-2 text-muted d-block mb-2"></i>
          ${q ? 'No events matching your search.' : 'No events created yet — <a href="create-event.html" class="fw-semibold text-primary">create your first event</a>.'}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => {
    const sold = (e.ticketTypes || []).reduce((s, t) => s + ((t.totalQuantity || 0) - (t.availableQuantity || 0)), 0);
    const available = (e.ticketTypes || []).reduce((s, t) => s + (t.availableQuantity || 0), 0);
    const cat = e.categoryName || (e.category && e.category.name) || 'General';
    const dateStr = e.startDatetime ? new Date(e.startDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBA';

    return `
      <tr>
        <td data-label="Event">
          <div class="fw-bold text-white">${e.title}</div>
        </td>
        <td data-label="Date" class="small text-muted-soft">${dateStr}</td>
        <td data-label="Category"><span class="pill-badge pill-beige">${cat}</span></td>
        <td data-label="Sold"><span class="fw-semibold text-white">${sold}</span></td>
        <td data-label="Available" class="text-white">${available}</td>
        <td data-label="Status">${statusBadge(e.status)}</td>
        <td data-label="Actions" class="text-end">
          <div class="d-inline-flex gap-1">
            <a href="event-details.html?id=${e.id}" class="btn btn-quiet btn-sm" title="View Public Event Page">View</a>
            <a href="create-event.html?edit=${e.id}" class="btn btn-quiet btn-sm" title="Edit Event Details"><i class="bi bi-pencil me-1"></i>Edit</a>
            ${e.status === 'DRAFT' ? `
              <button class="btn btn-primary btn-sm" onclick="publishEvent(${e.id})" title="Publish to Live Platform">Publish</button>
            ` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');
}

// Publish Event Action
async function publishEvent(id) {
  try {
    await EventsAPI.publishEvent(id);
    esToast('Event published successfully!', 'success');
    loadMyEvents();
    if (typeof loadOrganizerOverview === 'function') loadOrganizerOverview();
  } catch (e) {
    esToast(e.message || 'Could not publish (ensure event has at least one ticket type)', 'error');
  }
}

// Live search listener on My Events
document.getElementById('myEventsSearchInput')?.addEventListener('input', (e) => {
  renderMyEventsTable(e.target.value);
});
