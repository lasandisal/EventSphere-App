/* EventSphere signature brand logo + icon suite */
const EsIcons = {
  get logo() {
    const isPages = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
    const prefix = typeof window.esPathPrefix === 'function' ? window.esPathPrefix().toRoot : (isPages ? '../' : './');
    return `<img src="${prefix}assets/images/logo.png" alt="EventSphere Logo" class="brand-logo me-2">`;
  },
  sparkle: `<img src="${typeof window !== 'undefined' && window.location.pathname.includes('/pages/') ? '../' : './'}assets/images/logo.png" alt="EventSphere" class="brand-logo" style="width:1.2em;height:1.2em;object-fit:contain;vertical-align:middle;display:inline-block;">`,
  sparkleMini: `<img src="${typeof window !== 'undefined' && window.location.pathname.includes('/pages/') ? '../' : './'}assets/images/logo.png" alt="EventSphere" class="brand-logo" style="width:1em;height:1em;object-fit:contain;vertical-align:middle;display:inline-block;">`,
  search: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeSlash: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
  chat: `<i class="bi bi-chat-dots-fill"></i>`
};
window.EsIcons = EsIcons;

