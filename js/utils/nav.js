/* Renders the logged-in / logged-out state of the navbar's right side.
   Every page includes a <div id="navAuthSlot"></div> in its navbar markup. */
(function () {
  function renderNavAuth() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;
    const user = EsAuthStore.getUser();
    const prefix = esPathPrefix().toPages; // '' when already inside /pages/, 'pages/' from root

    if (!EsAuthStore.isLoggedIn() || !user) {
      slot.innerHTML = `
        <a href="${prefix}login.html" class="btn btn-outline-soft btn-sm">Log in</a>
        <a href="${prefix}register.html" class="btn btn-primary btn-sm">Sign up</a>`;
      return;
    }

    const initials = (user.fullName || user.email || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    const isOrganizer = (user.roles || []).includes('ORGANIZER');
    const isAdmin = (user.roles || []).includes('ADMIN');

    slot.innerHTML = `
      <button class="icon-btn" title="Notifications">${EsIcons.bell}</button>
      <div class="dropdown">
        <button class="avatar-circle border-0" data-bs-toggle="dropdown">${initials}</button>
        <ul class="dropdown-menu dropdown-menu-end mt-2" style="border-radius:16px; border-color:var(--line);">
          <li><h6 class="dropdown-header">${user.fullName || user.email}</h6></li>
          <li><a class="dropdown-item" href="${prefix}my-bookings.html">My Bookings</a></li>
          ${isOrganizer ? `<li><a class="dropdown-item" href="${prefix}organizer-dashboard.html">Organizer Dashboard</a></li>` : `<li><a class="dropdown-item" href="${prefix}organizer-apply.html">Become an Organizer</a></li>`}
          ${isAdmin ? `<li><a class="dropdown-item" href="${prefix}admin-dashboard.html">Admin Dashboard</a></li>` : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutLink">Log out</a></li>
        </ul>
      </div>`;

    document.getElementById('logoutLink').addEventListener('click', (e) => {
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
