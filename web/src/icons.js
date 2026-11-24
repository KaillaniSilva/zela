// Ícones de traço simples (24x24). Sempre decorativos: o texto ao lado dá o significado.
const P = {
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="m9 20 2-6 3 3v4M7 12l3-4 4 1 2 3"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 13 11"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  sign: '<path d="M12 3v18M6 6h10l2 2.5L16 11H6z"/>',
  grass: '<path d="M3 20h18"/><path d="M6 20c0-4-1-7-3-9M10 20c0-5 1-9 3-12M14 20c0-3 1-6 4-8M18 20c0-2 .5-4 2-5"/>',
  bus: '<rect x="5" y="3" width="14" height="14" rx="2"/><path d="M5 10h14M8 17v3M16 17v3"/><circle cx="8.5" cy="13.5" r=".5"/><circle cx="15.5" cy="13.5" r=".5"/>',
  dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
  tool: '<path d="M14 6a4 4 0 0 0 5 5L11 19a2 2 0 0 1-3-3z"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5a3 3 0 0 1 0 6M21 20c0-2.6-1.6-4.8-4-5.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  arrow: '<path d="M15 6l-6 6 6 6"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2.5 3 4 .5-2 0-5 0-7z"/>',
};

export function icon(name, size = 20) {
  return `<svg class="icon" aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.dots}</svg>`;
}
