/* 真猫站 · 共享层
 *
 * 这一层只干四件事：素材路径与缓存版本、localStorage、音效、页面外壳。
 * 所有素材路径必须过 CAT.asset()，换图后把 HTML 里 core.js 的 ?v= 加一，
 * 否则老访客（还有我自己的测试页）会继续吃缓存里的旧图。
 */
window.CAT = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const irand = (a, b) => Math.floor(rand(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  /* ---------- 路径与版本 ---------- */
  const me = $("script[src*='js/core.js']");
  const src = me ? me.src : "";
  const cut = src.indexOf("js/core.js");
  const base = cut < 0 ? "" : src.slice(0, cut);
  const ver = ((src.split("?")[1] || "").split("&").find(s => s.indexOf("v=") === 0)) || "";
  const asset = p => base + p + (ver && p.indexOf("?") < 0 ? "?" + ver : "");
  const url = p => (p && p.indexOf("data:") === 0 ? p : asset(p));

  /* ---------- 存储：一个命名空间，读写都不许抛 ---------- */
  const NS = "meicat:";
  function load(key, dflt) {
    try {
      const s = localStorage.getItem(NS + key);
      if (!s) return dflt;
      const o = JSON.parse(s);
      return o && typeof o === "object" ? o : dflt;
    } catch (e) { return dflt; }
  }
  function save(key, val) {
    try { localStorage.setItem(NS + key, JSON.stringify(val)); return true; }
    catch (e) { toast("浏览器存储已满，这条没存下"); return false; }
  }
  function list(key) { const a = load(key, []); return Array.isArray(a) ? a : []; }

  /* ---------- 设置 ---------- */
  const settings = Object.assign({ sound: true, anim: true, haptic: true }, load("settings", {}));
  function setSettings(patch) {
    Object.assign(settings, patch);
    save("settings", settings);
    document.documentElement.classList.toggle("no-anim", !settings.anim);
  }
  document.documentElement.classList.toggle("no-anim", !settings.anim);

  /* ---------- 音效：全部 WebAudio 合成，不依赖任何音频文件 ---------- */
  let ac = null;
  function ctx() {
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ac = new C();
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function tone(freq, dur, type, gain, slide, delay, pan) {
    if (!settings.sound) return;
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    /* 听声辨位那位玩家要用左右声道，浏览器不支持 Panner 就退化成单声道 */
    if (pan && a.createStereoPanner) {
      const p = a.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p); p.connect(a.destination);
    } else {
      g.connect(a.destination);
    }
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, gain) {
    if (!settings.sound) return;
    const a = ctx(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = 1400;
    s.buffer = buf; g.gain.value = gain || 0.05;
    s.connect(f).connect(g).connect(a.destination); s.start();
  }
  const sfx = {
    tap: () => tone(520, 0.06, "sine", 0.05),
    good: () => tone(660, 0.12, "triangle", 0.07, 990),
    bad: () => tone(160, 0.2, "sawtooth", 0.06, 80),
    combo: n => tone(320 + Math.min(n, 12) * 46, 0.1, "square", 0.045),
    charge: p => tone(220 + p * 520, 0.05, "sawtooth", 0.03),
    jump: () => tone(300, 0.16, "triangle", 0.06, 760),
    land: () => noise(0.09, 0.05),
    bonus: () => tone(500, 0.3, "triangle", 0.08, 1200),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, "triangle", 0.07, 0, i * 0.11)),
    lose: () => [320, 250, 190].forEach((f, i) => tone(f, 0.22, "sawtooth", 0.055, 0, i * 0.13)),
    tick: () => tone(880, 0.04, "sine", 0.03),
    /* 喵：先升后降的滑音 + 一点颤动，比单音像得多 */
    meow: (long) => {
      tone(520, long ? 0.42 : 0.24, "triangle", 0.07, 940);
      tone(940, long ? 0.34 : 0.2, "sine", 0.045, 380, long ? 0.2 : 0.12);
    },
    /* 带方向的喵：pan -1(左耳) .. 1(右耳)，找猫那款靠这个辨位 */
    meowAt: (pan, soft) => {
      tone(560, soft ? 0.16 : 0.26, "triangle", soft ? 0.035 : 0.07, 900, 0, pan);
      tone(900, soft ? 0.12 : 0.2, "sine", soft ? 0.025 : 0.045, 420, 0.1, pan);
    },
    purr: () => { for (let i = 0; i < 5; i++) tone(120, 0.05, "sine", 0.05, 90, i * 0.07); }
  };
  function buzz(ms) {
    if (!settings.haptic) return;
    try { navigator.vibrate && navigator.vibrate(ms || 12); } catch (e) {}
  }

  /* ---------- 记录与累计 ---------- */
  const REC = load("records", {});
  function record(game, score) {
    const r = REC[game] || { best: 0, plays: 0 };
    r.plays++;
    const isNew = score > r.best;
    if (isNew) r.best = score;
    REC[game] = r; save("records", REC);
    patchStat({ games: 1 });
    return { best: r.best, isNew, plays: r.plays };
  }
  const best = g => (REC[g] || {}).best || 0;
  const plays = g => (REC[g] || {}).plays || 0;

  const STAT0 = { points: 0, games: 0, memes: 0, outfits: 0, loves: 0 };
  function stat() { return Object.assign({}, STAT0, load("stats", {})); }
  function patchStat(patch) {
    const s = load("stats", STAT0);
    for (const k in patch) s[k] = (s[k] || 0) + patch[k];
    save("stats", s);
    return s;
  }
  const today = () => new Date().toISOString().slice(0, 10);

  /* ---------- 装扮：每个部位最多一件，null 就是脱下 ---------- */
  const WEAR0 = { head: null, cloth: null, neck: null, hand: null };
  function wear() { return Object.assign({}, WEAR0, load("wear", {})); }
  function setWear(slot, id) {
    const w = wear();
    w[slot] = id || null;
    save("wear", w);
    return w;
  }

  /* ---------- 占位图：素材缺失时必须画出来，不许留空白 ---------- */
  function placeholder(label) {
    const t = String(label || "素材缺失").replace(/[<>&"]/g, "").slice(0, 46);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">' +
      '<rect width="320" height="240" fill="#F0E7D6"/>' +
      '<path d="M0 0h320v240H0z" fill="none" stroke="#D8C9AE" stroke-width="8" stroke-dasharray="18 12"/>' +
      '<text x="160" y="112" font-size="26" text-anchor="middle" fill="#A9987A" font-family="sans-serif">素材缺失</text>' +
      '<text x="160" y="146" font-size="14" text-anchor="middle" fill="#B8A98C" font-family="monospace">' + t + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  /* 给 <img> 换源；路径不存在就走占位图，绝不出现破图标 */
  function toImg(el, path, label) {
    if (!el) return null;
    el.onerror = () => { el.onerror = null; el.src = placeholder(label || path); el.classList.add("is-ph"); };
    el.src = url(path);
    return el;
  }
  /* 预加载一张图，失败也 resolve（返回 null），调用方自己决定画什么 */
  function img(path) {
    return new Promise(res => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = url(path);
    });
  }

  /* ---------- 外壳：底部 tab ---------- */
  const TABS = [
    ["home", "index.html", "首页", "home"],
    ["games", "games.html", "游戏", "paw"],
    ["album", "gallery.html", "相册", "camera"],
    ["me", "settings.html", "我的", "gear"]
  ];
  function shell() {
    const page = document.body.dataset.page || "";
    if (document.body.dataset.tabbar !== "off") {
      const nav = document.createElement("nav");
      nav.className = "tabbar";
      nav.innerHTML = TABS.map(([id, href, label, ico]) =>
        `<a href="${base}${href}"${id === page ? ' class="on" aria-current="page"' : ""}>` +
        `<span class="ti">${CAT_ICONS[ico]}</span><span>${label}</span></a>`).join("");
      document.body.append(nav);
    }
    const back = document.body.dataset.back;
    if (back) {
      const b = document.createElement("a");
      b.className = "backbar";
      b.href = base + back;
      b.innerHTML = CAT_ICONS.back + "<span>" + (document.body.dataset.backText || "返回") + "</span>";
      document.body.prepend(b);
    }
  }

  /* ---------- 弹层与提示 ---------- */
  let sheetEl = null;
  function sheet(html, opts) {
    close();
    const o = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "sheet-wrap" + (o.cls ? " " + o.cls : "");
    wrap.innerHTML = `<div class="sheet-mask"></div><div class="sheet" role="dialog" aria-modal="true">
      ${o.title ? `<h3>${o.title}</h3>` : ""}<div class="sheet-body">${html}</div>
      ${o.actions || '<button class="btn gold block" data-close>好</button>'}</div>`;
    document.body.append(wrap);
    requestAnimationFrame(() => wrap.classList.add("open"));
    sheetEl = wrap;
    wrap.querySelector(".sheet-mask").onclick = () => { if (!o.sticky) close(); };
    $$("[data-close]", wrap).forEach(b => b.onclick = () => close());
    return wrap;
  }
  function close() {
    if (!sheetEl) return;
    const w = sheetEl; sheetEl = null;
    w.classList.remove("open");
    setTimeout(() => w.remove(), 220);
  }
  let toastTimer = null;
  function toast(msg) {
    let t = $("#catToast");
    if (!t) { t = document.createElement("div"); t.id = "catToast"; t.className = "toast"; document.body.append(t); }
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 1800);
  }

  /* ---------- 画布小工具（游戏和导出共用） ---------- */
  function round(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }
  const FONT = (w, s) => `${w} ${s}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif`;
  /* 居中绘制，超宽自动缩字号，保证长文案不会溢出导出图 */
  function fitText(x, text, cx, cy, maxW, weight, size) {
    let s = size;
    x.font = FONT(weight, s);
    while (x.measureText(text).width > maxW && s > 8) {
      s -= 1; x.font = FONT(weight, s);
    }
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(text, cx, cy);
    return s;
  }
  /* canvas -> 下载。file:// 下 toDataURL 可能被污染画布拒绝，这里给明确反馈 */
  function download(cv, name) {
    let data;
    try { data = cv.toDataURL("image/png"); }
    catch (e) { toast("图片被浏览器拦住了，换 http 预览再试"); return false; }
    const a = document.createElement("a");
    a.href = data; a.download = name || "meicat.png";
    document.body.append(a); a.click(); a.remove();
    return true;
  }

  document.addEventListener("DOMContentLoaded", shell);

  return {
    $, $$, clamp, lerp, rand, irand, pick, fmt, base, asset, url,
    settings, setSettings, sfx, tone, noise, buzz,
    load, save, list, record, best, plays, stat, patchStat, today,
    wear, setWear, placeholder, toImg, img,
    sheet, close, toast, round, FONT, fitText, download
  };
})();
