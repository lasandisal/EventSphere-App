// =========================================================
// EventSphere — Main Admin Dashboard Controller
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  // Sparkle brand icon
  const sparkleEl = document.getElementById('brandSparkle');
  if (sparkleEl && window.EsIcons) {
    sparkleEl.innerHTML = EsIcons.sparkle;
  }

  // Auth Guard
  if (!EsAuthStore.isLoggedIn()) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent('admin-dashboard.html' + window.location.search);
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

  // Initialize all Admin modules
  if (typeof loadUsers === 'function') loadUsers();
  if (typeof loadAllOrganizers === 'function') loadAllOrganizers();
  if (typeof loadCategories === 'function') loadCategories();
  if (typeof loadVenues === 'function') loadVenues();
  if (typeof loadAllEvents === 'function') loadAllEvents();
  if (typeof loadAllAttendees === 'function') loadAllAttendees();
  if (typeof loadAdminProfile === 'function') loadAdminProfile();
  if (typeof loadDashboardAnalytics === 'function') loadDashboardAnalytics();
});

// Switch Dashboard Section programmatically
function switchSection(sectionName) {
  document.querySelectorAll('.side-link[data-section]').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.side-link[data-section="${sectionName}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('main > section').forEach(s => s.classList.add('d-none'));
  const target = document.getElementById('sec-' + sectionName);
  if (target) target.classList.remove('d-none');
}
