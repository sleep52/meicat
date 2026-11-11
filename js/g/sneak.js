/* 偷吃木头人（js/g/sneak.js）
 * 守卫用的是实拍吸尘器抠图：它停在墙边=安全，转过来开动=一动就被发现。
 * 没有主人/人脸的真图素材，所以不画假人，改成猫真的怕的那台机器。
 * 松手不等于立刻静止：猫有惯性，速度要 0.2 秒才降下来，最后一刻才停手会输。 */
(() => {
  const cfg = CAT_GAMES.byId.sneak;
  const cv = document.getElementById("cv");
  const hintEl = document.getElementById("gHint");
  const fl = Game.floats();
  const KEYS = ["platter", "kibble", "strips", "cookie", "vacuum", "ball"];
  const props = {};
  KEYS.forEach(k => CAT.img(CAT_PROPS.P[k]).then(i => props[k] = i));
  Cat.load();

  const SPEED = 0.30;        // 满速时每秒推进多少（约 3.3 秒跑完全程）
  let st, p = 0, vel = 0, guard = "off", gt = 1.4, eaten = 0, phase = "creep", eatT = 0, hum = 0, vx = 0, caughtN = 0;

  const floorY = () => st.LH - 74;
  const catX = () => 44 + p * (st.LW - 158);

  function reset(g) {
    st = g.st;
    p = 0; vel = 0; guard = "off"; gt = 1.5; eaten = 0; phase = "creep"; eatT = 0; hum = 0; caughtN = 0;
    vx = g.st.LW - 46;
    fl.clear();
  }

  function caught(g) {
    caughtN++;
    CAT.sfx.bad(); CAT.buzz(46);
    fl.add("被吸到了", catX(), floorY() - 150, "#C4553F");
    p = Math.max(0, p * 0.28);
    vel = 0;
    /* 抓到一次就停机一下，不然 stun 结束立刻又被抓，三条命四秒就没 */
    guard = "off";
    gt = CAT.lerp(2.8, 1.6, CAT.clamp(g.t / cfg.dur, 0, 1));
    phase = "stun"; eatT = 0.75;
    g.miss();
  }

  function update(g, dt) {
    st = g.st;
    const prog = CAT.clamp(g.t / cfg.dur, 0, 1);
    gt -= dt;
    if (gt <= 0) {
      if (guard === "off") { guard = "wake"; gt = CAT.lerp(0.62, 0.42, prog); }
      else if (guard === "wake") { guard = "on"; gt = CAT.lerp(1.05, 1.7, prog); CAT.sfx.bad(); }
      else { guard = "off"; gt = CAT.lerp(2.9, 1.5, prog) * CAT.rand(0.8, 1.25); }
    }
    /* 吸尘器的位置：停着靠在右边，开动时冲到过道中间 */
    const want = guard === "on" ? st.LW - 132 : st.LW - 46;
    vx = CAT.lerp(vx, want, guard === "on" ? 0.12 : 0.06);

    if (phase === "stun") {
      eatT -= dt;
      vel = CAT.lerp(vel, 0, 0.2);
      if (eatT <= 0) phase = "creep";
    } else if (phase === "eat") {
      eatT -= dt;
      vel = 0;
      if (eatT <= 0) { phase = "back"; CAT.sfx.jump(); }
    } else if (phase === "back") {
      /* 叼着零食往回冲：这一段无敌，奖励真跑到终点的人 */
      p = Math.max(0, p - dt * 1.5);
      vel = -1;
      if (p <= 0) { phase = "creep"; vel = 0; }
    } else {
      const target = g.inp.down ? SPEED : 0;
      vel = CAT.lerp(vel, target, 1 - Math.pow(0.001, dt));   // 惯性：约 0.2 秒才停住
      p = CAT.clamp(p + vel * dt, 0, 1);
      if (guard === "on" && vel > SPEED * 0.14) caught(g);
      else if (p >= 1) {
        eaten++;
        const gain = 30 + eaten * 6 + (guard === "off" ? 10 : 0);
        g.add(gain);
        CAT.sfx.bonus(); CAT.buzz(18);
        fl.add("叼到一口 +" + gain, catX(), floorY() - 150, "#F5C445");
        phase = "eat"; eatT = 0.8;
        p = 0.985;
      }
    }
    /* 开动时的低频嗡鸣，用真音源提示「现在别动」 */
    if (guard === "on") {
      hum -= dt;
      if (hum <= 0) { hum = 0.26; CAT.tone(84, 0.3, "sawtooth", 0.035, 62); }
    }
    if (hintEl) {
      hintEl.textContent = phase === "stun" ? "被吸住了…" : phase === "back" ? "快跑回来"
        : phase === "eat" ? "吃一口"
        : guard === "on" ? "别动！！！" : guard === "wake" ? "它要转了" : "按住前进";
      hintEl.classList.toggle("danger", guard === "on" && phase === "creep");
    }
    fl.step(dt);
  }

  function draw(g, x) {
    st = st || g.st;
    const LW = st.LW, LH = st.LH, fy = floorY();
    const on = guard === "on";
    /* 房间：危险时整层压红 */
    x.fillStyle = on ? "#F2DFD2" : "#F7EEDC"; x.fillRect(0, 0, LW, LH);
    x.save();
    x.strokeStyle = "rgba(150,120,70,.10)"; x.lineWidth = 2;
    for (let i = 1; i < 4; i++) { const yy = 30 + i * (fy - 40) / 4; x.beginPath(); x.moveTo(0, yy); x.lineTo(LW, yy); x.stroke(); }
    x.restore();
    Game.floor(x, fy, LW);

    /* 桌子（画的）+ 桌上的真零食 */
    x.save();
    x.fillStyle = "#C79A5E";
    CAT.round(x, LW - 128, fy - 86, 118, 14, 5); x.fill();
    x.fillStyle = "#B0854C";
    x.fillRect(LW - 118, fy - 74, 10, 70);
    x.fillRect(LW - 34, fy - 74, 10, 70);
    x.restore();
    Game.prop(x, props.platter, LW - 62, fy - 108, 78);
    Game.prop(x, props.kibble, LW - 108, fy - 100, 46);
    Game.prop(x, props.strips, LW - 22, fy - 104, 44);

    /* 吸尘器：停着时斜靠墙边，开动时冲进过道并发抖 */
    const shake = on ? Math.sin(g.t * 42) * 2.4 : 0;
    x.save();
    x.translate(vx + shake, fy - 40);
    x.rotate(on ? -0.1 : 0.3);
    x.globalAlpha = on ? 1 : 0.92;
    Game.prop(x, props.vacuum, 0, 0, 96);
    x.restore();
    if (on) {
      x.save();
      const gr = x.createRadialGradient(vx, fy - 44, 6, vx, fy - 44, 96);
      gr.addColorStop(0, "rgba(232,69,47,.34)"); gr.addColorStop(1, "rgba(232,69,47,0)");
      x.fillStyle = gr;
      x.beginPath(); x.arc(vx, fy - 44, 96, 0, Math.PI * 2); x.fill();
      x.restore();
    }

    /* 猫：真照片，压低身子挪，被抓住时打横 */
    const cw = 112, cx = catX(), cy = fy - 119;
    const creep = phase === "creep" && vel > 0.01;
    const bob = creep ? Math.abs(Math.sin(g.t * 9)) * 5 : 0;
    Cat.box(cx - cw / 2, cy - bob, cw).draw(x, Cat.pose({
      rot: phase === "stun" ? 0.42 : creep ? 0.1 : 0,
      squash: phase === "stun" ? 0.3 : creep ? 0.2 : Math.sin(g.t * 1.8) * 0.05,
      breathe: Math.sin(g.t * (creep ? 7 : 2)) * 0.5,
      y: 0
    }));
    if (phase === "eat") Game.prop(x, props.cookie, cx + 40, fy - 128, 40);
    if (phase === "back") Game.prop(x, props.cookie, cx + 34, fy - 120 + Math.sin(g.t * 16) * 4, 40);

    /* 状态提示 */
    if (guard === "wake") Game.pop(x, "它要转了…", LW / 2, 42, 26, "#F5C445", "#241F19");
    else if (on) Game.pop(x, "别动！", LW / 2, 42, 30, "#FFE8E2", "#8B2A18");
    else Game.label(x, "按住屏幕往前挪，松手就停", LW / 2, 40, 14, "#8A7550", "800");

    /* 进度：离零食还有多远 */
    const bw = LW - 92, bx = 46;
    x.save();
    x.fillStyle = "rgba(255,255,255,.8)";
    CAT.round(x, bx, 60, bw, 12, 6); x.fill();
    x.strokeStyle = "#241F19"; x.lineWidth = 2; CAT.round(x, bx, 60, bw, 12, 6); x.stroke();
    x.fillStyle = "#F5C445"; CAT.round(x, bx + 2, 62, Math.max(4, (bw - 4) * p), 8, 4); x.fill();
    x.restore();
    Game.label(x, "已叼到 " + eaten + " 口", LW / 2, 88, 12, "#8A7550", "800");
    fl.draw(x);
  }

  Game.run({
    canvas: cv, id: cfg.id, name: cfg.name, sub: cfg.sub, how: cfg.how,
    logicalW: 360, dur: cfg.dur, lives: 3,
    reset, update, draw,
    resize(g) { st = g.st; },
    rank: s => s >= 380 ? { label: "S", note: "偷吃 " + eaten + " 口，被抓 " + caughtN + " 次。吸尘器从此对你有心理阴影。" }
      : s >= 220 ? { label: "A", note: "偷吃 " + eaten + " 口，被抓 " + caughtN + " 次，稳准狠。" }
        : s >= 90 ? { label: "B", cls: "b", note: "偷吃 " + eaten + " 口，被抓 " + caughtN + " 次，还差得远。" }
          : { label: "C", cls: "c", note: "偷吃 " + eaten + " 口，被抓 " + caughtN + " 次，基本趴在原地看它干活。" }
  });
})();
