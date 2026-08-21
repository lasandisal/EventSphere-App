// =========================================================
// EventSphere — Admin Users Module
// =========================================================

let allUsersCache = [];
let currentUserFilter = 'ALL';

// Helper to determine the primary role type of a user
function getUserRoleType(u) {
  const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : ['USER']);
  const normalized = roles.map(r => String(r).toUpperCase());
  
  if (normalized.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN')) {
    return 'ADMIN';
  }
  if (normalized.some(r => r === 'ORGANIZER' || r === 'ROLE_ORGANIZER')) {
    return 'ORGANIZER';
  }
  return 'USER';
}

// Load Users from Backend
async function loadUsers() {
  const tbody = document.getElementById('usersBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading platform users...</td></tr>`;

  try {
    const params = { page: 0, size: 100 };
    const response = await AdminAPI.getUsers(params);
    const list = Array.isArray(response) ? response : (response?.data || response?.content || []);

    allUsersCache = list;

    // Update filter counts
    const normalCount = list.filter(u => getUserRoleType(u) === 'USER').length;
    const organizerCount = list.filter(u => getUserRoleType(u) === 'ORGANIZER').length;
    const adminCount = list.filter(u => getUserRoleType(u) === 'ADMIN').length;

    const countAllEl = document.getElementById('countAllUsers');
    const countNormalEl = document.getElementById('countNormalUsers');
    const countOrgEl = document.getElementById('countOrganizerUsers');
    const countAdminEl = document.getElementById('countAdminUsers');

    if (countAllEl) countAllEl.textContent = list.length;
    if (countNormalEl) countNormalEl.textContent = normalCount;
    if (countOrgEl) countOrgEl.textContent = organizerCount;
    if (countAdminEl) countAdminEl.textContent = adminCount;

    renderUsersTable();
  } catch (e) {
    console.error('Failed to load users:', e);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load users: ${e.message || 'Server error'}</td></tr>`;
  }
}

// Filter Tab Click Handler
function filterUsersByRole(roleFilter, clickedBtn) {
  currentUserFilter = roleFilter;
  if (clickedBtn) {
    document.querySelectorAll('#userRoleFilterTabs .filter-pill').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
  }
  renderUsersTable();
}

// Render Users Table with Role Filter & Keyword Search
function renderUsersTable() {
  const tbody = document.getElementById('usersBody');
  if (!tbody) return;

  const keyword = (document.getElementById('adminUserSearch')?.value || '').toLowerCase().trim();

  let filtered = allUsersCache.filter(u => {
    const roleType = getUserRoleType(u);

    // Role filter
    if (currentUserFilter !== 'ALL' && roleType !== currentUserFilter) {
      return false;
    }

    // Search keyword filter
    if (keyword) {
      const name = (u.fullName || u.name || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phoneNumber || u.phone || u.contactNumber || u.mobile || '').toLowerCase();
      const roleStr = roleType.toLowerCase();

      return name.includes(keyword) || email.includes(keyword) || phone.includes(keyword) || roleStr.includes(keyword);
    }

    return true;
  });

  if (!filtered.length) {
    let emptyMsg = 'No users found.';
    if (currentUserFilter === 'USER') emptyMsg = 'No normal users found.';
    else if (currentUserFilter === 'ORGANIZER') emptyMsg = 'No organizer accounts found.';
    else if (currentUserFilter === 'ADMIN') emptyMsg = 'No admin accounts found.';
    
    if (keyword) emptyMsg += ` matching "${keyword}".`;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted-soft py-5">
          <i class="bi bi-people fs-2 text-muted d-block mb-2"></i>
          ${emptyMsg}
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const name = u.fullName || u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User';
    const email = u.email || '—';
    const phone = u.phoneNumber || u.phone || u.contactNumber || u.mobile || '—';
    const roleType = getUserRoleType(u);

    let roleBadge = '<span class="pill-badge pill-beige">User</span>';
    if (roleType === 'ADMIN') {
      roleBadge = '<span class="pill-badge pill-lavender">Admin</span>';
    } else if (roleType === 'ORGANIZER') {
      roleBadge = '<span class="pill-badge pill-sage">Organizer</span>';
    }

    const statusBadge = (u.enabled === false || u.status === 'INACTIVE')
      ? '<span class="status-badge status-cancelled">Inactive</span>'
      : '<span class="status-badge status-confirmed">Active</span>';

    const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—';
    const isAdminUser = roleType === 'ADMIN';

    return `
      <tr>
        <td data-label="Name">
          <span class="fw-bold text-white">${name}</span>
        </td>
        <td data-label="Email">${email}</td>
        <td data-label="Phone"><span class="text-muted-soft">${phone}</span></td>
        <td data-label="Role">${roleBadge}</td>
        <td data-label="Status">${statusBadge}</td>
        <td data-label="Registered">${regDate}</td>
        <td data-label="Actions" class="text-end">
          <div class="dropdown">
            <button class="btn btn-quiet btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="User Actions" style="padding:0.25rem 0.5rem;">
              <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
              ${!isAdminUser ? `
                <li>
                  <button class="dropdown-item d-flex align-items-center" onclick="promoteUserToAdmin(${u.id}, '${name.replace(/'/g, "\\'")}')">
                    <i class="bi bi-shield-plus me-2 text-primary"></i> Promote to Admin
                  </button>
                </li>
              ` : `
                <li>
                  <span class="dropdown-item text-muted disabled d-flex align-items-center">
                    <i class="bi bi-shield-check me-2 text-success"></i> Superuser
                  </span>
                </li>
              `}
            </ul>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// Promote user to admin
async function promoteUserToAdmin(userId, userName) {
  if (!confirm(`Promote "${userName}" to Administrator? They will receive full administrative access.`)) return;

  try {
    await AdminAPI.promoteToAdmin(userId);
    esToast(`"${userName}" has been promoted to Admin!`, 'success');
    loadUsers();
  } catch (err) {
    esToast(err.message || 'Failed to promote user', 'error');
  }
}

// Live search listener on Users table
document.getElementById('adminUserSearch')?.addEventListener('input', () => {
  renderUsersTable();
});
