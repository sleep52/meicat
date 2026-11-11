document.addEventListener("DOMContentLoaded", () => {
  const { $, $$ } = CAT;
  const S = 512;                       // 导出与预览都是正方形
  const cv = $("#cv");
  const st = Game.stage(cv, S);
  const x = cv.getContext("2d");

  const state = {
    base: CAT_CONTENT.PHOTOS[0],
    top: "我真的会谢", bot: "",
    stick: null,                       // 贴纸 key
    sx: S * 0.78, sy: S * 0.74, ssize: 110, srot: -12,
    filter: "原图", weight: "900"
  };
  const FILTERS = ["原图", "高对比", "黑白", "暖黄", "冷蓝"];
  const WEIGHTS = [["900", "粗"], ["700", "中"], ["500", "细"]];

  /* ---------- 底图加载 + 滤镜（手写像素处理，不依赖 ctx.filter，Safari 旧版也一致） ---------- */
  let raw = null, work = null;
  function cover(src, size) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d", { willReadFrequently: true });
    const k = Math.max(size / src.width, size / src.height);
    const w = src.width * k, h = src.height * k;
    g.drawImage(src, (size - w) / 2, (size - h) / 2, w, h);
    return c;
  }
  function applyFilter(name) {
    if (!raw) return;
    const c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(raw, 0, 0);
    if (name === "原图") { work = c; return; }
    const d = g.getImageData(0, 0, S, S), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      let r = p[i], gg = p[i + 1], b = p[i + 2];
      if (name === "高对比") {
        const k = 1.35, m = 128;
        r = clamp(m + (r - m) * k); gg = clamp(m + (gg - m) * k); b = clamp(m + (b - m) * k);
      } else if (name === "黑白") {
        const y = 0.299 * r + 0.587 * gg + 0.114 * b;
        r = gg = b = clamp(y + 12);
      } else if (name === "暖黄") {
        r = clamp(r * 1.10 + 12); gg = clamp(gg * 1.03); b = clamp(b * 0.86);
      } else if (name === "冷蓝") {
        r = clamp(r * 0.90); gg = clamp(gg * 0.98); b = clamp(b * 1.14 + 10);
      }
      p[i] = r; p[i + 1] = gg; p[i + 2] = b;
    }
    g.putImageData(d, 0, 0);
    work = c;
  }
  const clamp = v => v < 0 ? 0 : v > 255 ? 255 : v;

  function loadBase(p) {
    state.base = p;
    CAT.img(p.f).then(im => {
      if (!im) { raw = null; work = null; draw(); CAT.toast("这张读不到：" + p.f); return; }
      raw = cover(im, S);
      applyFilter(state.filter);
      draw();
    });
  }

  /* ---------- 合成 ---------- */
  function compose(size) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d");
    const k = size / S;
    if (work) g.drawImage(work, 0, 0, size, size);
    else { g.fillStyle = "#F0E7D6"; g.fillRect(0, 0, size, size);
      g.fillStyle = "#A9987A"; g.font = CAT.FONT("700", 18 * k); g.textAlign = "center";
      g.fillText("底图没读到", size / 2, size / 2); }

    /* 贴纸 */
    if (state.stick && stickImg(state.stick)) {
      const im = stickImg(state.stick);
      const w = state.ssize * k, h = im.naturalHeight * w / im.naturalWidth;
      g.save();
      g.translate(state.sx * k, state.sy * k);
      g.rotate(state.srot * Math.PI / 180);
      g.drawImage(im, -w / 2, -h / 2, w, h);
      g.restore();
    }

    /* 上下描边大字 */
    g.textAlign = "center"; g.textBaseline = "middle";
    const drawLine = (txt, cy, big) => {
      if (!txt) return;
      let s = big ? 54 : 44;
      s *= k;
      g.font = CAT.FONT(state.weight, s);
      while (g.measureText(txt).width > size * 0.9 && s > 12 * k) {
        s -= 2 * k; g.font = CAT.FONT(state.weight, s);
      }
      g.lineWidth = Math.max(3, s * 0.17);
      g.strokeStyle = "#1A140C"; g.lineJoin = "round";
      g.strokeText(txt, size / 2, cy);
      g.fillStyle = "#FFF8E6";
      g.fillText(txt, size / 2, cy);
    };
    drawLine(state.top, size * 0.11, true);
    drawLine(state.bot, size * 0.9, true);
    /* 水印：说明这是真猫原片做的 */
    g.font = CAT.FONT("700", 12 * k);
    g.fillStyle = "rgba(255,248,230,.85)";
    g.textAlign = "right";
    g.fillText(state.base.t, size - 10 * k, size - 8 * k);
    return c;
  }
  function draw() {
    st.apply(x);
    x.clearRect(0, 0, st.LW, st.LH);
    x.drawImage(compose(S), 0, 0);
  }

  /* ---------- 贴纸库：只用带透明通道的实拍道具 ---------- */
  const sc = {};
  CAT_CONTENT.STICKERS.forEach(s => CAT.img(CAT_PROPS.P[s.k]).then(im => sc[s.k] = im));
  const stickImg = k => sc[k] || null;
  $("#stickers").innerHTML = `<button class="item none" data-k=""><b>不用</b></button>` +
    CAT_CONTENT.STICKERS.map(s =>
      `<button class="item" data-k="${s.k}"><img alt="${s.n}" data-k="${s.k}"><b>${s.n}</b></button>`).join("");
  $$("#stickers img").forEach(img => CAT.toImg(img, CAT_PROPS.P[img.dataset.k], img.alt));
  $$("#stickers .item").forEach(b => b.onclick = () => {
    state.stick = b.dataset.k || null;
    $$("#stickers .item").forEach(o => o.classList.toggle("on", o === b && !!state.stick));
    if (state.stick) { CAT.sfx.tap(); if (!stickImg(state.stick)) CAT.toast("这个贴纸素材没读到"); }
    draw();
  });

  /* ---------- 底图选择 ---------- */
  $("#bases").innerHTML = CAT_CONTENT.PHOTOS.map((p, i) =>
    `<button class="tile${i === 0 ? " on" : ""}" data-i="${i}" style="border-radius:12px;overflow:hidden">
      <img alt="${p.cap}" data-f="${p.f}" style="width:100%;aspect-ratio:1;object-fit:cover"></button>`).join("");
  $$("#bases img").forEach(img => CAT.toImg(img, img.dataset.f));
  $$("#bases .tile").forEach(b => b.onclick = () => {
    $$("#bases .tile").forEach(o => o.classList.remove("on"));
    b.classList.add("on");
    loadBase(CAT_CONTENT.PHOTOS[+b.dataset.i]);
    paintQuick();
    CAT.buzz(8);
  });
  $("#baseN").textContent = CAT_CONTENT.PHOTOS.length + " 张";

  /* ---------- 快捷文案：按照片分类给，点了就填上 ---------- */
  function paintQuick() {
    const arr = CAT_CONTENT.CAPS[state.base.t] || CAT_CONTENT.CAPS["怼脸"];
    $("#quick").innerHTML = arr.map(t => `<button class="pill" data-t="${t}">${t}</button>`).join("");
    $$("#quick .pill").forEach(b => b.onclick = () => {
      if (!state.top) { state.top = b.dataset.t; $("#top").value = state.top; }
      else { state.bot = b.dataset.t; $("#bot").value = state.bot; }
      CAT.sfx.tap(); draw();
    });
  }

  /* ---------- 样式 ---------- */
  $("#filters").innerHTML = FILTERS.map(f =>
    `<button class="btn line small${f === state.filter ? " gold" : ""}" data-f="${f}">${f}</button>`).join("");
  $$("#filters .btn").forEach(b => b.onclick = () => {
    state.filter = b.dataset.f;
    applyFilter(state.filter);
    $$("#filters .btn").forEach(o => o.classList.toggle("gold", o === b));
    draw();
  });
  $("#weights").innerHTML = WEIGHTS.map(([w, n]) =>
    `<button class="btn line small${w === state.weight ? " gold" : ""}" data-w="${w}">${n}</button>`).join("");
  $$("#weights .btn").forEach(b => b.onclick = () => {
    state.weight = b.dataset.w;
    $$("#weights .btn").forEach(o => o.classList.toggle("gold", o === b));
    draw();
  });
  $("#top").oninput = e => { state.top = e.target.value; draw(); };
  $("#bot").oninput = e => { state.bot = e.target.value; draw(); };
  $("#ssize").oninput = e => { state.ssize = +e.target.value; draw(); };
  $("#srot").oninput = e => { state.srot = +e.target.value; draw(); };
  $("#btnNoStick").onclick = () => {
    state.stick = null;
    $$("#stickers .item").forEach(o => o.classList.remove("on"));
    draw(); CAT.toast("已去掉贴纸");
  };

  /* ---------- 摆贴纸：点/拖 ---------- */
  let dragging = false;
  cv.addEventListener("pointerdown", e => {
    const p = st.pt(e);
    state.sx = p[0]; state.sy = p[1]; dragging = true;
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    CAT.buzz(6); draw();
  });
  cv.addEventListener("pointermove", e => {
    if (!dragging) return;
    const p = st.pt(e);
    state.sx = p[0]; state.sy = p[1]; draw();
  });
  cv.addEventListener("pointerup", () => dragging = false);

  /* ---------- 导出与存相册 ---------- */
  $("#btnPng").onclick = () => {
    if (CAT.download(compose(640), "momo-meme-" + Date.now() + ".png")) {
      CAT.patchStat({ memes: 1 });
      const d = daylog(); d.memes++; CAT.save("daylog", d);
      bumpMade();
      CAT.toast("已下载 640×640 PNG");
    }
  };
  $("#btnAlbum").onclick = () => {
    const data = compose(320).toDataURL("image/jpeg", 0.82);
    const a = CAT.list("album");
    a.unshift({ id: Date.now(), src: data, cap: (state.top || state.bot || "表情包").slice(0, 24), tag: "表情包", day: CAT.today() });
    while (a.length > 40) a.pop();
    if (CAT.save("album", a)) { CAT.sfx.good(); CAT.toast("已存进相册（存在本机浏览器）"); paintMade(); }
  };
  function bumpMade() { paintMade(); }
  function paintMade() {
    const a = CAT.list("album").filter(o => o.tag === "表情包");
    $("#madeN").textContent = a.length + " 张";
    $("#made").innerHTML = a.length ? a.slice(0, 6).map(o =>
      `<figure style="margin:0"><img src="${o.src}" alt="做过的表情包" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px">
      <figcaption style="font-size:10.5px" class="mut">${o.cap}</figcaption></figure>`).join("")
      : `<p class="mut small" style="grid-column:1/-1">还没有导出记录。点「下载 PNG」或「存进相册」就会出现在这里。</p>`;
  }

  function daylog() {
    const d = CAT.load("daylog", {});
    return d.date === CAT.today() ? d : { date: CAT.today(), loves: 0, games: 0, memes: 0, outfits: 0 };
  }

  loadBase(CAT_CONTENT.PHOTOS[0]);
  paintQuick(); paintMade();
  $$("#stickers .item")[0].classList.add("on");
});
