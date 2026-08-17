(function () {
  function renderNavAuth() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;
    const user = EsAuthStore.getUser();
    const prefix = esPathPrefix().toPages; // '' when inside /pages/, 'pages/' from root
    const currentPage = document.body.getAttribute('data-page') || '';

    if (!EsAuthStore.isLoggedIn() || !user) {
      slot.innerHTML = `
        <a href="${prefix}login.html" class="btn btn-outline-soft btn-sm">Log in</a>
        <a href="${prefix}register.html" class="btn btn-primary btn-sm">Sign up</a>`;
      return;
    }

    const initials = (user.fullName || user.email || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    const isOrganizer = (user.roles || []).includes('ORGANIZER');
    const isAdmin = (user.roles || []).includes('ADMIN');

    // Determine which dropdown item is active
    const isBookingsActive = currentPage === 'bookings' ? 'active' : '';
    const isAdminActive = currentPage === 'admin' ? 'active' : '';
    const isOrganizerActive = currentPage === 'organizer' ? 'active' : '';

    let roleDashboardLink = '';
    if (isAdmin) {
      roleDashboardLink = `<li><a class="dropdown-item ${isAdminActive}" href="${prefix}admin-dashboard.html"><i class="bi bi-shield-lock me-2"></i>Admin Dashboard</a></li>`;
    } else if (isOrganizer) {
      roleDashboardLink = `<li><a class="dropdown-item ${isOrganizerActive}" href="${prefix}organizer-dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Organizer Dashboard</a></li>`;
    } else {
      roleDashboardLink = `<li><a class="dropdown-item" href="${prefix}organizer-apply.html"><i class="bi bi-briefcase me-2"></i>Become an Organizer</a></li>`;
    }

    slot.innerHTML = `
      <button class="icon-btn" title="Notifications">${EsIcons.bell}</button>
      <div class="dropdown">
        <button class="avatar-circle border-0" data-bs-toggle="dropdown">${initials}</button>
        <ul class="dropdown-menu dropdown-menu-end mt-2 shadow-sm" style="border-radius:16px; border-color:var(--line);">
          <li><h6 class="dropdown-header text-truncate" style="max-width: 200px;">${user.fullName || user.email}</h6></li>
          <li><a class="dropdown-item ${isBookingsActive}" href="${prefix}my-bookings.html"><i class="bi bi-ticket-perforated me-2"></i>My Bookings</a></li>
          ${roleDashboardLink}
          <li><hr class="dropdown-divider my-1"></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutLink"><i class="bi bi-box-arrow-right me-2"></i>Log out</a></li>
        </ul>
      </div>`;

    document.getElementById('logoutLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      AuthAPI.logout();
    });
  }

  function highlightActiveLink() {
    const page = document.body.getAttribute('data-page');
    if (!page) return;
    document.querySelectorAll('.es-navbar .nav-link[data-nav]').forEach(a => {
      if (a.getAttribute('data-nav') === page) a.classList.add('active');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderNavAuth();
    highlightActiveLink();
  });
})();

// Example snippet inside nav.js where #navAuthSlot is populated:
const user = EsAuthStore.getUser();
const isOrganizer = EsAuthStore.hasRole('ORGANIZER');
const isAdmin = EsAuthStore.hasRole('ADMIN');

if (EsAuthStore.isLoggedIn()) {
  const organizerOption = isOrganizer 
    ? `<li><a class="dropdown-item" href="pages/organizer-dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Organizer Dashboard</a></li>`
    : `<li><a class="dropdown-item" href="pages/organizer-apply.html"><i class="bi bi-briefcase me-2"></i>Become an Organizer</a></li>`;

  const adminOption = isAdmin 
    ? `<li><a class="dropdown-item" href="pages/admin-dashboard.html"><i class="bi bi-shield-lock me-2"></i>Admin Dashboard</a></li>`
    : '';

  document.getElementById('navAuthSlot').innerHTML = `
    <button class="icon-btn position-relative" title="Notifications">
      <i class="bi bi-bell"></i>
    </button>
    <div class="dropdown">
      <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
        <div class="avatar-circle">${(user.firstName || user.email || 'U')[0].toUpperCase()}</div>
      </a>
      <ul class="dropdown-menu dropdown-menu-end shadow">
        <li><h6 class="dropdown-header">${user.email || 'Account'}</h6></li>
        <li><a class="dropdown-item" href="pages/my-bookings.html"><i class="bi bi-ticket-perforated me-2"></i>My Bookings</a></li>
        ${organizerOption}
        ${adminOption}
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item text-danger" href="#" onclick="EsAuthStore.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
      </ul>
    </div>
  `;
}
