(() => {
  const cv = document.getElementById("game");
  const ctx = cv.getContext("2d");
  const W = 400, H = 600, GROUND = 552;

  const el = (id) => document.getElementById(id);
  const scoreEl = el("scoreVal"), bestEl = el("bestVal");
  let best = +(localStorage.getItem("flappy-best") || 0);
  bestEl.textContent = best;

  const imgs = {};
  ["hashbrown", "pepper", "melon", "seal", "wide"].forEach((n) => {
    const i = new Image();
    i.src = `assets/${n}_s.jpg`;
    imgs[n] = i;
  });

  const G = 1100, FLAP = -380;
  let state = "ready"; // ready | play | over
  let y, vy, rot, obstacles, deco, score, speed, t, lastTs, shake;

  function reset() {
    y = 280; vy = 0; rot = 0; score = 0; t = 0; speed = 130; shake = 0;
    obstacles = [];
    deco = [
      { x: 500, y: 120, img: "seal", s: 70, v: 0.25 },
      { x: 760, y: 420, img: "wide", s: 55, v: 0.2 },
    ];
    scoreEl.textContent = 0;
  }

  function gapSize() { return Math.max(118, 168 - score * 1.6); }
  function spawnX() { return W + 60; }

  function addObstacle() {
    const g = gapSize();
    const center = 110 + Math.random() * (GROUND - 160 - g / 2 - 110) + g / 2 * 0;
    const top = Math.max(60, Math.min(GROUND - g - 60, center - g / 2));
    obstacles.push({ x: spawnX(), top, gap: g, img: Math.random() < 0.5 ? "pepper" : "melon", passed: false });
  }

  function flap() {
    if (state === "play") { vy = FLAP; MemeAudio.flap(); }
  }

  function startGame() {
    reset();
    state = "play";
    el("startOverlay").classList.add("hidden");
    el("endOverlay").classList.add("hidden");
    addObstacle();
    lastTs = performance.now();
    requestAnimationFrame(frame);
  }

  function endGame() {
    state = "over";
    MemeAudio.crash();
    shake = 12;
    if (score > best) { best = score; localStorage.setItem("flappy-best", best); bestEl.textContent = best; }
    el("endScore").textContent = score;
    el("endTitle").textContent = score === best && score > 0 ? "🏝️ 新纪录！" : "翻船了！";
    const c = [
      [0, "脆薯饼还没出袋就掉海里了。"],
      [3, "近海练习生，猫扒礁石看你表演。"],
      [8, "游到了公海，开始理解鱼生。"],
      [15, "传说级漂洋猫，海豹都来合影。"],
      [25, "你已经不是猫了，你是一片海。"],
    ];
    el("endComment").textContent = c.reduce((a, x) => (score >= x[0] ? x : a), c[0])[1];
    setTimeout(() => el("endOverlay").classList.remove("hidden"), 420);
  }

  function update(dt) {
    t += dt;
    vy += G * dt;
    y += vy * dt;
    rot = Math.max(-0.5, Math.min(1.2, vy / 500));
    speed = 130 + Math.min(90, score * 5);

    if (y - 30 < 0) { y = 30; vy = 60; }
    if (y + 30 >= GROUND) { y = GROUND - 30; endGame(); return; }

    const last = obstacles[obstacles.length - 1];
    if (!last || last.x < W - 230) addObstacle();

    for (const o of obstacles) {
      o.x -= speed * dt;
      if (!o.passed && o.x + 34 < 90) {
        o.passed = true;
        score++;
        scoreEl.textContent = score;
        MemeAudio.point();
      }
      const px = 90, py = y, r = 27;
      const inX = px + r > o.x && px - r < o.x + 68;
      if (inX && (py - r < o.top || py + r > o.top + o.gap)) { endGame(); return; }
    }
    obstacles = obstacles.filter((o) => o.x > -90);

    for (const d of deco) {
      d.x -= speed * d.v * dt;
      if (d.x < -90) { d.x = W + 60 + Math.random() * 200; d.y = 60 + Math.random() * 380; }
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1d3a5f");
    sky.addColorStop(0.55, "#2f6a8f");
    sky.addColorStop(1, "#123048");
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // distant rock
    ctx.fillStyle = "#0c1620";
    ctx.beginPath();
    const rx = 320 - ((t * 12) % 500);
    ctx.moveTo(rx - 90, GROUND);
    ctx.quadraticCurveTo(rx - 60, 200, rx, 170);
    ctx.quadraticCurveTo(rx + 70, 210, rx + 110, GROUND);
    ctx.closePath();
    ctx.fill();

    // decorative floating cousins
    for (const d of deco) {
      const im = imgs[d.img];
      if (im.complete && im.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.translate(d.x, d.y + Math.sin(t * 2 + d.x) * 6);
        ctx.drawImage(im, -d.s / 2, -d.s / 2, d.s, d.s);
        ctx.restore();
      }
    }

    // sea
    ctx.fillStyle = "#1b4965";
    ctx.fillRect(-20, GROUND, W + 40, H - GROUND + 20);
    ctx.strokeStyle = "#ffffff33";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 8) {
      const yy = GROUND + Math.sin((x + t * 90) / 26) * 3;
      x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();

    // obstacles: pepper/melon columns
    for (const o of obstacles) {
      drawColumn(o, true);
      drawColumn(o, false);
    }

    // player: hash brown cat
    const im = imgs.hashbrown;
    ctx.save();
    ctx.translate(90, y);
    ctx.rotate(rot);
    if (im.complete && im.naturalWidth) {
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(im, -32, -32, 64, 64);
    } else {
      ctx.fillStyle = "#e8c98a";
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "#00000055";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(90, y, 32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawColumn(o, isTop) {
    const w = 68, x = o.x;
    const y0 = isTop ? -40 : o.top + o.gap;
    const y1 = isTop ? o.top : GROUND + 40;
    const h = y1 - y0;
    if (h <= 0) return;
    const im = imgs[o.img];
    ctx.save();
    ctx.fillStyle = isTop ? "#274b63" : "#274b63";
    roundRect(x - 6, y0, w + 12, h, 10);
    ctx.fill();
    if (im.complete && im.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      roundRect(x - 6, y0, w + 12, h, 10);
      ctx.clip();
      const tile = 84;
      for (let ty = y0; ty < y1; ty += tile) ctx.drawImage(im, x - 8, ty, tile, tile);
      ctx.restore();
      ctx.fillStyle = "#0e1726aa";
      ctx.fillRect(x - 6, isTop ? y1 - 14 : y0, w + 12, 14);
    }
    ctx.strokeStyle = "#0b1420";
    ctx.lineWidth = 3;
    ctx.beginPath();
    roundRect(x - 6, y0, w + 12, h, 10);
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function frame(ts) {
    if (state !== "play") { draw(); return; }
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    update(dt);
    draw();
    if (state === "play") nextFrame();
  }

  // rAF pauses in hidden tabs; fall back to a timer so gameplay stays sane.
  let rafWatch = 0, rafHappened = false;
  function nextFrame() {
    rafHappened = false;
    clearTimeout(rafWatch);
    rafWatch = setTimeout(() => { if (!rafHappened) frame(performance.now()); }, 60);
    requestAnimationFrame((t) => { rafHappened = true; frame(t); });
  }

  cv.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (state === "play") flap();
    else if (state === "over") startGame();
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (state === "play") flap();
      else startGame();
    }
  });

  el("startBtn").addEventListener("click", startGame);
  el("againBtn").addEventListener("click", startGame);

  reset();
  draw();

  if (new URLSearchParams(location.search).has("test")) {
    window.__flappy = {
      start: startGame,
      step(dt) {
        if (state === "play") { update(dt); draw(); }
        const next = obstacles.find((o) => o.x + 68 > 63);
        return {
          score, state, y,
          gapCenter: next ? next.top + next.gap / 2 : null,
          playerX: 90, obsX: next ? next.x : null,
        };
      },
      flap,
    };
  }
})();
