// Shared inline-SVG icon set (Lucide/Phosphor-style, 1.6 stroke, currentColor).
// Use icon("name") to get an <svg> string. Keeps every glyph crisp and aligned
// instead of unicode/emoji that render inconsistently across platforms.
const P = {
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  scales: '<path d="M12 3v18M7 21h10M5 7h14l-3 7H8zM12 7 8 14M12 7l4 7"/>',
  swords: '<path d="M14.5 3.5 19 8l-1.5 1.5M9.5 3.5 5 8l1.5 1.5M3 21l6-6M21 21l-6-6M14 10l-9 9M10 10l9 9"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  coins: '<circle cx="8" cy="8" r="5"/><path d="M15 6.7a5 5 0 1 1 0 10.6M5.5 13.5A5 5 0 0 0 13 18"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  gavel: '<path d="m14 12-8.5 8.5a2.1 2.1 0 0 1-3-3L11 9M14 12l3-3M11 9l3-3M9 7l5 5M14 2l6 6M16 4l-3 3M19 7l-3 3"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 19h6M10 15v4M14 15v4"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  link: '<path d="M9 15 15 9M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  vault: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1"/>',
  pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
};
export function icon(name, size = 16, stroke = 1.6) {
  const body = P[name] || P.arrowRight;
  return `<svg class="ic-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
export function setIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const n = el.getAttribute("data-icon");
    const s = parseInt(el.getAttribute("data-size") || "16", 10);
    el.innerHTML = icon(n, s);
  });
}
