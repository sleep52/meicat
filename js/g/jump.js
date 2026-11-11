/* 蓄力跳家具（js/g/jump.js）
 * 只有 Cat 那一张正脸坐姿照片，所以「跳」用的是对整张照片做得真的形变：
 * 蓄力下蹲、空中倾斜、落地压扁、影子跟高度分离。没有做跳跃序列帧。
 * 落点全是真道具抠图，尺寸按各自照片比例给，落在正中间算完美。 */
(() => {
  const cfg = CAT_GAMES.byId.jump;
  const cv = document.getElementById("cv");
  const distEl = document.getElementById("gDist");

  /* 只有能站得住的家具才当落点，立着的那种不算 */
  const KEYS = ["pillow", "platter", "gift", "trashbin", "socks", "kibble", "toyfish"];
  const SIZE = {
    pillow: [150, 62], platter: [112, 42], gift: [92, 92], trashbin: [74, 86],
    socks: [76, 64], kibble: [96, 88], toyfish: [104, 80]
  };
  const props = {};
  KEYS.forEach(k => CAT.img(CAT_PROPS.P[k]).then(i => props[k] = i));
  Cat.load();

  const G = 1150;
  const fl = Game.floats();
  let plats = [], cat = { x: 90, y: 0 }, cam = 0, power = 0, dir = 1, phase = "sit", from = null, dist = 0, tick = 0;

  let st;
  const gy = () => st.LH - 58;
  const topOf = p => gy() - SIZE[p.k][1];

  function reset() {
    plats = [{ x: 90, k: "pillow" }];
    for (let i = 0; i < 6; i++) extend();
    cat = { x: 90, y: topOf(plats[0]), vx: 0, vy: 0, rot: 0, squash: 0 };
    cam = 0; power = 0; dir = 1; phase = "sit"; dist = 0; from = plats[0];
    fl.clear();
    distEl.textContent = "0 m";
  }
  function extend() {
    const prev = plats[plats.length - 1];
    plats.push({ x: prev.x + CAT.rand(58, 178), k: CAT.pick(KEYS) });
  }

  function launch() {
    cat.vx = 132 + power * 268;
    cat.vy = -(232 + power * 248);
    phase = "fly";
    CAT.sfx.jump(); CAT.buzz(10);
  }
  function land(g, p) {
    cat.y = topOf(p); cat.vy = 0; cat.vx = 0; cat.rot = 0; cat.squash = 0.24;
    phase = "sit"; from = p;
    const half = SIZE[p.k][0] / 2;
    const perfect = Math.abs(cat.x - p.x) < half * 0.28;
    g.combo = perfect ? g.combo + 1 : 0;
    const gain = (perfect ? 25 : 10) + g.combo * 2;
    g.add(gain);
    dist = Math.max(dist, Math.round((cat.x - 90) / 10));
    distEl.textContent = dist + " m";
    fl.add(perfect ? "完美 +" + gain : "+" + gain, cat.x - cam, cat.y - 150, perfect ? "#F5C445" : "#241F19");
    CAT.sfx.land();
    if (perfect) { CAT.sfx.good(); CAT.buzz(18); }
  }
  function fail(g) {
    CAT.sfx.bad(); CAT.buzz(30);
    cat.rot = 0.5; cat.squash = 0.3;
    g.miss();
    if (g.state !== "play") return;
    /* 回到起跳那件家具上：不清分数，只断连击、扣一条命 */
    cat.x = from.x; cat.y = topOf(from); cat.vx = 0; cat.vy = 0; cat.rot = 0;
    phase = "sit"; power = 0; dir = 1;
  }

  function update(g, dt) {
    const inp = g.inp;
    if (phase === "sit" && inp.just) { phase = "charge"; power = 0; dir = 1; }
    else if (phase === "charge") {
      power += dir * dt * 1.05;
      if (power > 1) { power = 1; dir = -1; }
      if (power < 0) { power = 0; dir = 1; }
      cat.squash = 0.06 + power * 0.2;
      tick += dt;
      if (tick > 0.12) { tick = 0; CAT.sfx.charge(power); }
      if (inp.up || !inp.down) launch();
    }
    else if (phase === "fly") {
      cat.vy += G * dt;
      cat.x += cat.vx * dt;
      cat.y += cat.vy * dt;
      cat.rot = CAT.clamp(cat.vy * 0.0008, -0.35, 0.5);
      cat.squash = CAT.lerp(cat.squash, 0, 0.2);
      if (cat.vy > 0) {
        const p = plats.find(q => Math.abs(q.x - cat.x) <= SIZE[q.k][0] / 2);
        if (p && cat.y >= topOf(p)) land(g, p);
        else if (cat.y >= gy() + 6) fail(g);
      }
    }
    else {
      cat.squash = CAT.lerp(cat.squash, 0, 0.16);
      cat.y = topOf(from);
      cat.x = from.x;
    }
    cam = CAT.lerp(cam, Math.max(0, cat.x - 132), 0.14);
    while (plats[plats.length - 1].x - cam < 560) extend();
    while (plats.length > 2 && plats[0].x - cam < -220 && plats[0] !== from) plats.shift();
    fl.step(dt);
  }

  function draw(g, x) {
    const y0 = gy();
    x.fillStyle = "#F6EBD6"; x.fillRect(0, 0, 360, y0);
    Game.floor(x, y0, 360);
    x.strokeStyle = "rgba(120,96,54,.10)"; x.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const sx = ((i * 90 - cam * 0.4) % 720 + 720) % 720 - 90;
      x.beginPath(); x.moveTo(sx, 40); x.lineTo(sx + 30, y0); x.stroke();
    }
    for (const p of plats) {
      const sx = p.x - cam;
      if (sx < -140 || sx > 500) continue;
      const [w, h] = SIZE[p.k];
      x.save(); x.globalAlpha = 0.2; x.fillStyle = "#4a3a22";
      x.beginPath(); x.ellipse(sx, y0 + 4, w * 0.46, 8, 0, 0, Math.PI * 2); x.fill(); x.restore();
      Game.prop(x, props[p.k], sx, y0 - h / 2, w);
    }
    if (phase === "fly") {
      x.save(); x.globalAlpha = 0.22; x.fillStyle = "#4a3a22";
      x.beginPath(); x.ellipse(cat.x - cam, y0 + 3, 46, 8, 0, 0, Math.PI * 2); x.fill(); x.restore();
    }
    Cat.box(cat.x - cam - 60, cat.y - 130, 120).draw(x, Cat.pose({
      squash: cat.squash, rot: phase === "fly" ? cat.rot : 0,
      breathe: phase === "fly" ? 0 : Math.sin(g.t * 1.6) * 0.6,
      shadow: phase === "fly" ? 0 : 1
    }));
    if (phase === "charge") {
      const bw = 150, bx = 105, by = 26;
      x.fillStyle = "rgba(255,255,255,.82)"; CAT.round(x, bx, by, bw, 16, 8); x.fill();
      x.fillStyle = "#F5C445"; CAT.round(x, bx + 2, by + 2, Math.max(6, (bw - 4) * power), 12, 6); x.fill();
      x.strokeStyle = "#241F19"; x.lineWidth = 3; CAT.round(x, bx, by, bw, 16, 8); x.stroke();
      Game.label(x, "松手就跳", 180, 60, 15, "#6B5B3C", "800");
    }
    if (g.combo > 1) Game.pop(x, "连击 ×" + g.combo, 180, 88, 26);
    fl.draw(x);
  }

  const game = Game.run({
    canvas: cv, id: cfg.id, name: cfg.name, sub: cfg.sub, how: cfg.how,
    logicalW: 360, lives: 3,
    reset() { reset(); },
    update(g, dt) { update(g, dt); },
    draw(g, x) { draw(g, x); },
    rank: s => s >= 260 ? { label: "S", note: "跳了 " + dist + " 米，家具上全是爪印。" }
      : s >= 140 ? { label: "A", note: "跳了 " + dist + " 米，稳。" }
        : s >= 60 ? { label: "B", cls: "b", note: "跳了 " + dist + " 米，还行。" }
          : { label: "C", cls: "c", note: "跳了 " + dist + " 米，是不是怕高。" }
  });
  st = game.st;
})();
