(() => {
  const { Engine, World, Bodies, Events } = Matter;

  const LEVELS = [
    { img: "sleep",     r: 22, color: "#a8d8a8" },
    { img: "flat",      r: 27, color: "#87ceeb" },
    { img: "wide",      r: 32, color: "#dda0dd" },
    { img: "sit",       r: 37, color: "#f0e68c" },
    { img: "bunny",     r: 42, color: "#ffb6c1" },
    { img: "seal",      r: 47, color: "#4ecdc4" },
    { img: "hashbrown", r: 52, color: "#ffa500" },
  ];

  const W = 420, H = 720, DANGER_Y = 110, DROP_Y = 70;
  const cv = document.getElementById("game");
  const ctx = cv.getContext("2d");
  const el = (id) => document.getElementById(id);
  const scoreEl = el("scoreVal"), bestEl = el("bestVal");

  let best = +(localStorage.getItem("merge-best") || 0);
  bestEl.textContent = best;

  const imgs = {};
  const sprites = {}; // pre-rendered offscreen canvases
  LEVELS.forEach((lv, i) => {
    const im = new Image();
    im.src = `assets/${lv.img}_s.jpg`;
    imgs[i] = im;
    // Pre-render sprite
    const c = document.createElement("canvas");
    const d = lv.r * 2 + 4;
    c.width = d; c.height = d;
    const cx = c.getContext("2d");
    cx.beginPath();
    cx.arc(d/2, d/2, lv.r, 0, Math.PI * 2);
    cx.closePath();
    cx.clip();
    if (im.complete && im.naturalWidth) {
      cx.drawImage(im, 2, 2, lv.r * 2, lv.r * 2);
    } else {
      cx.fillStyle = lv.color;
      cx.fillRect(0, 0, d, d);
    }
    cx.strokeStyle = "#00000066";
    cx.lineWidth = 2.5;
    cx.beginPath();
    cx.arc(d/2, d/2, lv.r, 0, Math.PI * 2);
    cx.stroke();
    sprites[i] = c;
  });

  let engine, world, bodies = [], score = 0;
  let nextLevels = [0, 0], aimX = W / 2;
  let cooldownUntil = 0, over = false, settleTimers = new Map();
  let lastTs = 0, lastPhysicsUpdate = 0, dragging = false;
  let floatingTexts = [];

  function init() {
    engine = Engine.create({ gravity: { x: 0, y: 1.6, scale: 0.001 } });
    world = engine.world;
    const wallOpts = { isStatic: true, friction: 0.3, restitution: 0.2 };
    World.add(world, [
      Bodies.rectangle(W / 2, H + 30, W, 60, wallOpts),
      Bodies.rectangle(-30, H / 2, 60, H, wallOpts),
      Bodies.rectangle(W + 30, H / 2, 60, H, wallOpts),
    ]);
    Events.on(engine, "collisionStart", onCollide);
  }

  function randDropLevel() { return Math.floor(Math.random() * 5); }

  function drop(x) {
    if (performance.now() < cooldownUntil || over) return;
    const lv = nextLevels[0];
    const r = LEVELS[lv].r;
    x = Math.max(r + 10, Math.min(W - r - 10, x));
    const body = Bodies.circle(x, DROP_Y, r, {
      restitution: 0.3,
      friction: 0.4,
      density: 0.002 + lv * 0.0005,
      label: "cat",
    });
    body.catLevel = lv;
    body.catId = Math.random().toString(36).slice(2);
    World.add(world, body);
    bodies.push(body);
    cooldownUntil = performance.now() + 450;
    nextLevels.shift();
    nextLevels.push(randDropLevel());
    MemeAudio.flap();
  }

  function onCollide(e) {
    if (over) return;
    for (const pair of e.pairs) {
      const a = pair.bodyA, b = pair.bodyB;
      if (a.catLevel == null || b.catLevel == null) continue;
      if (a.catLevel !== b.catLevel) continue;
      if (a.catLevel >= LEVELS.length - 1) continue;
      if (a.merging || b.merging) continue;
      a.merging = b.merging = true;
      const nx = (a.position.x + b.position.x) / 2;
      const ny = (a.position.y + b.position.y) / 2;
      const nl = a.catLevel + 1;
      const nr = LEVELS[nl].r;
      const nb = Bodies.circle(nx, ny, nr, {
        restitution: 0.15,
        friction: 0.5,
        density: 0.0018 + nl * 0.0004,
        label: "cat",
      });
      nb.catLevel = nl;
      nb.catId = Math.random().toString(36).slice(2);
      nb.scaleAnim = 0.5;
      World.remove(world, a);
      World.remove(world, b);
      World.add(world, nb);
      bodies = bodies.filter((x) => x !== a && x !== b);
      bodies.push(nb);
      const pts = nl * 10;
      score += pts;
      scoreEl.textContent = score;
      floatingTexts.push({ x: nx, y: ny, text: `+${pts}`, life: 1.0 });
      MemeAudio.match();
    }
  }

  function checkGameOver() {
    for (const b of bodies) {
      if (b.catLevel == null) continue;
      const r = LEVELS[b.catLevel].r;
      if (b.position.y - r < DANGER_Y) {
        if (Math.abs(b.velocity.y) < 0.4 && Math.abs(b.velocity.x) < 0.4) {
          if (!settleTimers.has(b.id)) settleTimers.set(b.id, performance.now());
          else if (performance.now() - settleTimers.get(b.id) > 1500) return true;
        } else settleTimers.delete(b.id);
      } else settleTimers.delete(b.id);
    }
    return false;
  }

  function drawCat(x, y, level, scale = 1, alpha = 1) {
    const lv = LEVELS[level];
    const sprite = sprites[level];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (sprite) {
      ctx.drawImage(sprite, -lv.r - 2, -lv.r - 2);
    } else {
      ctx.fillStyle = lv.color;
      ctx.beginPath(); ctx.arc(0, 0, lv.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1a2847");
    sky.addColorStop(1, "#0d1520");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#ff4444aa";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(0, DANGER_Y);
    ctx.lineTo(W, DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff444488";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("危险线", 10, DANGER_Y - 8);

    if (!over && performance.now() >= cooldownUntil) {
      ctx.strokeStyle = "#ffffff66";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(aimX, DROP_Y + 25);
      ctx.lineTo(aimX, H - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      const nextR = LEVELS[nextLevels[0]].r * 1.0;
      ctx.fillStyle = "#ffffff33";
      ctx.beginPath();
      ctx.arc(aimX, DROP_Y, nextR + 12, 0, Math.PI * 2);
      ctx.fill();
      drawCat(aimX, DROP_Y, nextLevels[0], 1.0, 0.95);

      const next2R = LEVELS[nextLevels[1]].r * 0.7;
      ctx.fillStyle = "#ffffff22";
      ctx.beginPath();
      ctx.arc(W - 50, 50, next2R + 8, 0, Math.PI * 2);
      ctx.fill();
      drawCat(W - 50, 50, nextLevels[1], 0.7, 0.7);
      ctx.fillStyle = "#ffffff88";
      ctx.font = "12px sans-serif";
      ctx.fillText("下一个", W - 75, 80);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ctx.save();
      ctx.globalAlpha = ft.life;
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 28px sans-serif";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
      ft.y -= 1.5;
      ft.life -= 0.02;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    for (const b of bodies) {
      if (b.catLevel == null) continue;
      let s = 1;
      if (b.scaleAnim > 0) { s = 1 + b.scaleAnim; b.scaleAnim = Math.max(0, b.scaleAnim - 0.03); }
      drawCat(b.position.x, b.position.y, b.catLevel, s);
    }
  }

  function loop(ts) {
    if (!over) {
      const dt = Math.min(50, ts - lastTs);
      lastTs = ts;
      // Update physics at 30fps for performance
      if (ts - lastPhysicsUpdate > 33) {
        Engine.update(engine, 33);
        lastPhysicsUpdate = ts;
        if (checkGameOver()) endGame();
      }
    }
    draw();
    nextFrame();
  }

  let rafWatch = 0, rafHappened = false;
  function nextFrame() {
    rafHappened = false;
    clearTimeout(rafWatch);
    rafWatch = setTimeout(() => { if (!rafHappened) loop(performance.now()); }, 60);
    requestAnimationFrame((t) => { rafHappened = true; loop(t); });
  }

  function start() {
    if (engine) World.clear(world, false);
    bodies = [];
    score = 0;
    over = false;
    settleTimers.clear();
    lastTs = performance.now();
    lastPhysicsUpdate = lastTs;
    aimX = W / 2;
    scoreEl.textContent = 0;
    el("startOverlay").classList.add("hidden");
    el("endOverlay").classList.add("hidden");
    init();
    nextLevels = [randDropLevel(), randDropLevel()];
    floatingTexts = [];
    nextFrame();
  }

  function endGame() {
    over = true;
    MemeAudio.crash();
    if (score > best) { best = score; localStorage.setItem("merge-best", best); bestEl.textContent = best; }
    el("endScore").textContent = score;
    el("endTitle").textContent = score === best && score > 0 ? "🎉 新纪录！" : "堆满了！";
    const c = [
      [0, "猫山崩塌，铲屎官失业。"],
      [80, "勉强维持秩序，罐头还能发。"],
      [200, "合成大师，猫界炼金术士。"],
      [400, "薯饼降临，你已经是猫神。"],
    ];
    el("endComment").textContent = c.reduce((a, x) => (score >= x[0] ? x : a), c[0])[1];
    el("endOverlay").classList.remove("hidden");
  }

  function getAimX(clientX) {
    const rect = cv.getBoundingClientRect();
    return (clientX - rect.left) * (W / rect.width);
  }

  cv.addEventListener("pointerdown", (e) => {
    if (over) return;
    dragging = true;
    aimX = getAimX(e.clientX);
  });

  cv.addEventListener("pointermove", (e) => {
    if (!dragging || over) return;
    aimX = getAimX(e.clientX);
  });

  cv.addEventListener("pointerup", (e) => {
    if (!dragging || over) return;
    dragging = false;
    drop(aimX);
  });

  cv.addEventListener("pointercancel", () => { dragging = false; });

  el("startBtn").addEventListener("click", start);
  el("againBtn").addEventListener("click", start);

  if (new URLSearchParams(location.search).has("test")) {
    window.__merge = {
      get bodyCount() { return bodies.filter(b => b.catLevel != null).length; },
      get score() { return score; },
      drop(x) { drop(x); },
    };
  }
})();
