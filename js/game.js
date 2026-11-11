/* 游戏套件（js/game.js）
 *
 * 六款游戏共用：画布适配（逻辑坐标宽固定 360，高由容器比例算）、rAF 循环、
 * 指针/键盘输入、倒计时、计分 HUD、暂停、结算弹层、最高分入库。
 * 每款游戏只写自己的 update / draw / 玩法说明，不再各抄一遍样板。
 */
window.Game = (() => {
  const W = 360;

  function stage(cv, logicalW) {
    const LW = logicalW || W;
    const st = { LW, LH: 480, dpr: 1, k: 1 };
    st.fit = () => {
      const r = cv.getBoundingClientRect();
      const cssW = Math.max(1, r.width), cssH = Math.max(1, r.height);
      st.dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cssW * st.dpr);
      cv.height = Math.round(cssH * st.dpr);
      st.LH = LW * cssH / cssW;
      st.k = cssW / LW * st.dpr;
      return st;
    };
    st.apply = x => x.setTransform(st.k, 0, 0, st.k, 0, 0);
    st.pt = e => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * LW, (e.clientY - r.top) / r.height * st.LH];
    };
    st.fit();
    return st;
  }

  /* 常见缓动，游戏和弹层都用得上 */
  const ease = {
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t,
    inout: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  };

  function run(cfg) {
    const cv = cfg.canvas;
    const st = stage(cv, cfg.logicalW);
    const x = cv.getContext("2d");
    const dur = cfg.dur || 0;          // 0 = 不限时
    const el = {
      score: cfg.scoreEl || document.getElementById("gScore"),
      timer: cfg.timerEl || document.getElementById("gTimer"),
      best: cfg.bestEl || document.getElementById("gBest"),
      cover: cfg.coverEl || document.getElementById("gCover"),
      btn: cfg.btnEl || document.getElementById("gBtn")
    };
    if (el.best) el.best.textContent = CAT.best(cfg.id);

    const inp = { x: 0, y: 0, down: false, just: false, up: false, held: 0 };
    const g = {
      state: "ready",       // ready | play | pause | over
      t: 0,                 // 本局已玩秒数
      left: dur,
      score: 0, combo: 0, lives: cfg.lives || 0,
      st, x, inp,
      add(n) { g.score += n; paint(); },
      hit(n) { g.combo++; g.add((n || 1) * (1 + Math.min(g.combo, 9) * 0.1) | 0); CAT.sfx.combo(g.combo); },
      miss() { g.combo = 0; if (cfg.lives) { g.lives--; paintLives(); if (g.lives <= 0) g.over("lives"); } },
      start, over, pause, resume
    };
    g.s = st;

    function paint() { if (el.score) el.score.textContent = g.score; }
    function paintTime() {
      if (!el.timer) return;
      el.timer.textContent = dur ? Math.max(0, Math.ceil(g.left)) : Math.floor(g.t);
      el.timer.classList.toggle("warn", !!dur && g.left <= 10);
    }
    function paintLives() {
      const box = document.getElementById("gLives");
      if (!box || !cfg.lives) return;
      box.innerHTML = "❤".repeat(g.lives) + "♡".repeat(Math.max(0, cfg.lives - g.lives));
    }

    /* ---------- 输入 ---------- */
    function on(e) {
      const p = st.pt(e);
      inp.x = p[0]; inp.y = p[1];
      inp.down = true; inp.just = true; inp.held = 0;
      if (cv.setPointerCapture) { try { cv.setPointerCapture(e.pointerId); } catch (err) {} }
      if (cfg.tap && g.state === "play") cfg.tap(g, p[0], p[1]);
      CAT.buzz(8);
    }
    function mv(e) { const p = st.pt(e); inp.x = p[0]; inp.y = p[1]; }
    function off(e) { const p = st.pt(e); inp.x = p[0]; inp.y = p[1]; inp.down = false; inp.up = true; }
    cv.addEventListener("pointerdown", on);
    cv.addEventListener("pointermove", mv);
    cv.addEventListener("pointerup", off);
    cv.addEventListener("pointercancel", off);
    cv.addEventListener("contextmenu", e => e.preventDefault());
    /* 桌面键盘：空格等于按住，回车等于开始 */
    document.addEventListener("keydown", e => {
      if (e.repeat) return;
      if (e.code === "Space") { e.preventDefault(); inp.down = true; inp.just = true; if (g.state !== "play") start(); }
      if (e.key === "Enter" && g.state !== "play") start();
      if (e.key === "p" || e.key === "P") toggle();
    });
    document.addEventListener("keyup", e => { if (e.code === "Space") { inp.down = false; inp.up = true; } });

    /* ---------- 状态 ---------- */
    function cover(html) {
      if (!el.cover) return;
      el.cover.classList.toggle("hide", !html);
      if (html) el.cover.innerHTML = html;
    }
    function start() {
      g.state = "play"; g.t = 0; g.left = dur; g.score = 0; g.combo = 0; g.lives = cfg.lives || 0;
      tickAt = 99;
      paint(); paintTime(); paintLives(); cover(null);
      if (cfg.reset) cfg.reset(g);
      CAT.sfx.tap();
      if (el.btn) el.btn.textContent = cfg.playingBtn || "暂停";
    }
    function toggle() {
      if (g.state === "play") pause();
      else if (g.state === "pause") resume();
    }
    function pause() {
      if (g.state !== "play") return;
      g.state = "pause";
      cover(`<h3>暂停</h3><p>分 ${g.score}${dur ? " · 还剩 " + Math.ceil(g.left) + " 秒" : ""}</p>
        <button class="btn gold block" data-go>继续</button><button class="btn line block" data-quit>退出</button>`);
      const go = el.cover.querySelector("[data-go]"), q = el.cover.querySelector("[data-quit]");
      if (go) go.onclick = resume;
      if (q) q.onclick = () => { location.href = CAT.base + "games.html"; };
      if (el.btn) el.btn.textContent = "继续";
    }
    function resume() {
      g.state = "play"; cover(null);
      if (el.btn) el.btn.textContent = cfg.playingBtn || "暂停";
    }
    function over(why) {
      if (g.state === "over") return;
      g.state = "over";
      const r = CAT.record(cfg.id, g.score);
      const rank = cfg.rank ? cfg.rank(g.score) : { label: "S", note: "" };
      if (g.score > 0) CAT.patchStat({ points: g.score });
      (g.score > 0 ? CAT.sfx.win : CAT.sfx.lose)();
      if (el.best) el.best.textContent = r.best;
      if (el.btn) el.btn.textContent = "再来一局";
      cover(`<div class="ov">
        <div class="ov-rank ${rank.cls || ""}">${rank.label}</div>
        <div><b>${g.score}</b><span>分</span></div></div>
        <p>${rank.note || ""}${why === "lives" ? " 三条命用完了。" : ""}</p>
        <p class="mut small">${r.isNew ? "新纪录！" : "最高 " + r.best + " 分 · 玩过 " + r.plays + " 次"}</p>
        <button class="btn gold block" data-again>再来一局</button>
        <div class="row2">
          <button class="btn line" data-share>分享成绩</button>
          <a class="btn line" href="${CAT.base}games.html">换个游戏</a>
        </div></div>`);
      el.cover.querySelector("[data-again]").onclick = start;
      el.cover.querySelector("[data-share]").onclick = () => share(r, rank);
      if (cfg.over) cfg.over(g, r);
    }

    /* 结算分享卡：真猫 + 分数 + 评级，导出 PNG */
    function share(r, rank) {
      const c = document.createElement("canvas");
      c.width = 600; c.height = 760;
      const cx = c.getContext("2d");
      cx.fillStyle = "#FBF6EC"; cx.fillRect(0, 0, 600, 760);
      cx.strokeStyle = "#241F19"; cx.lineWidth = 8;
      CAT.round(cx, 20, 20, 560, 720, 26); cx.stroke();
      cx.fillStyle = "#241F19"; cx.font = CAT.FONT("900", 34); cx.textAlign = "center";
      cx.fillText(cfg.name, 300, 96);
      cx.fillStyle = "#8A8172"; cx.font = CAT.FONT("700", 18);
      cx.fillText(cfg.sub || "", 300, 130);
      CAT.round(cx, 150, 170, 300, 300, 20); cx.fillStyle = "#F3E9D6"; cx.fill(); cx.stroke();
      Cat.box(150, 140, 300).draw(cx, Cat.pose());
      cx.fillStyle = "#241F19"; cx.font = CAT.FONT("900", 92);
      cx.fillText(String(g.score), 300, 550);
      cx.font = CAT.FONT("700", 20); cx.fillStyle = "#8A8172";
      cx.fillText("分 · 最高 " + r.best, 300, 592);
      cx.fillStyle = "#F5C445";
      CAT.round(cx, 230, 630, 140, 56, 28); cx.fill();
      cx.strokeStyle = "#241F19"; cx.lineWidth = 4; cx.stroke();
      cx.fillStyle = "#241F19"; cx.font = CAT.FONT("900", 30);
      cx.fillText(rank.label, 300, 660);
      cx.fillStyle = "#B0A795"; cx.font = CAT.FONT("700", 15);
      cx.fillText("我家猫 · 真猫互动站", 300, 726);
      CAT.download(c, cfg.id + "-" + g.score + ".png");
    }

    if (el.btn) el.btn.onclick = () => {
      if (g.state === "ready" || g.state === "over") start();
      else toggle();
    };
    document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
    window.addEventListener("resize", () => { st.fit(); if (cfg.resize) cfg.resize(g); });

    /* ---------- 主循环 ---------- */
    let last = 0, raf = 0, tickAt = 99;
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (!last) last = ts;
      let dt = (ts - last) / 1000;
      last = ts;
      if (dt > 1 / 20) dt = 1 / 20;              // 切后台回来不许一次跳一大步
      if (g.state === "play") {
        g.t += dt;
        if (dur) {
          g.left -= dt;
          const whole = Math.ceil(g.left);
          if (whole !== tickAt && whole <= 5 && whole > 0) { tickAt = whole; CAT.sfx.tick(); }
          paintTime();
          if (g.left <= 0) { over("time"); }
        }
        if (inp.down) inp.held += dt;
        if (cfg.update) cfg.update(g, dt);
      }
      st.apply(x);
      x.clearRect(0, 0, st.LW, st.LH);
      if (cfg.draw) cfg.draw(g, x, dt);
      inp.just = false; inp.up = false;
    }
    raf = requestAnimationFrame(frame);

    /* 首屏说明 */
    cover(`<h3>${cfg.name}</h3><p class="how">${cfg.how || ""}</p>
      ${dur ? `<p class="mut small">一局 ${dur} 秒</p>` : ""}
      <button class="btn gold block" data-go>开始</button>`);
    if (el.cover) el.cover.querySelector("[data-go]").onclick = start;
    paintLives();

    return g;
  }

  /* ---------- 画东西的小工具（六款游戏都用这几样） ---------- */
  function label(x, text, cx, cy, size, color, weight) {
    x.fillStyle = color || "#241F19";
    CAT.fitText(x, text, cx, cy, 320, weight || "900", size || 22);
  }
  /* 描边大字：任何背景上都读得清 */
  function pop(x, text, cx, cy, size, fill, stroke) {
    x.font = CAT.FONT("900", size);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.lineWidth = Math.max(3, size * 0.16);
    x.strokeStyle = stroke || "#241F19";
    x.strokeText(text, cx, cy);
    x.fillStyle = fill || "#F5C445";
    x.fillText(text, cx, cy);
  }
  function floor(x, y, w, color) {
    x.fillStyle = color || "#E7D9BE";
    x.fillRect(0, y, w, 999);
    x.strokeStyle = "rgba(36,31,25,.22)"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke();
  }
  /* 真道具照片钉在舞台上；素材读不到就画明确的占位块，绝不留空 */
  function prop(x, img, cx, cy, w, ang) {
    if (!img) {
      const h = w * 0.7;
      x.save(); x.translate(cx, cy); if (ang) x.rotate(ang);
      x.fillStyle = "#F0E7D6"; x.strokeStyle = "#D8C9AE"; x.lineWidth = 3;
      x.setLineDash([9, 7]);
      CAT.round(x, -w / 2, -h / 2, w, h, 10); x.fill(); x.stroke();
      x.setLineDash([]);
      x.fillStyle = "#A9987A"; x.font = CAT.FONT("700", 12);
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("素材缺失", 0, 0);
      x.restore(); return;
    }
    const h = (img.naturalHeight || img.height) * w / (img.naturalWidth || img.width);
    x.save(); x.translate(cx, cy); if (ang) x.rotate(ang);
    x.drawImage(img, -w / 2, -h / 2, w, h);
    x.restore();
  }
  /* 飘字：得分、连击、吐槽 */
  function floats() {
    const a = [];
    return {
      add(text, cx, cy, color) { a.push({ text, x: cx, y: cy, t: 0, c: color || "#241F19" }); },
      step(dt) { for (let i = a.length - 1; i >= 0; i--) { a[i].t += dt; a[i].y -= 46 * dt; if (a[i].t > 0.9) a.splice(i, 1); } },
      clear() { a.length = 0; },
      draw(x) {
        for (const f of a) {
          x.save(); x.globalAlpha = 1 - f.t / 0.9;
          label(x, f.text, f.x, f.y, 20, f.c);
          x.restore();
        }
      }
    };
  }

  return { W, stage, run, ease, label, pop, floor, prop, floats };
})();
