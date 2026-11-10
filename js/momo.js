(() => {
  const SIZE = 512;

  function cutCanvas(img) {
    const c = document.createElement("canvas");
    c.width = c.height = SIZE;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const id = ctx.getImageData(0, 0, SIZE, SIZE);
    const d = id.data;
    const bg = new Uint8Array(SIZE * SIZE);
    const stack = [];
    // 3D 渲染图带浅灰地面阴影与右下角水印：底部放宽灰度阈值，靠连通域避免误伤毛发高光
    const isBg = (p) => {
      const i = p * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      const y = (p / SIZE) | 0;
      return (mn > 175 && mx - mn < 14) || (y > SIZE * 0.86 && mn > 140 && mx - mn < 14);
    };
    for (let x = 0; x < SIZE; x++) stack.push(x, (SIZE - 1) * SIZE + x);
    for (let y = 0; y < SIZE; y++) stack.push(y * SIZE, y * SIZE + SIZE - 1);
    while (stack.length) {
      const p = stack.pop();
      if (bg[p] || !isBg(p)) continue;
      bg[p] = 1;
      d[p * 4 + 3] = 0;
      const x = p % SIZE, y = (p / SIZE) | 0;
      if (x > 0) stack.push(p - 1);
      if (x < SIZE - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - SIZE);
      if (y < SIZE - 1) stack.push(p + SIZE);
    }
    for (let p = 0; p < SIZE * SIZE; p++) {
      if (bg[p]) continue;
      const x = p % SIZE, y = (p / SIZE) | 0;
      const near = (x > 0 && bg[p - 1]) || (x < SIZE - 1 && bg[p + 1]) ||
                   (y > 0 && bg[p - SIZE]) || (y < SIZE - 1 && bg[p + SIZE]);
      if (!near) continue;
      const i = p * 4;
      if (Math.min(d[i], d[i + 1], d[i + 2]) > 190) d[i + 3] = 120;
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  document.querySelectorAll("img[data-cut]").forEach((img) => {
    const run = () => { img.src = cutCanvas(img).toDataURL(); };
    if (img.complete && img.naturalWidth) run();
    else img.addEventListener("load", run, { once: true });
  });

  window.momoLoadCut = (src) => new Promise((res) => {
    const im = new Image();
    im.onload = () => res(cutCanvas(im));
    im.src = src;
  });

  const KEY = "momo-lab-stats";
  const seed = { best: 1280, titles: ["家庭一级拆迁户", "装睡大师", "零食黑洞"], vibe: true };
  function get() {
    try { return Object.assign({}, seed, JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return Object.assign({}, seed); }
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  window.momoStats = {
    get, save,
    report(score) { const s = get(); if (score > s.best) { s.best = score; save(s); } return s.best; },
    addTitle(t) { const s = get(); if (!s.titles.includes(t)) { s.titles.push(t); save(s); } return s.titles; },
  };
  window.MOMO_TITLES = [
    { name: "家庭一级拆迁户", how: "初始称号" },
    { name: "装睡大师", how: "初始称号" },
    { name: "零食黑洞", how: "初始称号" },
    { name: "拆迁办主任", how: "拆家指数 ≥ 600" },
    { name: "接食神爪", how: "零食得分 ≥ 250" },
    { name: "影级装睡", how: "装睡成功且剩余 ≥ 1.5 秒" },
  ];
  window.momoVibe = (ms = 25) => { if (get().vibe && navigator.vibrate) navigator.vibrate(ms); };
  window.momoSticker = (host, text, x, y, cls = "") => {
    const el = document.createElement("span");
    el.className = "sticker " + cls;
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    host.appendChild(el);
    setTimeout(() => el.remove(), 750);
  };
})();