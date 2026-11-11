/* 敲地鼠·零食版（js/g/whack.js）
 * 九个洞在一只真纸箱上，冒出来的是实拍抠图：能吃的加分，不该碰的扣分。
 * 图片按各自原图比例缩放后塞进格子里，不拉伸变形。 */
(() => {
  const cfg = CAT_GAMES.byId.whack;
  const cv = document.getElementById("cv");
  const fl = Game.floats();
  const GOOD = CAT_PROPS.GOOD;
  const BAD = ["broom", "detergent", "trashbin", "vacuum", "hairdryer", "socks"];
  const props = {};
  GOOD.concat(BAD).forEach(k => CAT.img(CAT_PROPS.P[k]).then(i => props[k] = i));

  const N = 3;
  let holes = [], spawn = 0.4, hits = 0, misclicks = 0;

  /* 洞的位置：随画布实际高度排，桌面竖屏也不会挤在一起 */
  function layout(st) {
    const top = 74, gap = (st.LH - top - 26) / N, cw = st.LW / N;
    holes = [];
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        holes.push({
          cx: (i + 0.5) * cw, cy: top + gap * j + gap * 0.62,
          cw, ch: gap, item: null, up: 0, t: 0, life: 0, hit: 0, bad: false
        });
      }
    }
  }
  function reset(g) {
    layout(g.st);
    spawn = 0.4; hits = 0; misclicks = 0;
    fl.clear();
  }
  /* 把图按原比例塞进 bw×bh 的框，返回宽 */
  function fitW(img, bw, bh) {
    if (!img || !img.naturalWidth) return bw;
    return Math.min(bw, bh * img.naturalWidth / img.naturalHeight);
  }
  function popOne(g) {
    const free = holes.filter(h => !h.item);
    if (!free.length) return;
    const h = CAT.pick(free);
    const prog = CAT.clamp(g.t / cfg.dur, 0, 1);
    const bad = Math.random() < CAT.lerp(0.22, 0.44, prog);
    h.item = bad ? CAT.pick(BAD) : CAT.pick(GOOD);
    h.bad = bad;
    h.t = 0;
    h.life = CAT.lerp(1.35, 0.72, prog);
    h.hit = 0;
  }

  function update(g, dt) {
    const prog = CAT.clamp(g.t / cfg.dur, 0, 1);
    spawn -= dt;
    if (spawn <= 0) {
      spawn = CAT.lerp(0.92, 0.40, prog);
      popOne(g);
      if (prog > 0.55 && Math.random() < 0.4) popOne(g);
    }
    for (const h of holes) {
      if (!h.item) { h.up = CAT.lerp(h.up, 0, 0.3); continue; }
      h.t += dt;
      const target = h.hit > 0 ? 0 : (h.t < h.life ? 1 : 0);
      h.up = CAT.lerp(h.up, target, h.t < h.life ? 0.34 : 0.26);
      if (h.hit > 0) {
        h.hit -= dt;
        if (h.hit <= 0) h.item = null;
      } else if (h.t > h.life + 0.6) {
        if (!h.bad) g.combo = 0;          // 零食跑了不断连击，但不扣分
        h.item = null; h.t = 0;
      }
    }
    fl.step(dt);
  }

  function tap(g, px, py) {
    for (const h of holes) {
      if (!h.item || h.up < 0.45) continue;
      if (Math.abs(px - h.cx) > h.cw * 0.44 || Math.abs(py - (h.cy - 26)) > h.ch * 0.5) continue;
      h.hit = 0.28;
      if (h.bad) {
        const loss = Math.min(8, g.score);
        g.add(-loss);
        g.combo = 0;
        misclicks++;
        CAT.sfx.bad(); CAT.buzz(28);
        fl.add("不该碰", h.cx, h.cy - 66, "#C4553F");
      } else {
        g.combo++;
        const gain = 8 + Math.min(g.combo, 10) * 2;
        g.add(gain);
        hits++;
        CAT.sfx.good(); CAT.buzz(12);
        fl.add("+" + gain, h.cx, h.cy - 66, g.combo > 3 ? "#F5C445" : "#241F19");
      }
      return;
    }
    CAT.sfx.tap();
  }

  function draw(g, x) {
    const st = g.st;
    if (!holes.length) layout(st);    /* 纸箱底板 */
    x.fillStyle = "#F3E6CE"; x.fillRect(0, 0, st.LW, st.LH);
    x.save();
    x.fillStyle = "#E6CFA5";
    CAT.round(x, 14, 52, st.LW - 28, st.LH - 76, 22); x.fill();
    x.strokeStyle = "rgba(120,90,40,.35)"; x.lineWidth = 3; x.stroke();
    x.fillStyle = "rgba(255,255,255,.35)";
    x.fillRect(14, 52 + (st.LH - 76) * 0.42, st.LW - 28, 16);
    x.restore();

    for (const h of holes) {
      /* 洞口 */
      x.save();
      x.fillStyle = "#7A5C31";
      x.beginPath(); x.ellipse(h.cx, h.cy, h.cw * 0.34, h.ch * 0.13, 0, 0, Math.PI * 2); x.fill();
      x.restore();
      if (!h.item) continue;
      const img = props[h.item];
      const bw = h.cw * 0.72, bh = h.ch * 0.78;
      const w = fitW(img, bw, bh);
      const rise = h.up * (h.ch * 0.62);
      x.save();
      x.beginPath();
      x.rect(h.cx - h.cw * 0.46, h.cy - h.ch * 0.92, h.cw * 0.92, h.ch * 0.92);
      x.clip();
      if (h.hit > 0) { x.globalAlpha = CAT.clamp(h.hit / 0.28, 0, 1); x.translate(0, -10 * (1 - h.hit / 0.28)); }
      Game.prop(x, img, h.cx, h.cy - rise, w);
      x.restore();
    }
    /* 洞口的阴影压回最上层，东西才像从洞里长出来的 */
    for (const h of holes) {
      x.save(); x.globalAlpha = 0.28; x.fillStyle = "#5A4222";
      x.beginPath(); x.ellipse(h.cx, h.cy, h.cw * 0.34, h.ch * 0.1, 0, 0, Math.PI * 2); x.fill();
      x.restore();
    }
    if (g.combo > 1) Game.pop(x, "连击 ×" + g.combo, st.LW / 2, 30, 24);
    fl.draw(x);
    if (g.state === "ready") {
      Game.label(x, "点零食，别点家务", st.LW / 2, st.LH - 30, 15, "#8A7550", "800");
    }
  }

  Game.run({
    canvas: cv, id: cfg.id, name: cfg.name, sub: cfg.sub, how: cfg.how,
    logicalW: 360, dur: cfg.dur, tap,
    reset,
    update, draw,
    resize(g) { layout(g.st); },
    rank: s => s >= 260 ? { label: "S", note: "抓到 " + hits + " 口，误点 " + misclicks + " 次。零食盘已经空了。" }
      : s >= 150 ? { label: "A", note: "抓到 " + hits + " 口，误点 " + misclicks + " 次。手很快。" }
        : s >= 70 ? { label: "B", cls: "b", note: "抓到 " + hits + " 口，误点 " + misclicks + " 次。还行。" }
          : { label: "C", cls: "c", note: "抓到 " + hits + " 口，误点 " + misclicks + " 次。是不是被扫把吓到了。" }
  });
})();
