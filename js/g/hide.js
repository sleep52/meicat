/* 猫在哪里（js/g/hide.js）
 * 玩法核心是听声辨位：CAT.sfx.meowAt(pan) 用 StereoPanner 把喵声偏向左右耳，
 * pan 就是猫在画面里的水平位置。但单声道设备/外放听不出左右，所以下面同时画
 * 一条「喵声方向」指示条，同一份数据两种反馈，谁都能玩。关卡越往后，
 * 叫得越稀、指示条抖得越厉害。翻的东西全是实拍抠图。 */
(() => {
  const cfg = CAT_GAMES.byId.hide;
  const cv = document.getElementById("cv");
  const lvEl = document.getElementById("gLevel");
  const digEl = document.getElementById("gDigs");
  const listenBtn = document.getElementById("gListen");
  const fl = Game.floats();

  /* 能盖住一只猫的只有这几件宽家伙，八件正好够第五关 */
  const HIDERS = ["pillow", "gift", "trashbin", "vacuum", "detergent", "platter", "socks", "kibble"];
  const props = {};
  HIDERS.forEach(k => CAT.img(CAT_PROPS.P[k]).then(i => props[k] = i));
  Cat.load();

  const LV = [
    { n: 4, meow: 1.6, jit: 0, digs: 3 },
    { n: 5, meow: 2.0, jit: 0.06, digs: 3 },
    { n: 6, meow: 2.5, jit: 0.12, digs: 4 },
    { n: 7, meow: 3.0, jit: 0.18, digs: 4 },
    { n: 8, meow: 3.6, jit: 0.26, digs: 5 }
  ];
  /* 每个数量下都尽量摊开，别挤在一坨 */
  const SLOTS = [[.25, .30], [.75, .28], [.50, .44], [.22, .60], [.78, .58], [.50, .74], [.27, .86], [.74, .86]];

  let st, level = 0, items = [], cat = -1, digs = 3, meowT = 1, dirUI = null, lvT = 0, found = 0, listenAt = 0;
  let locking = false;      // 找到之后换关的那一段，禁止再翻
  let game = null;

  function build() {
    const c = LV[level];
    const keys = HIDERS.slice(0, c.n);
    for (let i = keys.length - 1; i > 0; i--) { const j = CAT.irand(0, i); const t = keys[i]; keys[i] = keys[j]; keys[j] = t; }
    items = keys.map((k, i) => ({
      k, sx: SLOTS[i][0], sy: SLOTS[i][1], flip: 0, open: false
    }));
    cat = CAT.irand(0, items.length - 1);
    digs = c.digs; meowT = 0.9; lvT = 0; dirUI = null; locking = false;
    paintHud();
  }
  function paintHud() {
    if (lvEl) lvEl.textContent = "第 " + (level + 1) + "/" + LV.length + " 关";
    if (digEl) digEl.textContent = "还能翻 " + digs;
  }
  function pos(it) {
    return [it.sx * st.LW, it.sy * st.LH];
  }
  /* 一件东西在屏幕上占多大：按原图比例塞进 ~126 高的框 */
  function sizeOf(it) {
    const img = props[it.k];
    const bh = 126, bw = 132;
    const w = img && img.naturalWidth ? Math.min(bw, bh * img.naturalWidth / img.naturalHeight) : bw;
    const h = img && img.naturalWidth ? w * img.naturalHeight / img.naturalWidth : bh;
    return [w, h];
  }
  function meowNow(g) {
    /* 最后一关找到后 level 已经走到 LV.length，不挡住这里会读到 undefined */
    if (locking || !items.length || cat < 0) return;
    const c = LV[level];
    const [cx] = pos(items[cat]);
    const pan = CAT.clamp((cx - st.LW / 2) / (st.LW / 2), -1, 1);
    const shown = CAT.clamp(pan + CAT.rand(-1, 1) * c.jit, -1, 1);
    CAT.sfx.meowAt(pan);
    dirUI = { v: shown, t: 1.6 };
    meowT = c.meow;
    if (g) listenAt = g.t + 2.4;
  }

  function reset(g) {
    st = g.st;
    level = 0; found = 0;
    fl.clear();
    build();
  }

  function tap(g, px, py) {
    if (locking || digs <= 0) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.open) continue;
      const [x, y] = pos(it), [w, h] = sizeOf(it);
      if (Math.abs(px - x) > w * 0.62 || Math.abs(py - (y - h * 0.28)) > h * 0.72) continue;
      it.open = true; it.flip = 0;
      digs--;
      paintHud();
      CAT.buzz(10);
      if (i === cat) {
        found++;
        locking = true;
        const bonus = 40 + digs * 25 + Math.max(0, Math.round(18 - lvT));
        g.add(bonus);
        CAT.sfx.meow(true); CAT.sfx.win();
        fl.add("找到啦 +" + bonus, x, y - 120, "#F5C445");
        level++;
        if (level >= LV.length) { setTimeout(() => g.over("clear"), 1100); return; }
        setTimeout(() => { if (g.state === "play") build(); }, 1150);
      } else {
        CAT.sfx.bad();
        fl.add("不在", x, y - 90, "#8A8172");
        if (digs <= 0) setTimeout(() => g.over("empty"), 700);
      }
      return;
    }
    CAT.sfx.tap();
  }

  function update(g, dt) {
    st = g.st;
    lvT += dt;
    meowT -= dt;
    if (meowT <= 0) meowNow(g);
    if (dirUI) { dirUI.t -= dt; if (dirUI.t <= 0) dirUI = null; }
    for (const it of items) if (it.open && it.flip < 1) it.flip = Math.min(1, it.flip + dt * 4.5);
    fl.step(dt);
  }

  function draw(g, x) {
    st = st || g.st;
    /* 地毯背景 */
    x.fillStyle = "#F4EADA"; x.fillRect(0, 0, st.LW, st.LH);
    x.save();
    x.fillStyle = "#EEDFC5";
    CAT.round(x, 12, 34, st.LW - 24, st.LH - 52, 26); x.fill();
    x.strokeStyle = "rgba(140,110,60,.22)"; x.lineWidth = 3; x.stroke();
    x.setLineDash([10, 10]);
    CAT.round(x, 26, 48, st.LW - 52, st.LH - 80, 20); x.stroke();
    x.restore();

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const [px, py] = pos(it), [w, h] = sizeOf(it);
      const isCat = i === cat;
      /* 猫先画在盖子后面：盖子掀开才露出来 */
      if (it.open) {
        const k = Game.ease.out(Math.min(1, it.flip * 1.4));
        if (isCat && k > 0.15) {
          const cw = 128;
          Cat.box(px - cw / 2, py - h * 0.2 - cw * (560 / 480) + 12, cw).draw(x, Cat.pose({
            breathe: Math.sin(g.t * 2) * 0.6, scale: 1, y: (1 - k) * 26
          }));
        }
      }
      x.save();
      x.translate(px, py);
      if (it.open) {
        const f = Game.ease.out(it.flip);
        x.globalAlpha = 1 - f * 0.85;
        x.translate(-w * 0.5 * f, -h * 0.2 * f);
        x.rotate(-0.5 * f);
      }
      Game.prop(x, props[it.k], 0, -h * 0.28, w);
      x.restore();
      if (!it.open) {
        x.save(); x.globalAlpha = 0.22; x.fillStyle = "#6B563A";
        x.beginPath(); x.ellipse(px, py + h * 0.2, w * 0.42, 7, 0, 0, Math.PI * 2); x.fill();
        x.restore();
      }
    }

    /* 喵声方向指示条：立体声之外的第二条线索 */
    if (dirUI) {
      const a = CAT.clamp(dirUI.t / 1.6, 0, 1);
      const bw = st.LW - 76, bx = 38, by = 20;
      x.save(); x.globalAlpha = a;
      x.fillStyle = "rgba(255,255,255,.86)";
      CAT.round(x, bx, by - 9, bw, 18, 9); x.fill();
      x.strokeStyle = "#241F19"; x.lineWidth = 2; CAT.round(x, bx, by - 9, bw, 18, 9); x.stroke();
      const mx = bx + bw / 2 + dirUI.v * (bw / 2 - 10);
      x.fillStyle = "#E8452F";
      x.beginPath(); x.arc(mx, by, 7, 0, Math.PI * 2); x.fill();
      Game.label(x, "喵声方向", bx + bw / 2, by + 22, 11, "#8A7550", "800");
      Game.label(x, "左", bx - 14, by, 12, "#8A7550", "800");
      Game.label(x, "右", bx + bw + 14, by, 12, "#8A8172", "800");
      x.restore();
    } else {
      Game.label(x, "竖起耳朵，喵声会告诉你左右", st.LW / 2, 22, 13, "#A9946B", "800");
    }
    if (items.length && items[cat] && items[cat].open) Game.pop(x, "本喵在这里", st.LW / 2, st.LH / 2 - 40, 30);
    fl.draw(x);
  }

  game = Game.run({
    canvas: cv, id: cfg.id, name: cfg.name, sub: cfg.sub, how: cfg.how,
    logicalW: 360, tap, reset, update, draw,
    resize(g) { st = g.st; },
    rank: s => found >= LV.length
      ? { label: "S", cls: "", note: "五关全过，耳朵比鼻子好使。" }
      : s > 0
        ? { label: found >= 3 ? "A" : found >= 2 ? "B" : "C",
          cls: found >= 3 ? "" : found >= 2 ? "b" : "c",
          note: "找到 " + found + " 次，最后一次它藏在翻过的东西后面等你。" }
        : { label: "—", cls: "bad", note: "一次没翻到。猫自己走出来了，有点尴尬。" }
  });
  if (listenBtn) listenBtn.onclick = () => {
    if (!game || game.state !== "play" || !items.length) { CAT.toast("开始之后才有猫可叫"); return; }
    if (game.t < listenAt) { CAT.toast("等一等，让它再叫一声"); return; }
    meowNow(game);
  };
})();
