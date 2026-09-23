// =========================================================
// EventSphere — Main Organizer Dashboard Controller
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  // Sparkle brand icon
  const sparkleEl = document.getElementById('brandSparkle');
  if (sparkleEl && window.EsIcons) {
    sparkleEl.innerHTML = EsIcons.sparkle;
  }

  // Auth & Role Guard
  if (!EsAuthStore.isLoggedIn()) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent('organizer-dashboard.html' + window.location.search);
    return;
  }
  if (!EsAuthStore.hasRole('ORGANIZER') && !EsAuthStore.hasRole('ADMIN')) {
    // Re-verify with backend profile in case admin recently approved the user
    OrganizerAPI.getMyProfile().then(raw => {
      const p = raw?.data || raw;
      if (p && (p.status === 'APPROVED' || p.status === 'VERIFIED')) {
        const u = EsAuthStore.getUser() || {};
        u.roles = u.roles || [];
        if (!u.roles.some(r => String(r).toUpperCase().includes('ORGANIZER'))) {
          u.roles.push('ORGANIZER');
          EsAuthStore.setUser(u);
        }
        if (typeof loadOrganizerOverview === 'function') loadOrganizerOverview();
        if (typeof loadProfile === 'function') loadProfile();
      } else {
        window.location.href = 'organizer-apply.html';
      }
    }).catch(() => {
      window.location.href = 'organizer-apply.html';
    });
    return;
  }

  // Sidebar Tab Section Switching with Lazy Loading
  document.querySelectorAll('.side-link[data-section]').forEach(link => {
    link.addEventListener('click', () => {
      const sectionName = link.getAttribute('data-section');
      switchOrganizerSection(sectionName);
    });
  });

  // Initial load: Only load Dashboard Overview (and profile in background)
  // Hidden tabs (My Events, Bookings, Attendees) are lazily loaded when clicked
  if (typeof loadOrganizerOverview === 'function') loadOrganizerOverview();
  if (typeof loadProfile === 'function') loadProfile();
});

// Switch Dashboard Section programmatically and trigger lazy data loading
function switchOrganizerSection(sectionName) {
  document.querySelectorAll('.side-link[data-section]').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.side-link[data-section="${sectionName}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('main > section').forEach(s => s.classList.add('d-none'));
  const target = document.getElementById('sec-' + sectionName);
  if (target) target.classList.remove('d-none');

  // Trigger data loader for the activated section
  if (sectionName === 'dashboard') {
    if (typeof loadOrganizerOverview === 'function') loadOrganizerOverview();
  } else if (sectionName === 'myevents') {
    if (typeof loadMyEvents === 'function') loadMyEvents();
  } else if (sectionName === 'bookings') {
    if (typeof loadOrganizerBookings === 'function') loadOrganizerBookings();
  } else if (sectionName === 'attendees') {
    if (typeof loadOrganizerAttendees === 'function') loadOrganizerAttendees();
  } else if (sectionName === 'profile') {
    if (typeof loadProfile === 'function') loadProfile();
  }
}
