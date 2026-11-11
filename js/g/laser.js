/* 追红点（js/g/laser.js）
 * 红点是激光笔的光斑，本来就不是实物，所以用画布画的辉光，不假装是照片。
 * 追上后到手的「战利品」是 assets/props/ 的实拍抠图，摆进顶部架子。
 * 按住满 0.5 秒才算追上：加速、瞬移、分裂按追上次数逐级开启。 */
(() => {
  const cfg = CAT_GAMES.byId.laser;
  const cv = document.getElementById("cv");
  const hintEl = document.getElementById("gHint");
  const fl = Game.floats();
  const LOOT = ["toyfish", "ball", "dropball", "cookie", "kibble", "strips", "fish", "platter"];
  const props = {};
  LOOT.forEach(k => CAT.img(CAT_PROPS.P[k]).then(i => props[k] = i));
  Cat.load();

  const HOLD = 0.5;
  let dots = [], catches = 0, speed = 132, loot = [], telT = 3.2, swipe = 0, trail = [], st;

  /* 舞台分区：顶架 / 中间活动区 / 地板上的猫 */
  const shelfY = () => 72;
  const floorY = () => st.LH - 112;
  const areaY = () => [118, floorY() - 26];

  function spawnDot(first) {
    const a = areaY();
    return {
      x: first ? st.LW / 2 : CAT.rand(44, st.LW - 44), y: CAT.rand(a[0], a[1]),
      vx: CAT.rand(-1, 1) * speed, vy: CAT.rand(-1, 1) * speed,
      hold: 0, tel: 0, r: 15
    };
  }
  function jump(d) {
    const a = areaY();
    d.x = CAT.rand(44, st.LW - 44); d.y = CAT.rand(a[0], a[1]);
    d.vx = CAT.rand(-1, 1) * speed; d.vy = CAT.rand(-1, 1) * speed;
    d.hold = 0; d.tel = 0.34;
    CAT.sfx.tap();
  }
  function reset(g) {
    st = g.st;
    dots = [spawnDot(true)];
    catches = 0; speed = 132; loot = []; telT = 3.4; swipe = 0; trail = [];
    fl.clear();
  }

  function update(g, dt) {
    st = g.st;
    const a = areaY();
    const inp = g.inp;
    let anyHold = false;
    swipe = Math.max(0, swipe - dt * 3);
    for (const d of dots) {
      /* wandering：每帧给一点随机加速度，轨迹不可预测但不抽搐 */
      d.vx += CAT.rand(-1, 1) * 210 * dt;
      d.vy += CAT.rand(-1, 1) * 210 * dt;
      const m = Math.hypot(d.vx, d.vy) || 1;
      const cap = speed * (d.hold > 0 ? 0.3 : 1);
      d.vx = d.vx / m * cap; d.vy = d.vy / m * cap;
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.x < 34) { d.x = 34; d.vx = Math.abs(d.vx); }
      if (d.x > st.LW - 34) { d.x = st.LW - 34; d.vx = -Math.abs(d.vx); }
      if (d.y < a[0]) { d.y = a[0]; d.vy = Math.abs(d.vy); }
      if (d.y > a[1]) { d.y = a[1]; d.vy = -Math.abs(d.vy); }
      if (d.tel > 0) d.tel -= dt;
      const on = inp.down && Math.hypot(inp.x - d.x, inp.y - d.y) < d.r + 24;
      if (on) {
        d.hold += dt; anyHold = true;
        if (d.hold >= HOLD) caught(g, d);
      } else d.hold = Math.max(0, d.hold - dt * 1.8);
    }
    /* 瞬移：按住的时候不瞬移，否则玩家会觉得被耍 */
    telT -= dt;
    if (telT <= 0) {
      telT = CAT.clamp(3.6 - catches * 0.16, 1.5, 3.6);
      dots.forEach(d => { if (d.hold <= 0) jump(d); });
    }
    trail.push({ x: dots[0].x, y: dots[0].y, t: 0 });
    if (trail.length > 20) trail.shift();
    for (let i = trail.length - 1; i >= 0; i--) { trail[i].t += dt; if (trail[i].t > 0.34) trail.splice(i, 1); }
    if (hintEl) hintEl.textContent = anyHold ? "按住别动" : catches >= 2 ? "会瞬移了" : dots.length > 1 ? "两个点了" : "按住红点";
    fl.step(dt);
  }
  function caught(g, d) {
    catches++;
    g.combo++;
    const gain = 10 + Math.min(g.combo, 8) * 3;
    g.add(gain);
    speed = Math.min(340, speed + 14);
    d.hold = 0;
    jump(d);
    swipe = 1;
    CAT.sfx.good(); CAT.buzz(16);
    fl.add("+" + gain, d.x, d.y - 26, "#F5C445");
    if (loot.length < LOOT.length) {
      const k = LOOT[loot.length];
      loot.push(k);
      CAT.sfx.bonus();
      CAT.toast("到手：" + CAT_PROPS.name[k]);
    }
    /* 第 5 次、第 11 次追上开始分裂 */
    if ((catches === 5 && dots.length === 1) || (catches === 11 && dots.length === 2)) {
      dots.push(spawnDot(false));
      CAT.toast("红点分裂了，两个都要盯");
    }
  }

  function draw(g, x) {
    st = g.st;
    const LW = st.LW, LH = st.LH, fy = floorY();
    x.fillStyle = "#F7EEDC"; x.fillRect(0, 0, LW, LH);
    x.save();
    x.strokeStyle = "rgba(150,120,70,.10)"; x.lineWidth = 2;
    for (let i = 1; i < 5; i++) { const yy = 110 + i * (fy - 110) / 5; x.beginPath(); x.moveTo(0, yy); x.lineTo(LW, yy); x.stroke(); }
    x.restore();
    Game.floor(x, fy, LW);

    /* 顶部战利品架 */
    x.save();
    x.fillStyle = "#E9D8B6";
    CAT.round(x, 14, 44, LW - 28, 56, 14); x.fill();
    x.strokeStyle = "rgba(36,31,25,.22)"; x.lineWidth = 2; x.stroke();
    x.restore();
    const slot = (LW - 36) / LOOT.length;
    loot.forEach((k, i) => {
      x.save(); x.globalAlpha = 0.16; x.fillStyle = "#7A5C31";
      x.beginPath(); x.ellipse(26 + i * slot + slot / 2, 94, slot * 0.34, 4, 0, 0, Math.PI * 2); x.fill();
      x.restore();
      Game.prop(x, props[k], 26 + i * slot + slot / 2, 70, slot * 0.86);
    });
    if (!loot.length) Game.label(x, "追上红点就有", LW / 2, 72, 13, "#A9946B", "800");

    /* 猫：整张照片朝红点倾斜，追上时向前扑一下 */
    const cw = 180, cx = LW / 2 - cw / 2, cy = fy - 193;
    const target = dots[0] || { x: LW / 2, y: 140 };
    const rot = CAT.clamp((target.x - LW / 2) / LW * 0.7, -0.32, 0.32);
    Cat.box(cx, cy, cw).draw(x, Cat.pose({
      rot, breathe: Math.sin(g.t * 2.2) * 0.7, squash: swipe * 0.14, y: -swipe * 8
    }));

    /* 红点尾迹 + 光斑 + 按住进度圈 */
    for (const t of trail) {
      x.save(); x.globalAlpha = 0.15 * (1 - t.t / 0.34);
      x.fillStyle = "#E8452F";
      x.beginPath(); x.arc(t.x, t.y, 8, 0, Math.PI * 2); x.fill(); x.restore();
    }
    for (const d of dots) {
      const gr = x.createRadialGradient(d.x, d.y, 1, d.x, d.y, d.r * 2.6);
      gr.addColorStop(0, "rgba(255,90,60,.95)");
      gr.addColorStop(0.35, "rgba(232,69,47,.5)");
      gr.addColorStop(1, "rgba(232,69,47,0)");
      x.fillStyle = gr;
      x.beginPath(); x.arc(d.x, d.y, d.r * 2.6, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#FF4A2E";
      x.beginPath(); x.arc(d.x, d.y, d.r * 0.6, 0, Math.PI * 2); x.fill();
      if (d.tel > 0) {
        x.save(); x.globalAlpha = d.tel / 0.34; x.strokeStyle = "#E8452F"; x.lineWidth = 3;
        x.beginPath(); x.arc(d.x, d.y, d.r + 18 * (1 - d.tel / 0.34), 0, Math.PI * 2); x.stroke(); x.restore();
      }
      if (d.hold > 0) {
        x.save(); x.translate(d.x, d.y); x.rotate(-Math.PI / 2);
        x.strokeStyle = "#241F19"; x.lineWidth = 5; x.lineCap = "round";
        x.beginPath(); x.arc(0, 0, d.r + 15, 0, Math.PI * 2 * (d.hold / HOLD)); x.stroke();
        x.restore();
      }
    }
    if (g.combo > 1) Game.pop(x, "连击 ×" + g.combo, LW / 2, 26, 22);
    fl.draw(x);
  }

  Game.run({
    canvas: cv, id: cfg.id, name: cfg.name, sub: cfg.sub, how: cfg.how,
    logicalW: 360, dur: cfg.dur, playingBtn: "暂停",
    reset, update, draw,
    resize(g) { st = g.st; },
    rank: s => s >= 300 ? { label: "S", note: "追上 " + catches + " 次，架子都放不下了。" }
      : s >= 180 ? { label: "A", note: "追上 " + catches + " 次，红点开始怕你了。" }
        : s >= 90 ? { label: "B", cls: "b", note: "追上 " + catches + " 次，手还行。" }
          : { label: "C", cls: "c", note: "追上 " + catches + " 次。红点赢了这次。" }
  });
})();
