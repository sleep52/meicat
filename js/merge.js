(() => {
  const { Engine, World, Bodies, Events, Composite, Body, Vector } = Matter;

  const LEVELS = [
    { img: "sleep",     r: 22 },
    { img: "flat",      r: 26 },
    { img: "wide",      r: 30 },
    { img: "sit",       r: 34 },
    { img: "bunny",     r: 38 },
    { img: "lipstick",  r: 42 },
    { img: "seal",      r: 46 },
    { img: "hashbrown", r: 50 },
    { img: "eleme",     r: 54 },
    { img: "green",     r: 58 },
  ];

  const W = 400, H = 600, DANGER_Y = 80, DROP_Y = 40;
  const cv = document.getElementById("game");
  const ctx = cv.getContext("2d");
  const el = (id) => document.getElementById(id);
  const scoreEl = el("scoreVal"), bestEl = el("bestVal"), nextImg = el("nextImg");

  let best = +(localStorage.getItem("merge-best") || 0);
  bestEl.textContent = best;

  const imgs = {};
  LEVELS.forEach((lv, i) => {
    const im = new Image();
    im.src = `assets/${lv.img}_s.jpg`;
    imgs[i] = im;
  });

  let engine, world, bodies = [], score = 0, nextLevel = 0, cooldownUntil = 0, over = false, settleTimers = new Map(), lastTs = 0;

  function init() {
    engine = Engine.create({ gravity: { x: 0, y: 1.2, scale: 0.001 } });
    world = engine.world;
    const wallOpts = { isStatic: true, friction: 0.3, restitution: 0.1 };
    World.add(world, [
      Bodies.rectangle(W / 2, H + 20, W, 40, wallOpts),
      Bodies.rectangle(-20, H / 2, 40, H, wallOpts),
      Bodies.rectangle(W + 20, H / 2, 40, H, wallOpts),
    ]);
    Events.on(engine, "collisionStart", onCollide);
  }

  function randDropLevel() { return Math.floor(Math.random() * 4); }

  function showNext() {
    nextLevel = randDropLevel();
    nextImg.src = `assets/${LEVELS[nextLevel].img}_s.jpg`;
  }

  function drop(x) {
    if (performance.now() < cooldownUntil || over) return;
    const lv = nextLevel;
    const r = LEVELS[lv].r;
    x = Math.max(r + 4, Math.min(W - r - 4, x));
    const body = Bodies.circle(x, DROP_Y, r, {
      restitution: 0.25,
      friction: 0.4,
      density: 0.0015 + lv * 0.0003,
      label: "cat",
    });
    body.catLevel = lv;
    body.catId = Math.random().toString(36).slice(2);
    World.add(world, body);
    bodies.push(body);
    cooldownUntil = performance.now() + 600;
    showNext();
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
        restitution: 0.2,
        friction: 0.4,
        density: 0.0015 + nl * 0.0003,
        label: "cat",
      });
      nb.catLevel = nl;
      nb.catId = Math.random().toString(36).slice(2);
      nb.scaleAnim = 0.3;
      World.remove(world, a);
      World.remove(world, b);
      World.add(world, nb);
      bodies = bodies.filter((x) => x !== a && x !== b);
      bodies.push(nb);
      score += nl * 10;
      scoreEl.textContent = score;
      MemeAudio.match();
    }
  }

  function checkGameOver() {
    for (const b of bodies) {
      if (b.catLevel == null) continue;
      const r = LEVELS[b.catLevel].r;
      if (b.position.y - r < DANGER_Y) {
        if (Math.abs(b.velocity.y) < 0.3 && Math.abs(b.velocity.x) < 0.3) {
          if (!settleTimers.has(b.id)) settleTimers.set(b.id, performance.now());
          else if (performance.now() - settleTimers.get(b.id) > 1200) return true;
        } else settleTimers.delete(b.id);
      } else settleTimers.delete(b.id);
    }
    return false;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1d3a5f");
    sky.addColorStop(1, "#0e1726");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#ff6b6b55";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, DANGER_Y);
    ctx.lineTo(W, DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const b of bodies) {
      if (b.catLevel == null) continue;
      const lv = LEVELS[b.catLevel];
      const im = imgs[b.catLevel];
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      let s = 1;
      if (b.scaleAnim > 0) { s = 1 + b.scaleAnim; b.scaleAnim = Math.max(0, b.scaleAnim - 0.02); }
      ctx.scale(s, s);
      if (im.complete && im.naturalWidth) {
        ctx.beginPath();
        ctx.arc(0, 0, lv.r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(im, -lv.r, -lv.r, lv.r * 2, lv.r * 2);
      } else {
        ctx.fillStyle = "#e8c98a";
        ctx.beginPath(); ctx.arc(0, 0, lv.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = "#00000055";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.position.x, b.position.y, lv.r * s, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function loop(ts) {
    if (!over) {
      const dt = Math.min(50, ts - lastTs);
      lastTs = ts;
      Engine.update(engine, dt);
      if (checkGameOver()) endGame();
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
    scoreEl.textContent = 0;
    el("startOverlay").classList.add("hidden");
    el("endOverlay").classList.add("hidden");
    init();
    showNext();
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
      [60, "勉强维持秩序，罐头还能发。"],
      [150, "合成大师，猫界炼金术士。"],
      [300, "绿光降临，你已经是猫神。"],
    ];
    el("endComment").textContent = c.reduce((a, x) => (score >= x[0] ? x : a), c[0])[1];
    el("endOverlay").classList.remove("hidden");
  }

  cv.addEventListener("pointerdown", (e) => {
    if (over) return;
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    drop(x);
  });

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
