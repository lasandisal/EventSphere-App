/* EventSphere signature brand logo + icon suite */
const EsIcons = {
  get logo() {
    const isPages = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
    const prefix = typeof window.esPathPrefix === 'function' ? window.esPathPrefix().toRoot : (isPages ? '../' : './');
    return `<img src="${prefix}assets/images/logo.png" alt="EventSphere Logo" class="brand-logo me-2">`;
  },
  sparkle: `<img src="${typeof window !== 'undefined' && window.location.pathname.includes('/pages/') ? '../' : './'}assets/images/logo.png" alt="EventSphere" class="brand-logo" style="width:1.2em;height:1.2em;object-fit:contain;vertical-align:middle;display:inline-block;">`,
  sparkleMini: `<img src="${typeof window !== 'undefined' && window.location.pathname.includes('/pages/') ? '../' : './'}assets/images/logo.png" alt="EventSphere" class="brand-logo" style="width:1em;height:1em;object-fit:contain;vertical-align:middle;display:inline-block;">`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeSlash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/></svg>`,
};
window.EsIcons = EsIcons;
