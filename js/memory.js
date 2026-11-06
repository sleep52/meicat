(() => {
  const PAIRS = ["sleep", "lipstick", "seal", "hashbrown", "morning", "bunny", "lashes", "melon", "eleme", "dress"];
  const LABEL = {
    sleep: "被窝猫", lipstick: "红唇猫", seal: "海豹猫", hashbrown: "脆薯饼", morning: "早安猫",
    bunny: "兔耳猫", lashes: "睫毛猫", melon: "哈密瓜", eleme: "外卖猫", dress: "碎花裙",
  };
  const grid = document.getElementById("grid");
  const el = (id) => document.getElementById(id);
  let best = +(localStorage.getItem("memory-best") || 0);
  el("bestVal").textContent = best || "-";

  let first = null, lock = false, moves = 0, found = 0, seconds = 0, timer = null, started = false;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function build() {
    grid.innerHTML = "";
    const deck = shuffle([...PAIRS, ...PAIRS]);
    for (const key of deck) {
      const c = document.createElement("div");
      c.className = "card";
      c.dataset.key = key;
      c.innerHTML = `<div class="inner">
        <div class="face back">🐱</div>
        <div class="face front"><img src="assets/${key}_s.jpg" alt="${LABEL[key]}" draggable="false"></div>
      </div>`;
      grid.appendChild(c);
    }
  }

  function tick() {
    seconds++;
    el("timeVal").textContent = seconds;
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card || lock || card.classList.contains("done") || card.classList.contains("open")) return;
    if (!started) { started = true; timer = setInterval(tick, 1000); }
    card.classList.add("open");
    MemeAudio.flip();

    if (!first) { first = card; return; }
    moves++;
    el("moveVal").textContent = moves;

    if (first.dataset.key === card.dataset.key) {
      const a = first, b = card;
      first = null;
      found++;
      el("pairVal").textContent = `${found}/10`;
      setTimeout(() => {
        a.classList.add("done");
        b.classList.add("done");
        MemeAudio.match();
      }, 260);
      if (found === PAIRS.length) setTimeout(win, 700);
    } else {
      lock = true;
      const a = first;
      card.classList.add("wrong");
      a.classList.add("wrong");
      MemeAudio.miss();
      setTimeout(() => {
        [a, card].forEach((c) => c.classList.remove("open", "wrong"));
        first = null;
        lock = false;
      }, 750);
    }
  });

  function win() {
    clearInterval(timer);
    if (!best || moves < best) { best = moves; localStorage.setItem("memory-best", best); el("bestVal").textContent = best; }
    el("endMoves").textContent = `${moves} 步 · ${seconds}s`;
    const rank = moves <= 14 ? "你就是这只猫失散多年的双胞胎。"
      : moves <= 20 ? "眼疾手快，罐头管理员。"
      : moves <= 30 ? "云吸猫十级学者。"
      : "猫本人来了都得翻半天。";
    el("endComment").textContent = rank;
    el("endOverlay").classList.remove("hidden");
    MemeAudio.win();
  }

  function start() {
    first = null; lock = false; moves = 0; found = 0; seconds = 0; started = false;
    clearInterval(timer);
    el("moveVal").textContent = 0;
    el("timeVal").textContent = 0;
    el("pairVal").textContent = "0/10";
    el("startOverlay").classList.add("hidden");
    el("endOverlay").classList.add("hidden");
    build();
  }

  el("startBtn").addEventListener("click", start);
  el("againBtn").addEventListener("click", start);
  build();
})();
