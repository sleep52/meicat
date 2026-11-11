/* 猫语翻译机（js/g/meow.js）
 *
 * 两个功能都是真的：
 * ①「人话→喵语」确定性映射——同一句话永远翻成同一串音节（FNV-1a 哈希 + 声调表），
 *   并且真的用 WebAudio 按声调发声、按位置左右扫声道；海报是真画真导出的 PNG。
 * ②「喵语→猜心思」是六道题的测验，答完才写最高分。
 * 页面里明写这是玩梗不是猫科学，不假装真能翻译。 */
(() => {
  const cfg = CAT_GAMES.byId.meow;
  const M = CAT_CONTENT.MEOW;
  const cv = document.getElementById("mCat");
  const outEl = document.getElementById("mOut");
  const pyEl = document.getElementById("mPy");
  const sayEl = document.getElementById("mSay");
  const ta = document.getElementById("mText");
  const bestEl = document.getElementById("mBest");
  const qBox = document.getElementById("qBox");
  const qMeta = document.getElementById("qMeta");

  Cat.load();
  Wardrobe.load();
  const st = Game.stage(cv, 300);
  let kick = 0, t = 0, cur = { meow: "", py: "", say: "", syl: [] };
  document.title = cfg.name;
  CAT.$("#mHow").textContent = cfg.how;
  window.addEventListener("resize", st.fit);

  /* 声调表：[起始频率, 滑向, 时长]，和 MEOW.tone 的 mā/má/mǎ/mà 一一对应 */
  const TONE_F = [[620, 650, 0.22], [540, 880, 0.24], [680, 460, 0.28], [840, 400, 0.14]];
  const SYL = ["喵", "喵↑", "喵↓↑", "喵↓"];

  function hash(s) {
    let h = 2166136261;
    for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function translate(text) {
    const raw = String(text || "").trim();
    if (!raw) return { meow: "", py: "", say: "先写一句人话，本喵才好回你。", syl: [], hit: false };
    for (const it of M.intent) {
      if (it.keys.some(k => raw.indexOf(k) >= 0)) {
        /* 命中词库：整句是写好的译法，音节与发声都从这句喵语本身推出来 */
        const syl = syls(it.meow, hash(it.meow));
        return { meow: it.meow, py: syl.map(s => M.tone[s.ti]).join(" "), say: it.say, syl, hit: true };
      }
    }
    const h = hash(raw);
    const syl = syls(raw, h);
    if (!syl.length) return { meow: "", py: "", say: "这句里一个能发音的字都没有。", syl: [], hit: false };
    const tail = M.tail[h % M.tail.length];
    return {
      meow: syl.map(s => s.t).join(" ") + tail,
      py: syl.map(s => M.tone[s.ti]).join(" "),
      say: "没有固定译法：" + syl.length + " 个字翻成 " + syl.length +
        " 个音节，声调由这句话的哈希决定，所以每次一模一样。",
      syl, hit: false
    };
  }
  function syls(raw, h) {
    /* 只数汉字和数字：破折号、感叹号是拖长和加重，不该各自占一个音节 */
    const chars = [...raw].filter(c => /[\p{L}\p{N}]/u.test(c)).slice(0, 12);
    return chars.map((c, i) => {
      const code = c.codePointAt(0);
      const ti = ((code ^ (h >>> (i % 24))) >>> 0) & 3;
      return { t: SYL[ti], ti, py: M.tone[ti], long: ((code >> 4) & 1) === 1 };
    });
  }
  function play(syl) {
    if (!syl || !syl.length) { CAT.toast("先翻译一句"); return; }
    if (!CAT.settings.sound) { CAT.toast("设置里音效是关的"); return; }
    const n = syl.length;
    syl.forEach((s, i) => {
      const f = TONE_F[s.ti];
      const dur = f[2] * (s.long ? 1.7 : 1);
      CAT.tone(f[0], dur, "triangle", 0.075, f[1], i * 0.2, n > 1 ? -0.85 + 1.7 * (i / (n - 1)) : 0);
    });
    kick = 1;
  }

  /* ---------- 海报 ---------- */
  function wrap(x, text, maxW, byChar) {
    const units = byChar ? [...text] : text.split(" ");
    const join = byChar ? "" : " ";
    const lines = [];
    let line = "";
    for (const u of units) {
      const test = line ? line + join + u : u;
      if (x.measureText(test).width > maxW && line) { lines.push(line); line = u; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function poster() {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 680;
    const x = c.getContext("2d");
    x.fillStyle = "#FBF6EC"; x.fillRect(0, 0, 512, 680);
    x.strokeStyle = "#241F19"; x.lineWidth = 7;
    CAT.round(x, 18, 18, 476, 644, 24); x.stroke();
    x.fillStyle = "#F5C445";
    CAT.round(x, 150, 42, 212, 40, 20); x.fill();
    x.fillStyle = "#241F19"; x.font = CAT.FONT("900", 21);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("猫语翻译机", 256, 63);

    const P = Cat.pose({ breathe: 0.4 });
    const box = Cat.box(126, 92, 260);
    box.draw(x, P);
    Wardrobe.draw(x, box, P);

    x.fillStyle = "#8A8172"; x.font = CAT.FONT("700", 16);
    x.textAlign = "left"; x.textBaseline = "top";
    const src = "你说：" + String(ta.value || "").trim().slice(0, 46);
    wrap(x, src, 448, true).forEach((ln, i) => x.fillText(ln, 34, 402 + i * 22));

    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = "#241F19";
    const size = cur.syl.length > 8 ? 34 : cur.syl.length > 5 ? 40 : 46;
    x.font = CAT.FONT("900", size);
    const lines = wrap(x, cur.meow || "喵", 440, false);
    lines.slice(0, 4).forEach((ln, i) => x.fillText(ln, 256, 512 + i * (size + 8)));
    x.fillStyle = "#B08A2E"; x.font = CAT.FONT("700", 17);
    x.fillText(cur.py || "", 256, 512 + Math.min(4, lines.length) * (size + 8) + 6);

    x.fillStyle = "#A9987A"; x.font = CAT.FONT("700", 13);
    x.fillText("我家猫 · 真猫互动站 · " + CAT.today(), 256, 640);
    if (CAT.download(c, "meow-" + hash(cur.meow) + ".png")) CAT.toast("海报已导出");
  }

  /* ---------- 猜心思 ---------- */
  let qs = [], qi = 0, right = 0, answered = false;
  function newRound() {
    qs = M.quiz.map((q, i) => {
      const opts = q.a.map((txt, j) => ({ txt, ok: j === q.right }));
      for (let i2 = opts.length - 1; i2 > 0; i2--) { const j = CAT.irand(0, i2); const t2 = opts[i2]; opts[i2] = opts[j]; opts[j] = t2; }
      return { q: q.q, why: q.why, syl: syls(q.q, hash(q.q)), opts };
    });
    qi = 0; right = 0;
    renderQ();
  }
  function renderQ() {
    answered = false;
    if (qi >= qs.length) {
      const score = right * 20;
      const r = CAT.record("meow", score);
      if (bestEl) bestEl.textContent = r.best;
      qBox.innerHTML = `<p class="big">答对 ${right} / ${qs.length}</p>
        <p class="mut small">得分 ${score}${r.isNew ? " · 新纪录" : " · 最高 " + r.best}</p>
        <button class="btn gold block" data-re>再猜一轮</button>`;
      qBox.querySelector("[data-re]").onclick = newRound;
      qMeta.textContent = "本轮结束";
      return;
    }
    const it = qs[qi];
    qMeta.textContent = "第 " + (qi + 1) + " / " + qs.length + " 题 · 答对 " + right;
    qBox.innerHTML = `<p class="big">${it.q}</p>
      <button class="btn line small" data-Listen>${CAT_ICONS.sound} 听她说</button>
      <div class="grid2" data-opts>${it.opts.map((o, i) =>
        `<button class="btn line" data-i="${i}">${o.txt}</button>`).join("")}</div>
      <p class="mut small hide" data-why>${it.why}</p>
      <button class="btn gold block hide" data-next>下一题</button>`;
    qBox.querySelector("[data-Listen]").onclick = () => play(it.syl);
    qBox.querySelector("[data-opts]").onclick = e => {
      const b = e.target.closest("button[data-i]");
      if (!b || answered) return;
      const o = it.opts[+b.dataset.i];
      answered = true;
      b.classList.add(o.ok ? "gold" : "coral");
      if (o.ok) { right++; CAT.sfx.good(); } else { CAT.sfx.bad(); }
      CAT.$("[data-why]", qBox).classList.remove("hide");
      CAT.$("[data-next]", qBox).classList.remove("hide");
      CAT.$$("[data-opts] button", qBox).forEach(x2 => { x2.disabled = true; });
    };
    qBox.querySelector("[data-next]").onclick = () => { qi++; renderQ(); };
  }

  /* ---------- 页面接线 ---------- */
  function paint() {
    cur = translate(ta.value);
    outEl.textContent = cur.meow || "——";
    pyEl.textContent = cur.py || "";
    sayEl.textContent = cur.say;
    sayEl.classList.toggle("mut", !cur.hit);
  }
  const tabs = CAT.$$("#mTabs .slot");
  tabs.forEach(b => b.onclick = () => {
    tabs.forEach(o => o.classList.toggle("on", o === b));
    const on = b.dataset.t;
    CAT.$("#tabSay").classList.toggle("hide", on !== "say");
    CAT.$("#tabQuiz").classList.toggle("hide", on !== "quiz");
    CAT.sfx.tap();
    if (on === "quiz" && !qs.length) newRound();
  });
  ta.addEventListener("input", () => { paint(); kick = 0.8; });
  CAT.$("#mGo").onclick = () => { paint(); play(cur.syl); };
  CAT.$("#mPlay").onclick = () => play(cur.syl);
  CAT.$("#mPost").onclick = () => { if (!cur.syl.length) { paint(); } poster(); };
  CAT.$("#mCopy").onclick = () => {
    if (!cur.meow) { CAT.toast("先翻译一句"); return; }
    const done = () => CAT.toast("喵语已复制");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cur.meow).then(done, fallback);
    else fallback();
    function fallback() {
      const tmp = document.createElement("textarea");
      tmp.value = cur.meow;
      tmp.style.position = "fixed"; tmp.style.opacity = "0";
      document.body.append(tmp); tmp.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      tmp.remove();
      if (ok) done(); else CAT.toast("浏览器不让复制，长按选中吧");
    }
  };
  CAT.$$("#exRows .chip").forEach(b => b.onclick = () => { ta.value = b.textContent; paint(); play(cur.syl); });
  if (bestEl) bestEl.textContent = CAT.best("meow");
  paint();

  /* 打字的时候猫跟着晃，素材只有一张照片，那就用整张照片的倾斜做反应 */
  const cx2 = cv.getContext("2d");
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.016;
    kick = Math.max(0, kick - 0.02);
    st.apply(cx2);
    cx2.clearRect(0, 0, st.LW, st.LH);
    const P = Cat.pose({
      breathe: Math.sin(t * 1.9) * 0.8,
      rot: CAT.clamp(Math.sin(t * 2.6) * 0.05 * kick + (kick > 0.4 ? Math.sin(t * 22) * 0.05 : 0), -0.16, 0.16),
      squash: kick * 0.12
    });
    const box = Cat.box(10, 6, 280);
    box.draw(cx2, P);
    Wardrobe.draw(cx2, box, P);
  })();
})();
