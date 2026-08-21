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
    window.location.href = 'organizer-apply.html';
    return;
  }

  // Sidebar Tab Section Switching
  document.querySelectorAll('.side-link[data-section]').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.side-link[data-section]').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('main > section').forEach(s => s.classList.add('d-none'));
      const target = document.getElementById('sec-' + link.getAttribute('data-section'));
      if (target) target.classList.remove('d-none');
    });
  });

  // Initialize all Organizer modules
  if (typeof loadProfile === 'function') loadProfile();
  if (typeof loadMyEvents === 'function') loadMyEvents();
  if (typeof loadOrganizerBookings === 'function') loadOrganizerBookings();
  if (typeof loadOrganizerAttendees === 'function') loadOrganizerAttendees();
  if (typeof loadOrganizerOverview === 'function') loadOrganizerOverview();
});

// Switch Dashboard Section programmatically
function switchOrganizerSection(sectionName) {
  document.querySelectorAll('.side-link[data-section]').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.side-link[data-section="${sectionName}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('main > section').forEach(s => s.classList.add('d-none'));
  const target = document.getElementById('sec-' + sectionName);
  if (target) target.classList.remove('d-none');
}
