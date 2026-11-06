(() => {
  const COSTUMES = [
    { img: "worker",   label: "工牌猫",   score: 10, w: 26 },
    { img: "flat",     label: "无语猫",   score: 10, w: 22 },
    { img: "wide",     label: "瞪眼猫",   score: 10, w: 22 },
    { img: "sit",      label: "蹲坐猫",   score: 15, w: 14 },
    { img: "bunny",    label: "兔耳猫",   score: 20, w: 10 },
    { img: "lipstick", label: "红唇猫",   score: 25, w: 8  },
    { img: "seal",     label: "海豹猫",   score: 30, w: 6  },
    { img: "hashbrown",label: "脆薯饼猫", score: 30, w: 6  },
    { img: "eleme",    label: "外卖猫",   score: 15, w: 5, fever: true },
    { img: "green",    label: "绿光猫",   score: 50, w: 2  },
  ];
  const TOTAL_W = COSTUMES.reduce((s, c) => s + c.w, 0);

  const board = document.getElementById("board");
  const el = (id) => document.getElementById(id);
  const holes = [];
  for (let i = 0; i < 9; i++) {
    const h = document.createElement("div");
    h.className = "hole";
    h.innerHTML = `<div class="mole"><img alt=""><div class="mole-name"></div></div>`;
    h.dataset.idx = i;
    board.appendChild(h);
    holes.push({ el: h, img: h.querySelector("img"), name: h.querySelector(".mole-name"), costume: null, timer: null });
  }

  let running = false, score = 0, combo = 0, timeLeft = 30, feverUntil = 0;
  let spawnTimer = null, tickTimer = null, rafId = null;
  let best = +(localStorage.getItem("whack-best") || 0);
  el("bestVal").textContent = best;

  function pickCostume() {
    let r = Math.random() * TOTAL_W;
    for (const c of COSTUMES) { r -= c.w; if (r <= 0) return c; }
    return COSTUMES[0];
  }

  function inFever() { return performance.now() < feverUntil; }

  function pop(hole) {
    if (!running || hole.costume) return;
    const c = pickCostume();
    hole.costume = c;
    hole.img.src = `assets/${c.img}_s.jpg`;
    hole.name.textContent = c.label;
    hole.el.classList.add("up");
    const life = inFever() ? 550 : 700 + Math.random() * 900 - (30 - timeLeft) * 12;
    hole.timer = setTimeout(() => retract(hole, false), Math.max(420, life));
  }

  function retract(hole, wasHit) {
    clearTimeout(hole.timer);
    hole.el.classList.remove("up");
    if (wasHit) hole.el.classList.add("hit");
    setTimeout(() => { hole.el.classList.remove("hit"); hole.costume = null; }, 240);
  }

  function floatScore(text, x, y, color) {
    const f = document.createElement("div");
    f.className = "float-score";
    f.textContent = text;
    f.style.left = x + "px";
    f.style.top = y + "px";
    if (color) f.style.color = color;
    board.parentElement.appendChild(f);
    setTimeout(() => f.remove(), 800);
  }

  board.addEventListener("pointerdown", (ev) => {
    if (!running) return;
    const holeEl = ev.target.closest(".hole");
    if (!holeEl) return;
    const hole = holes[+holeEl.dataset.idx];
    const rect = board.getBoundingClientRect();
    const x = ev.clientX - rect.left - 10, y = ev.clientY - rect.top - 10;
    if (!hole.costume) { combo = 0; updateHud(); MemeAudio.miss(); return; }
    const c = hole.costume;
    combo++;
    const mult = inFever() ? 2 : Math.min(3, 1 + Math.floor(combo / 5));
    const gained = c.score * mult;
    score += gained;
    floatScore(`+${gained}`, x, y, c.fever ? "#4dc3ff" : null);
    if (c.fever) {
      feverUntil = performance.now() + 5000;
      board.classList.add("fever");
      MemeAudio.fever();
    } else MemeAudio.hit(combo);
    retract(hole, true);
    updateHud();
  });

  function updateHud() {
    el("scoreVal").textContent = score;
    el("comboVal").textContent = combo;
    el("timeVal").textContent = Math.ceil(timeLeft);
  }

  function spawnLoop() {
    if (!running) return;
    const free = holes.filter((h) => !h.costume);
    const busyCount = holes.length - free.length;
    const maxUp = inFever() ? 5 : Math.min(4, 2 + Math.floor((30 - timeLeft) / 9));
    if (free.length && busyCount < maxUp) {
      pop(free[Math.floor(Math.random() * free.length)]);
      if (inFever() && free.length > 1) pop(free[Math.floor(Math.random() * free.length)]);
    }
    spawnTimer = setTimeout(spawnLoop, inFever() ? 220 : Math.max(280, 620 - (30 - timeLeft) * 10));
  }

  function loop(ts) {
    if (!running) return;
    const fill = Math.max(0, (feverUntil - ts)) / 5000;
    el("feverFill").style.width = (fill * 100) + "%";
    if (fill <= 0) board.classList.remove("fever");
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    score = 0; combo = 0; timeLeft = 30; feverUntil = 0;
    running = true;
    el("startOverlay").classList.add("hidden");
    el("endOverlay").classList.add("hidden");
    updateHud();
    spawnLoop();
    tickTimer = setInterval(() => {
      timeLeft -= 0.1;
      updateHud();
      if (timeLeft <= 0) end();
    }, 100);
    rafId = requestAnimationFrame(loop);
  }

  function end() {
    running = false;
    clearTimeout(spawnTimer);
    clearInterval(tickTimer);
    cancelAnimationFrame(rafId);
    holes.forEach((h) => { clearTimeout(h.timer); h.el.classList.remove("up", "hit"); h.costume = null; });
    board.classList.remove("fever");
    if (score > best) { best = score; localStorage.setItem("whack-best", best); el("bestVal").textContent = best; }
    el("endScore").textContent = score;
    const comments = [
      [0, "被老板开除了，明天重新面试。"],
      [80, "实习期表现尚可，继续摸……继续加油。"],
      [160, "转正了！猫咪工牌已升级。"],
      [260, "年度优秀员工，奖金是两个罐头。"],
      [400, "你已经是猫了，不需要上班了。"],
    ];
    el("endComment").textContent = comments.reduce((a, c) => (score >= c[0] ? c : a), comments[0])[1];
    el("endTitle").textContent = score > 0 && score === best ? "🎉 新纪录！" : "下班了！";
    el("endOverlay").classList.remove("hidden");
  }

  el("startBtn").addEventListener("click", start);
  el("againBtn").addEventListener("click", start);

  if (new URLSearchParams(location.search).has("test")) {
    window.__whack = {
      start,
      hitAll() {
        document.querySelectorAll(".hole.up").forEach((h) => {
          const r = h.getBoundingClientRect();
          h.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: r.x + 5, clientY: r.y + 5 }));
        });
      },
      end,
      get state() { return { running, score, combo, fever: inFever() }; },
    };
  }
})();
