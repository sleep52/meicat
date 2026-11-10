window.ML_ICONS = (() => {
  const S = (body) => `<svg viewBox="0 0 48 48" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const I = {
    asterisk: S('<path d="M24 6v36M6 24h36M11 11l26 26M37 11L11 37"/>'),
    gear: S('<circle cx="24" cy="24" r="8"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4"/>'),
    back: S('<path d="M30 10L16 24l14 14"/>'),
    arrow: S('<path d="M8 24h28M26 12l12 12-12 12"/>'),
    menu: S('<path d="M8 14h32M8 24h32M8 34h32"/>'),
    close: S('<path d="M12 12l24 24M36 12L12 36"/>'),
    pause: S('<path d="M17 10v28M31 10v28"/>'),
    play: S('<path d="M16 10l22 14-22 14z" fill="#222"/>'),
    download: S('<path d="M24 6v24M14 22l10 10 10-10M8 38h32"/>'),
    shuffle: S('<path d="M8 14h10l14 20h8M32 10l8 4-8 4M8 34h10l6-8M26 22l6-8h8M32 30l8 4-8 4"/>'),
    cushion: S('<rect x="9" y="12" width="30" height="24" rx="7" fill="#DCD2F5"/><path d="M14 17l20 14M34 17L14 31"/>'),
    sofa: S('<path d="M8 24a4 4 0 0 1 8 0v2h16v-2a4 4 0 0 1 8 0v12H8z" fill="#DCD2F5"/><path d="M12 26v-8a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v8"/>'),
    tissue: S('<rect x="9" y="24" width="30" height="14" rx="3" fill="#fff"/><path d="M19 24c0-5 3-6 3-10 0-3 4-3 4 0 0 4 3 5 3 10" fill="#fff"/><path d="M15 31h18"/>'),
    cup: S('<path d="M14 8h20l-3 32H17z" fill="#BFE4D0"/><path d="M16 20h16"/>'),
    slipper: S('<path d="M8 32c0-10 7-18 16-18s16 6 16 12c0 5-7 6-16 6s-16 4-16 0z" fill="#F16D5B"/><path d="M14 26c4-3 12-3 16 0"/>'),
    toy: S('<circle cx="24" cy="24" r="14" fill="#F5E66B"/><path d="M24 15l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z" fill="#fff"/>'),
    basket: S('<path d="M8 18h32l-4 22H12z" fill="#E9D8B8"/><path d="M8 18c0-8 7-12 16-12s16 4 16 12M16 24l2 12M24 24v12M32 24l-2 12"/>'),
    scratch: S('<path d="M14 8l5 32M24 6l3 34M34 8l1 30" stroke="#F16D5B"/>'),
    pot: S('<path d="M12 24h24l-3 16H15z" fill="#F16D5B"/><path d="M24 24v-8M24 16c-6 0-8-6-8-8 6 0 8 4 8 8zm0 0c6 0 8-6 8-8-6 0-8 4-8 8z" fill="#BFE4D0"/><path d="M10 42h4M18 44h4M30 42h4" stroke="#88847D"/>'),
    box: S('<rect x="9" y="18" width="30" height="22" fill="#E9D8B8"/><path d="M9 18l-4-8h14l4 8M39 18l4-8H29l-4 8M24 18v22"/>'),
    curtain: S('<path d="M8 8h32M12 8v30c3-3 5-3 8 0V8M28 8v30c3-3 5-3 8 0V8" fill="#DCD2F5"/>'),
    treat: S('<path d="M8 24c6-8 16-12 26-8l8-6v28l-8-6c-10 4-20 0-26-8z" fill="#F5E66B"/><circle cx="15" cy="22" r="2" fill="#222"/>'),
    robot: S('<circle cx="24" cy="26" r="14" fill="#fff"/><circle cx="19" cy="24" r="2.5" fill="#222"/><circle cx="29" cy="24" r="2.5" fill="#222"/><path d="M24 12V6M18 32h12"/>'),
    phone: S('<rect x="15" y="6" width="18" height="36" rx="5" fill="#DCD2F5"/><path d="M21 36h6M37 12c3 3 3 9 0 12M41 8c5 5 5 15 0 20"/>'),
    bell: S('<path d="M24 8c8 0 12 6 12 14l4 10H8l4-10c0-8 4-14 12-14z" fill="#F5E66B"/><path d="M20 36c0 4 8 4 8 0"/>'),
    cam: S('<rect x="6" y="14" width="26" height="20" rx="5" fill="#DCD2F5"/><path d="M32 20l10-6v20l-10-6"/><circle cx="18" cy="24" r="5"/>'),
    sock: S('<path d="M18 6h14v20l8 8c4 4-2 12-8 8l-14-10z" fill="#F16D5B"/><path d="M18 12h14" stroke="#fff"/>'),
    fish: S('<path d="M6 24c8-9 18-11 28-6l8-7v26l-8-7c-10 5-20 3-28-6z" fill="#BFE4D0"/><circle cx="14" cy="22" r="2" fill="#222"/><path d="M24 18v12"/>'),
    meat: S('<circle cx="20" cy="20" r="12" fill="#F16D5B"/><path d="M29 29l7 7M36 32a4 4 0 1 1 4 4 4 4 0 1 1-4 4" fill="#fff"/>'),
    cookie: S('<circle cx="24" cy="24" r="14" fill="#E9D8B8"/><circle cx="19" cy="20" r="2" fill="#222"/><circle cx="28" cy="26" r="2" fill="#222"/><circle cx="21" cy="29" r="2" fill="#222"/>'),
    energy: S('<circle cx="24" cy="24" r="14" fill="#F5E66B"/><path d="M26 12l-8 14h6l-2 10 8-14h-6z" fill="#222"/>'),
    carrot: S('<path d="M28 16L10 40l24-18z" fill="#F16D5B"/><path d="M30 14c0-6 4-8 8-8 0 6-4 8-8 8zm2 2c6 0 8 4 8 8-6 0-8-4-8-8z" fill="#BFE4D0"/>'),
    soap: S('<rect x="14" y="18" width="20" height="24" rx="5" fill="#DCD2F5"/><path d="M20 18v-6h8v6M24 12V6h8"/><path d="M19 28h10"/>'),
    pill: S('<rect x="8" y="18" width="32" height="14" rx="7" fill="#fff" transform="rotate(-30 24 24)"/><path d="M24 12l0 0" /><path d="M17 15l14 18" stroke="#F16D5B" stroke-width="14"/>'),
    star: S('<path d="M24 6l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z" fill="#F5E66B"/>'),
    question: S('<text x="24" y="36" text-anchor="middle" font-family="Arial" font-size="36" font-weight="900" fill="#222" stroke="none">?</text>'),
    bang: S('<text x="24" y="36" text-anchor="middle" font-family="Arial" font-size="36" font-weight="900" fill="#F16D5B" stroke="none">!</text>'),
    flame: S('<path d="M24 6c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 4-8 4-14 4 2 4 6 4 6s4-8 4-16z" fill="#F16D5B"/>'),
    heart: S('<path d="M24 40S8 30 8 18c0-6 5-10 10-10 3 0 6 2 6 5 0-3 3-5 6-5 5 0 10 4 10 10 0 12-16 22-16 22z" fill="#F16D5B"/>'),
    crown: S('<path d="M8 34l-2-20 10 8 8-14 8 14 10-8-2 20z" fill="#F5E66B"/><path d="M8 38h32"/>'),
    shades: S('<path d="M6 18h36M10 18c0 10 2 14 8 14s8-4 8-14M26 18c0 10 2 14 8 14s8-4 8-14" fill="#222"/>'),
    bubble: S('<path d="M8 10h32v22H24l-8 8v-8H8z" fill="#fff"/><path d="M15 18h18M15 25h12"/>'),
  };
  return I;
})();
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = ML_ICONS[el.dataset.icon] || ""; });
});
window.mlIconImage = (name, px = 64) => {
  const key = name + px;
  if (!window.__mlIconCache) window.__mlIconCache = {};
  if (!window.__mlIconCache[key]) {
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ML_ICONS[name].replace("<svg ", `<svg width="${px}" height="${px}" `));
    window.__mlIconCache[key] = img;
  }
  return window.__mlIconCache[key];
};