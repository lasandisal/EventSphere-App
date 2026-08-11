/* Toast notifications */
function esToast(message, type = 'success') {
  let container = document.querySelector('.toast-container-es');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-es';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `es-toast ${type}`;
  const icon = type === 'success' ? '✓' : '!';
  el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}
window.esToast = esToast;
