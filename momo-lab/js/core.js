window.ML = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rand = (a, b) => a + Math.random() * (b - a);
  const irand = (a, b) => Math.floor(rand(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const script = $('script[src*="js/core.js"]');
  const base = script ? script.src.slice(0, script.src.length - "js/core.js".length) : "";
  const asset = p => base + p;

  const settings = Object.assign({ sound: true, anim: true }, JSON.parse(localStorage.getItem("ml-settings") || "{}"));
  const saveSettings = () => { localStorage.setItem("ml-settings", JSON.stringify(settings)); document.documentElement.classList.toggle("no-anim", !settings.anim); };
  saveSettings();

  let ac = null;
  function tone(freq, dur = .1, type = "square", gain = .05, slide = null) {
    if (!settings.sound) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, ac.currentTime + dur);
      g.gain.setValueAtTime(gain, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + dur);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
    } catch (e) {}
  }
  const sound = {
    tap: () => tone(520, .06, "sine", .05),
    good: () => tone(660, .12, "triangle", .07, 990),
    bad: () => tone(150, .18, "sawtooth", .06, 90),
    combo: n => tone(300 + Math.min(n, 12) * 45, .1, "square", .05),
    bonus: () => { tone(500, .3, "triangle", .08, 1200); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .2, "triangle", .08), i * 120)),
    lose: () => [300, 240, 180].forEach((f, i) => setTimeout(() => tone(f, .22, "sawtooth", .06), i * 140)),
    tick: () => tone(880, .04, "sine", .03),
  };

  // 角色层钩子：3D 宠物订阅这 8 个音效点，游戏页因此不需要改动。
  const soundHooks = [];
  Object.keys(sound).forEach(k => {
    const raw = sound[k];
    sound[k] = (...a) => {
      const out = raw(...a);
      soundHooks.forEach(f => { try { f(k, a[0]); } catch (e) {} });
      return out;
    };
  });
  function onSound(fn) {
    soundHooks.push(fn);
    return () => { const i = soundHooks.indexOf(fn); if (i >= 0) soundHooks.splice(i, 1); };
  }

  const records = JSON.parse(localStorage.getItem("ml-records") || "{}");
  function record(game, score) {
    const r = records[game] || { best: 0, plays: 0 };
    r.plays++; const isNew = score > r.best; if (isNew) r.best = score;
    records[game] = r; localStorage.setItem("ml-records", JSON.stringify(records));
    return { best: r.best, isNew, plays: r.plays };
  }
  const best = game => (records[game] || {}).best || 0;

  function machine() {
    let s = "READY"; const ls = [];
    return { get: () => s, set: v => { s = v; ls.forEach(f => f(v)); }, on: f => ls.push(f) };
  }
  function bindPause(mac, toggle) {
    document.addEventListener("visibilitychange", () => { if (document.hidden && mac.get() === "PLAYING") toggle(true); });
    document.addEventListener("keydown", e => { if (e.key === "p" || e.key === "P" || e.key === "Escape") { if (mac.get() === "PLAYING" || mac.get() === "PAUSED") toggle(); } });
  }

  const img = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  function cut(imgEl) {
    const N = 480, c = document.createElement("canvas"); c.width = c.height = N;
    const x = c.getContext("2d"); x.drawImage(imgEl, 0, 0, N, N);
    const d = x.getImageData(0, 0, N, N), p = d.data;
    const bg = new Uint8Array(N * N), q = [];
    const isBg = i => { const r = p[i], g = p[i + 1], b = p[i + 2], mn = Math.min(r, g, b), mx = Math.max(r, g, b), y = (i / 4 / N) | 0; return (mn > 175 && mx - mn < 14) || (y > N * .86 && mn > 140 && mx - mn < 14); };
    for (let i = 0; i < N * N; i++) if (isBg(i * 4)) { bg[i] = 1; q.push(i); }
    while (q.length) {
      const i = q.pop(), xx = i % N, yy = (i / N) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = xx + dx, ny = yy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        const j = ny * N + nx; if (!bg[j] && isBg(j * 4)) { bg[j] = 1; q.push(j); }
      });
    }
    for (let i = 0; i < N * N; i++) {
      if (bg[i]) p[i * 4 + 3] = 0;
      else { const mn = Math.min(p[i * 4], p[i * 4 + 1], p[i * 4 + 2]); if (mn > 190) p[i * 4 + 3] = 120; }
    }
    x.putImageData(d, 0, 0); return c;
  }

  const PETS = {
    pet001: {
      petId: "pet001", petName: "MOMO", petType: "cat",
      petAvatar: "assets/pets/pet001/avatar.png",
      petExpressions: { happy: "assets/pets/pet001/happy.png", angry: "assets/pets/pet001/angry.png", surprised: "assets/pets/pet001/surprised.png", innocent: "assets/pets/pet001/innocent.png", sleep: "assets/pets/pet001/sleep.png", deadpan: "assets/pets/pet001/deadpan.png", mischief: "assets/pets/pet001/mischief.png" },
      petBackground: "assets/backgrounds/snack-room.png",
      furColor: "#E8A857",
      shapeParams: { headWidth: 1.05, bodyFat: 1.12, earSpread: 1 },
      petDescription: "职业拆家，业余装睡。家庭一级拆迁户。",
      gameSettings: { escape: true, chaos: true, memeMaker: true, boss: true, snackPanic: true },
      customText: ["MOMO：我真的会谢。", "本喵的饭呢？"]
    },
    pet002: {
      petId: "pet002", petName: "眉姐姐", petType: "cat",
      petAvatar: "assets/pets/pet002/avatar.jpg",
      petExpressions: { happy: "assets/pets/pet002/happy.jpg", angry: "assets/pets/pet002/angry.jpg", surprised: "assets/pets/pet002/surprised.jpg", innocent: "assets/pets/pet002/innocent.jpg" },
      petBackground: "assets/backgrounds/snack-room.png",
      furColor: "#D8B26A",
      shapeParams: { headWidth: 1.14, bodyFat: 1.25, earSpread: .9 },
      petDescription: "金渐层·表情管理大师·零食黑洞。",
      gameSettings: { escape: true, chaos: true, memeMaker: true, boss: true, snackPanic: true },
      customText: ["眉姐姐：你最好有事。", "人类，你解释一下。"]
    }
  };
  const petId = () => new URLSearchParams(location.search).get("pet") || (document.body.dataset.pet || "pet001");
  async function pet() {
    const id = petId();
    let j = PETS[id] || PETS.pet001;
    if (location.protocol.startsWith("http")) {
      try { const r = await fetch(base + "data/pets/" + id + ".json"); if (r.ok) j = await r.json(); } catch (e) {}
    }
    const out = Object.assign({}, j);
    out.petAvatar = asset(j.petAvatar);
    out.petBackground = asset(j.petBackground);
    if (j.modelUrl) out.modelUrl = asset(j.modelUrl);
    out.petExpressions = {}; for (const k in j.petExpressions) out.petExpressions[k] = asset(j.petExpressions[k]);
    return out;
  }

  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  async function shareCard(o) {
    const c = document.createElement("canvas"); c.width = 600; c.height = 760;
    const x = c.getContext("2d");
    let petImg = null;
    if (o.expr) { try { petImg = await img(o.expr); } catch (e) {} }
    const draw = withImg => {
      const F = (w, s) => `${w} ${s}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",Arial,sans-serif`;
      x.fillStyle = "#FAF8F3"; x.fillRect(0, 0, 600, 760);
      x.fillStyle = "#fff"; rr(x, 24, 24, 552, 712, 20); x.fill();
      x.lineWidth = 6; x.strokeStyle = "#222"; rr(x, 24, 24, 552, 712, 20); x.stroke();
      x.fillStyle = "#222"; x.font = F("900", 28); x.textAlign = "left"; x.fillText("MOMO 事务所", 52, 84);
      x.fillStyle = "#88847D"; x.font = F("700", 16); x.textAlign = "right"; x.fillText(o.game || "", 548, 82);
      x.fillStyle = "#F5E66B"; x.fillRect(52, 102, 496, 10); x.strokeStyle = "#222"; x.lineWidth = 2; x.strokeRect(52, 102, 496, 10);
      if (withImg && petImg) {
        const sh = petImg.height * .92;
        x.drawImage(petImg, 0, 0, petImg.width, sh, 170, 130, 260, 260);
      } else {
        x.fillStyle = "#DCD2F5"; rr(x, 190, 140, 220, 220, 20); x.fill(); x.stroke();
        x.fillStyle = "#222"; x.font = F("900", 90); x.textAlign = "center"; x.fillText("喵", 300, 278);
      }
      x.save(); x.translate(472, 176); x.rotate(-.12);
      x.fillStyle = o.ratingColor || "#F5E66B"; rr(x, -46, -46, 92, 92, 14); x.fill(); x.lineWidth = 4; x.strokeStyle = "#222"; x.stroke();
      x.fillStyle = o.ratingColor === "#F16D5B" ? "#fff" : "#222"; x.font = F("900", 48); x.textAlign = "center"; x.fillText(o.rating || "S", 0, 17); x.restore();
      x.textAlign = "center"; x.fillStyle = "#222"; x.font = F("900", 36); x.fillText(o.petName || "MOMO", 300, 448);
      x.font = F("700", 22); x.fillText(o.ending || "", 300, 488);
      x.fillStyle = "#88847D"; x.font = F("700", 20);
      x.fillText(`得分 ${o.score ?? 0}  ·  ${o.timeText || ""}`, 300, 530);
      x.fillStyle = "#F5E66B"; rr(x, 130, 560, 340, 44, 22); x.fill(); x.lineWidth = 3; x.strokeStyle = "#222"; x.stroke();
      x.fillStyle = "#222"; x.font = F("700", 17); x.fillText(o.badge || "互动游戏场", 300, 588);
      x.fillStyle = "#88847D"; x.font = F("700", 15); x.fillText("为它做一个小世界", 300, 700);
    };
    draw(true);
    try { return c.toDataURL("image/png"); } catch (e) { draw(false); return c.toDataURL("image/png"); }
  }

  function floatSticker(host, text, px, py) {
    const s = document.createElement("span"); s.className = "sticker-float"; s.textContent = text;
    s.style.left = px + "px"; s.style.top = py + "px"; host.appendChild(s);
    setTimeout(() => s.remove(), 800);
  }

  function chrome() {
    const b = document.body.dataset.base || "./";
    const page = document.body.dataset.page || "";
    const nav = document.createElement("header"); nav.className = "ml-nav";
    nav.innerHTML = `<div class="wrap bar">
      <a class="logo" href="${b}index.html"><span class="mark">${ML_ICONS.asterisk}</span>MOMO 事务所</a>
      <nav class="nav-links">
        <a href="${b}index.html" data-n="home">首页</a><a href="${b}play.html" data-n="play">游戏</a>
        <a href="${b}custom.html" data-n="custom">定制</a><a href="${b}service.html" data-n="service">服务</a>
        <a class="drawer-cta" href="${b}service.html#contact">开始一个项目</a>
      </nav>
      <div class="nav-right">
        <button class="icon-btn" id="mlSetBtn" aria-label="设置">${ML_ICONS.gear}</button>
        <button class="icon-btn nav-toggle" id="mlMenuBtn" aria-label="菜单">${ML_ICONS.menu}</button>
        <a class="btn yel small nav-cta" href="${b}service.html#contact">开始项目</a>
      </div></div>
      <div class="nav-pop" id="mlPop">
        <label><input type="checkbox" id="mlSound"> 音效</label>
        <label><input type="checkbox" id="mlAnim"> 动画</label>
      </div>`;
    document.body.prepend(nav);
    nav.querySelector(`[data-n="${page}"]`)?.classList.add("active");
    const pop = nav.querySelector("#mlPop");
    nav.querySelector("#mlSetBtn").onclick = () => pop.classList.toggle("open");
    nav.querySelector("#mlMenuBtn").onclick = () => nav.classList.toggle("open");
    const sc = nav.querySelector("#mlSound"), an = nav.querySelector("#mlAnim");
    sc.checked = settings.sound; an.checked = settings.anim;
    sc.onchange = () => { settings.sound = sc.checked; saveSettings(); };
    an.onchange = () => { settings.anim = an.checked; saveSettings(); };
    const foot = document.createElement("footer"); foot.className = "ml-footer";
    foot.innerHTML = `<div class="wrap"><div class="foot-grid">
      <div><a class="logo" href="${b}index.html"><span class="mark">${ML_ICONS.asterisk}</span>MOMO 事务所</a>
        <p class="mut" style="margin-top:12px;font-size:13px;max-width:30ch">创意互动工作室 —— 为每一份喜欢，做一个能玩的专属小世界。</p></div>
      <div><h4>站点地图</h4><ul>
        <li><a href="${b}index.html">首页</a></li><li><a href="${b}play.html">游戏</a></li>
        <li><a href="${b}custom.html">定制案例</a></li><li><a href="${b}service.html">服务内容</a></li>
        <li><a href="${b}gift.html">电子礼物</a></li></ul></div>
      <div><h4>联系我们</h4><ul>
        <li><a href="https://github.com/sleep52" target="_blank" rel="noopener">GitHub / sleep52</a></li>
        <li><a href="${b}service.html#contact">开始一个项目</a></li>
        <li><a href="${b}pet/pet001/index.html">宠物专属页示例</a></li></ul></div>
    </div><div class="foot-base"><span>© 2026 MOMO 事务所</span><span>为它做一个小世界</span></div></div>`;
    document.body.append(foot);
  }
  document.addEventListener("DOMContentLoaded", chrome);

  return { $, $$, clamp, rand, irand, pick, shuffle, base, asset, settings, sound, onSound, record, best, machine, bindPause, img, cut, pet, petId, shareCard, floatSticker, rr };
})();