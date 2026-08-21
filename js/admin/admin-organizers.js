// =========================================================
// EventSphere — Admin Organizers & KYC Module
// =========================================================

let allOrganizersCache = [];
let allOrganizersMap = {};
let currentOrgFilter = 'ALL';

// Helper functions for Organizer DTO mapping
function getOrgVerificationId(o) {
  return o.nicOrPassportNumber || o.nicNumber || o.businessRegistrationNumber || o.regNumber || o.nic || o.passportNumber || '—';
}

function getOrgApplicantName(o) {
  return o.applicantName || o.fullName || o.userName || o.userFullName || o.ownerName || (o.user && (o.user.fullName || o.user.name || o.user.email)) || o.email || '—';
}

function getOrgSubmittedDate(o) {
  const dt = o.createdAt || o.submittedAt || o.appliedAt || o.createdDate || o.createdDateTime || o.timestamp;
  return dt ? new Date(dt).toLocaleDateString() : '—';
}

function isOrgPending(status) {
  return !status || String(status).toUpperCase() === 'PENDING';
}

function isOrgApproved(status) {
  const s = String(status || '').toUpperCase();
  return s === 'APPROVED' || s === 'VERIFIED';
}

function isOrgRejected(status) {
  return String(status || '').toUpperCase() === 'REJECTED';
}

