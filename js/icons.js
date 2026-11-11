/* 内联图标：一律 currentColor、24 格、无外部依赖。
 * 不用图片图标，这样深色/浅色背景都能靠 CSS 换色。 */
window.CAT_ICONS = (() => {
  const s = (d, extra) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra || ""}>${d}</svg>`;
  const fill = (d) =>
    `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d}</svg>`;

  return {
    home: s('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/>'),
    paw: fill('<circle cx="7" cy="8" r="2.1"/><circle cx="12" cy="6.4" r="2.1"/><circle cx="17" cy="8" r="2.1"/>' +
      '<path d="M12 11c3.2 0 5.6 2.3 5.6 4.7 0 2-1.7 3.3-3.6 3.3-1 0-1.4-.4-2-.4s-1 .4-2 .4c-1.9 0-3.6-1.3-3.6-3.3C6.4 13.3 8.8 11 12 11z"/>'),
    camera: s('<path d="M4 8h3l1.5-2h7L17 8h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>'),
    gear: s('<circle cx="12" cy="12" r="3.2"/>' +
      '<path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>'),
    back: s('<path d="M15 5l-7 7 7 7"/>'),
    next: s('<path d="M9 5l7 7-7 7"/>'),
    close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
    plus: s('<path d="M12 5v14M5 12h14"/>'),
    minus: s('<path d="M5 12h14"/>'),
    check: s('<path d="M4 12.5 9.5 18 20 6.5"/>'),
    play: fill('<path d="M7 4.5 20 12 7 19.5z"/>'),
    pause: fill('<path d="M7 4.5h3.4v15H7zM13.6 4.5H17v15h-3.4z"/>'),
    restart: s('<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>'),
    download: s('<path d="M12 3v12"/><path d="M7.5 11 12 15.5 16.5 11"/><path d="M4 19h16"/>'),
    share: s('<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/>' +
      '<path d="M8.4 10.8 15.6 7.2M8.4 13.2l7.2 3.6"/>'),
    heart: fill('<path d="M12 21s-8-4.7-8-10.2A4.8 4.8 0 0 1 12 7.6 4.8 4.8 0 0 1 20 10.8C20 16.3 12 21 12 21z"/>'),
    star: fill('<path d="m12 3 2.7 5.9 6.3.7-4.7 4.2 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.6l6.3-.7z"/>'),
    trash: s('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
    edit: s('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14.5 5.5 18.5 9.5"/>'),
    spark: fill('<path d="M12 2.5 13.8 8 19 9.8 13.8 11.6 12 17 10.2 11.6 5 9.8 10.2 8z"/>' +
      '<path d="M18.5 15.5 19.4 18l2.6.9-2.6.9-.9 2.5-.9-2.5-2.6-.9 2.6-.9z"/>'),
    timer: s('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.8 2"/><path d="M9 2.5h6"/>'),
    sound: s('<path d="M5 9.5h3L12 5v14l-4-4.5H5z"/><path d="M16 9a4.5 4.5 0 0 1 0 6"/>'),
    mute: s('<path d="M5 9.5h3L12 5v14l-4-4.5H5z"/><path d="M16.5 10 20 13.5M20 10l-3.5 3.5"/>'),
    shirt: s('<path d="M8 3.5 4 6l1.6 4L8 8.6V20h8V8.6l2.4 1.4L20 6l-4-2.5a4 4 0 0 1-8 0z"/>'),
    cat: fill('<path d="M4 5.5 8.4 9h7.2L20 5.5V13a8 8 0 0 1-16 0z"/>' +
      '<circle cx="9.4" cy="14.4" r="1.15" fill="#fff"/><circle cx="14.6" cy="14.4" r="1.15" fill="#fff"/>'),
    fish: s('<path d="M3 12s4-5 9-5 9 5 9 5-4 5-9 5-9-5-9-5z"/><path d="M16 8.5 20 5M16 15.5 20 19"/>'),
    grid: s('<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/>' +
      '<rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>'),
    info: s('<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5M12 7.6v.01"/>')
  };
})();
