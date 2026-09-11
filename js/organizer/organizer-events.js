// =========================================================
// EventSphere — Organizer Events Module
// =========================================================

let myEventsCache = [];
let myEventsPromise = null;

// Shared loader so all organizer modules reuse the same event list without duplicate HTTP calls
async function getSharedOrganizerEvents(forceRefresh = false) {
  if (!forceRefresh && myEventsCache && myEventsCache.length > 0) {
    return myEventsCache;
  }
  if (!forceRefresh && myEventsPromise) {
    return myEventsPromise;
  }
  myEventsPromise = (async () => {
    try {
      const res = await EventsAPI.myEvents({
        page: 0,
        size: 50,
        skipCache: forceRefresh,
        onRevalidate: (fresh) => {
          const list = Array.isArray(fresh) ? fresh : (fresh?.data || fresh?.content || []);
          myEventsCache = list;
          window.myEventsCache = list;
          if (typeof renderMyEventsTable === 'function' && document.getElementById('myEventsBody')) {
            renderMyEventsTable();
          }
        }
      });
      const list = Array.isArray(res) ? res : (res?.data || res?.content || []);
      myEventsCache = list;
      window.myEventsCache = list;
      return list;
    } finally {
      myEventsPromise = null;
    }
  })();
  return myEventsPromise;
}

window.getSharedOrganizerEvents = getSharedOrganizerEvents;
window.myEventsCache = myEventsCache;

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
async function loadMyEvents(keyword = '', forceRefresh = false) {
  const tbody = document.getElementById('myEventsBody');
  if (!tbody) return;

  if (!myEventsCache.length || forceRefresh) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading your events...</td></tr>`;
  }

  try {
    const list = await getSharedOrganizerEvents(forceRefresh);
    myEventsCache = list;
    window.myEventsCache = list;

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
            ${e.status === 'PUBLISHED' ? `
              <button class="btn btn-outline-danger btn-sm" onclick="promptCancelEvent(${e.id})" title="Cancel Event & Process Refunds"><i class="bi bi-x-circle me-1"></i>Cancel</button>
            ` : ''}
            ${e.status === 'CANCELLED' ? `
              <button class="btn btn-quiet btn-sm text-danger" onclick="viewRefundManifest(${e.id})" title="View PayHere Refund Manifest & Attendee List"><i class="bi bi-receipt me-1"></i>Refunds</button>
            ` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');
}

// Cancel Event Safety Modal Handler
function promptCancelEvent(id) {
  const ev = myEventsCache.find(x => x.id === id);
  if (!ev) return;
  if (typeof openEventCancellationModal === 'function') {
    openEventCancellationModal(ev, () => {
      loadMyEvents('', true);
      if (typeof loadOrganizerOverview === 'function') loadOrganizerOverview();
    });
  } else {
    console.error('openEventCancellationModal is not loaded.');
  }
}

// View Refund Manifest Handler
function viewRefundManifest(id) {
  const ev = myEventsCache.find(x => x.id === id);
  if (!ev) return;
  if (typeof openRefundManifestModal === 'function') {
    openRefundManifestModal(ev);
  }
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

window.promptCancelEvent = promptCancelEvent;
window.viewRefundManifest = viewRefundManifest;