// Load All Organizers from backend
async function loadAllOrganizers() {
  const tbody = document.getElementById('organizersBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading organizers...</td></tr>`;

  try {
    const response = await AdminAPI.getAllOrganizers();
    const list = Array.isArray(response) ? response : (response?.data || response?.content || []);
    console.log('All organizers from backend:', list);

    allOrganizersCache = list;
    allOrganizersMap = {};
    list.forEach(org => allOrganizersMap[org.id] = org);

    // Update filter counts
    const pendingCount = list.filter(o => isOrgPending(o.status)).length;
    const approvedCount = list.filter(o => isOrgApproved(o.status)).length;
    const rejectedCount = list.filter(o => isOrgRejected(o.status)).length;

    const countAllEl = document.getElementById('countAllOrgs');
    const countPendingEl = document.getElementById('countPendingOrgs');
    const countApprovedEl = document.getElementById('countApprovedOrgs');
    const countRejectedEl = document.getElementById('countRejectedOrgs');

    if (countAllEl) countAllEl.textContent = list.length;
    if (countPendingEl) countPendingEl.textContent = pendingCount;
    if (countApprovedEl) countApprovedEl.textContent = approvedCount;
    if (countRejectedEl) countRejectedEl.textContent = rejectedCount;

    renderOrganizersTable();
  } catch (e) {
    console.error('Failed to load organizers:', e);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Failed to load organizers: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Filter Tab Click Handler
function filterOrganizersByStatus(statusFilter, clickedBtn) {
  currentOrgFilter = statusFilter;
  if (clickedBtn) {
    document.querySelectorAll('#orgFilterTabs .filter-pill').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
  }
  renderOrganizersTable();
}

// Render Organizers Table with Filters & Search
function renderOrganizersTable() {
  const tbody = document.getElementById('organizersBody');
  if (!tbody) return;

  const keyword = (document.getElementById('adminOrgSearch')?.value || '').toLowerCase().trim();

  let filtered = allOrganizersCache.filter(o => {
    // Status filter
    if (currentOrgFilter === 'PENDING' && !isOrgPending(o.status)) return false;
    if (currentOrgFilter === 'APPROVED' && !isOrgApproved(o.status)) return false;
    if (currentOrgFilter === 'REJECTED' && !isOrgRejected(o.status)) return false;

    // Search keyword filter
    if (keyword) {
      const bName = (o.businessName || '').toLowerCase();
      const aName = getOrgApplicantName(o).toLowerCase();
      const email = (o.applicantEmail || o.email || '').toLowerCase();
      const phone = (o.applicantPhone || o.phoneNumber || o.phone || '').toLowerCase();
      const nic = getOrgVerificationId(o).toLowerCase();

      return bName.includes(keyword) || aName.includes(keyword) || email.includes(keyword) || phone.includes(keyword) || nic.includes(keyword);
    }
    return true;
  });

  if (!filtered.length) {
    const emptyMsg = currentOrgFilter === 'ALL'
      ? 'No organizer records found.'
      : `No ${currentOrgFilter.toLowerCase()} organizers found.`;
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted-soft py-5">
          <i class="bi bi-person-check fs-2 text-muted d-block mb-2"></i>
          ${emptyMsg}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const business = o.businessName || '—';
    const applicant = getOrgApplicantName(o);
    const email = o.applicantEmail || o.email || '';
    const phone = o.applicantPhone || o.phoneNumber || o.phone || '';
    const nic = o.nicOrPassportNumber || o.nicNumber || o.nic || '—';
    const regNo = o.businessRegistrationNumber || o.regNumber || '';
    const bio = o.bio || o.description || '';
    const status = (o.status || 'PENDING').toUpperCase();
    const dt = o.createdAt ? new Date(o.createdAt) : null;
    const dateText = dt ? dt.toLocaleDateString() : '—';
    const timeText = dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    let statusBadge = '<span class="status-badge status-pending">Pending Review</span>';
    if (isOrgApproved(status)) {
      statusBadge = '<span class="status-badge status-confirmed">Approved</span>';
    } else if (isOrgRejected(status)) {
      statusBadge = '<span class="status-badge status-cancelled">Rejected</span>';
    }

    return `
    <tr style="cursor: pointer;" onclick="openReviewModal(${o.id})" title="Click to inspect full KYC application details">
      <td data-label="Business Entity">
        <span class="fw-bold text-white d-block">${business}</span>
        ${bio ? `<small class="text-muted-soft text-truncate d-inline-block" style="max-width: 190px;" title="${bio.replace(/"/g, '&quot;')}">${bio}</small>` : ''}
      </td>
      <td data-label="Applicant & Contact">
        <div class="fw-semibold text-white">${applicant}</div>
        ${email ? `<div class="small text-muted-soft"><i class="bi bi-envelope me-1"></i>${email}</div>` : ''}
        ${phone ? `<div class="small text-muted-soft"><i class="bi bi-telephone me-1"></i>${phone}</div>` : ''}
      </td>
      <td data-label="Verification">
        <div><span class="pill-badge pill-beige me-1" style="font-size:0.65rem;">NIC</span><code>${nic}</code></div>
        ${regNo ? `<div class="mt-1"><span class="pill-badge pill-beige me-1" style="font-size:0.65rem;">BRN</span><code class="text-muted-soft">${regNo}</code></div>` : ''}
      </td>
      <td data-label="Submitted">
        <div class="small fw-semibold text-white">${dateText}</div>
        <div class="small text-muted-soft">${timeText}</div>
      </td>
      <td data-label="Status">
        ${statusBadge}
      </td>
      <td data-label="Actions" class="text-end" onclick="event.stopPropagation();">
        <div class="d-inline-flex gap-1">
          <button class="btn btn-quiet btn-sm" onclick="openReviewModal(${o.id})" title="Inspect Full KYC Details">
            <i class="bi bi-eye"></i>
          </button>
          ${isOrgPending(status) ? `
            <button class="btn btn-primary btn-sm" onclick="approveOrganizer(${o.id})" title="Approve Organizer">
              <i class="bi bi-check2"></i> Approve
            </button>
            <button class="btn btn-danger-soft btn-sm" onclick="rejectOrganizer(${o.id})" title="Reject Application">
              <i class="bi bi-x"></i> Reject
            </button>
          ` : isOrgApproved(status) ? `
            <button class="btn btn-danger-soft btn-sm" onclick="rejectOrganizer(${o.id})" title="Revoke / Reject Status">
              <i class="bi bi-x-circle"></i> Revoke
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="approveOrganizer(${o.id})" title="Re-Approve Organizer">
              <i class="bi bi-check2"></i> Re-Approve
            </button>
          `}
        </div>
      </td>
    </tr>`;
  }).join('');
}

// Live search listener on Organizers table
document.getElementById('adminOrgSearch')?.addEventListener('input', () => {
  renderOrganizersTable();
});

// Backward compatibility alias
function loadPendingOrganizers() {
  return loadAllOrganizers();
}

// Open Review Modal
function openReviewModal(id) {
  const o = allOrganizersMap[id] || allOrganizersCache.find(x => x.id == id);
  if (!o) return;

  document.getElementById('reviewOrgId').value = o.id;
  document.getElementById('reviewOrgBusiness').textContent = o.businessName || '—';
  document.getElementById('reviewOrgApplicant').textContent = getOrgApplicantName(o);
  document.getElementById('reviewOrgEmail').textContent = o.applicantEmail || o.email || '—';
  document.getElementById('reviewOrgPhone').textContent = o.applicantPhone || o.phoneNumber || o.phone || '—';
  document.getElementById('reviewOrgNic').textContent = o.nicOrPassportNumber || o.nicNumber || o.nic || '—';
  document.getElementById('reviewOrgRegNo').textContent = o.businessRegistrationNumber || o.regNumber || 'None provided (Individual Host)';
  document.getElementById('reviewOrgBio').textContent = o.bio || o.description || 'No description provided.';

  const status = (o.status || 'PENDING').toUpperCase();
  const statusEl = document.getElementById('reviewOrgStatus');
  if (statusEl) {
    if (isOrgApproved(status)) {
      statusEl.className = 'status-badge status-confirmed mt-1';
      statusEl.textContent = 'Approved Organizer';
    } else if (isOrgRejected(status)) {
      statusEl.className = 'status-badge status-cancelled mt-1';
      statusEl.textContent = 'Rejected';
    } else {
      statusEl.className = 'status-badge status-pending mt-1';
      statusEl.textContent = 'Pending Review';
    }
  }

  const dt = o.createdAt ? new Date(o.createdAt) : null;
  document.getElementById('reviewOrgDate').textContent = dt ? dt.toLocaleString() : '—';

  // Dynamic modal buttons based on status
  const approveBtn = document.getElementById('modalApproveOrgBtn');
  const rejectBtn = document.getElementById('modalRejectOrgBtn');

  if (approveBtn && rejectBtn) {
    if (isOrgPending(status)) {
      approveBtn.style.display = 'inline-flex';
      approveBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Approve Organizer';
      rejectBtn.style.display = 'inline-flex';
      rejectBtn.innerHTML = '<i class="bi bi-x-circle me-1"></i> Reject Application';
    } else if (isOrgApproved(status)) {
      approveBtn.style.display = 'none';
      rejectBtn.style.display = 'inline-flex';
      rejectBtn.innerHTML = '<i class="bi bi-x-circle me-1"></i> Revoke / Reject Status';
    } else {
      approveBtn.style.display = 'inline-flex';
      approveBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Re-Approve Organizer';
      rejectBtn.style.display = 'none';
    }
  }

  const modalEl = document.getElementById('reviewOrganizerModal');
  if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// Modal Action Listeners
document.getElementById('modalApproveOrgBtn')?.addEventListener('click', async () => {
  const id = document.getElementById('reviewOrgId').value;
  if (!id) return;
  bootstrap.Modal.getInstance(document.getElementById('reviewOrganizerModal'))?.hide();
  await approveOrganizer(id);
});

document.getElementById('modalRejectOrgBtn')?.addEventListener('click', async () => {
  const id = document.getElementById('reviewOrgId').value;
  if (!id) return;
  bootstrap.Modal.getInstance(document.getElementById('reviewOrganizerModal'))?.hide();
  await rejectOrganizer(id);
});

// Approve via PATCH /api/v1/admin/organizers/{id}/verify
async function approveOrganizer(id) {
  try {
    await AdminAPI.verifyOrganizer(id);
    esToast('Organizer verified and ORGANIZER role granted!', 'success');
    loadAllOrganizers();
  } catch (e) {
    esToast(e.message || 'Failed to approve application', 'error');
  }
}

// Reject via DELETE /api/v1/admin/organizers/{id}/reject
async function rejectOrganizer(id) {
  if (!confirm('Are you sure you want to reject/revoke this organizer application?')) return;
  try {
    await AdminAPI.rejectOrganizer(id);
    esToast('Organizer application rejected/revoked.', 'info');
    loadAllOrganizers();
  } catch (e) {
    esToast(e.message || 'Failed to reject application', 'error');
  }
}
