document.addEventListener("DOMContentLoaded", () => {
  const { $ } = CAT;
  const cv = $("#cv");
  const st = Game.stage(cv, 480);
  const x = cv.getContext("2d");
  const box = Cat.box(0, 0, 480);
  const P = Cat.pose();

  /* 表情 = 一张真原片 + 一组对同一张照片能做得真的形变参数 */
  const FACES = [
    { key: "sit", name: "端坐", f: "assets/sit.jpg", pose: {}, say: "今天也还行。" },
    { key: "flat", name: "无语", f: "assets/flat.jpg", pose: { rot: -0.06 }, say: "你最好有事。" },
    { key: "wide", name: "惊讶", f: "assets/wide.jpg", pose: { y: -14, scale: 1.05 }, say: "什么？！" },
    { key: "sleep", name: "困", f: "assets/sleep.jpg", pose: { squash: 0.09, breathe: -0.8 }, say: "已离线。" },
    { key: "meijiejie", name: "盯", f: "assets/meijiejie.jpg", pose: { scale: 1.03 }, say: "我看着呢。" },
    { key: "touch", name: "被摸", f: "assets/touch.jpg", pose: { rot: 0.05 }, say: "勉强让你摸。" }
  ];
  let face = FACES[0], target = {}, t = 0, float = null;

  Promise.all([Cat.load(), Wardrobe.load()]).then(() => {
    $("#load").classList.add("hide");
  });

  /* ---------- 表情选择 ---------- */
  $("#faces").innerHTML = FACES.map((f, i) =>
    `<button class="item${i === 0 ? " on" : ""}" data-i="${i}">
      <img alt="${f.name}" data-f="${f.f}"><b>${f.name}</b></button>`).join("");
  CAT.$$("#faces img").forEach(img => CAT.toImg(img, img.dataset.f));
  CAT.$$("#faces .item").forEach(b => b.onclick = () => {
    CAT.$$("#faces .item").forEach(o => o.classList.remove("on"));
    b.classList.add("on");
    face = FACES[+b.dataset.i];
    target = Object.assign({}, face.pose);
    $("#nowFace").textContent = face.name;
    $("#nowNote").textContent = "原片 " + face.f;
    $("#react").textContent = face.say;
    CAT.sfx.meow();
    CAT.buzz(10);
  });

  /* ---------- 分区触摸 ---------- */
  const ZONE = {
    head: { sfx: "purr", say: "咕噜咕噜……摸头可以，就三下。", pop: "呼噜" },
    body: { sfx: "meow", say: "拍背等于拍屁股，你要出事。", pop: "拍背" },
    paw: { sfx: "meow", say: "爪子是我的，不给握。", pop: "握手" },
    tail: { sfx: "bad", say: "尾巴=禁区。已经炸了。", pop: "炸毛" },
    call: { sfx: "meow", say: "叫我是因为你有事求我。", pop: "喵！" },
    treat: { sfx: "bonus", say: "罐头开盖声我能穿过三道墙听见。", pop: "饭？" }
  };
  function react(z, px, py) {
    const r = ZONE[z]; if (!r) return;
    CAT.sfx[r.sfx](); CAT.buzz(14);
    $("#react").textContent = r.say;
    float = { text: r.pop, x: px, y: py, t: 0 };
    const d = daylog(); d.loves++; CAT.save("daylog", d); paintLove();
    kick = z === "tail" ? 0.18 : 0.09;
  }
  cv.addEventListener("pointerdown", e => {
    const p = st.pt(e);
    const z = box.hit(P, p[0], p[1]);
    if (!z) { CAT.sfx.bad(); $("#react").textContent = "没摸到，她故意躲的。"; return; }
    react(z, p[0], p[1] - 40);
  });
  CAT.$$("button[data-z]").forEach(b => b.onclick = () => {
    const z = b.dataset.z;
    const a = Cat.ANCHOR[z] || Cat.ANCHOR.body;
    const sp = box.p(Cat.toStage(Cat.tf(P), a[0], a[1])[0], Cat.toStage(Cat.tf(P), a[0], a[1])[1], P);
    react(z, sp[0], sp[1] - 30);
  });

  /* ---------- 循环：把目标姿态缓动过去 ---------- */
  /* 每个姿态都有一条中立场：scale 的中立是 1，不是 0，不然整只猫缓着缓着就没了 */
  const DEF = { x: 0, y: 0, scale: 1, rot: 0, squash: 0 };
  const cur = Object.assign({}, DEF);
  let kick = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 1 / 60;
    for (const k in DEF) cur[k] = CAT.lerp(cur[k], target[k] === undefined ? DEF[k] : target[k], 0.09);
    kick = Math.max(0, kick - 0.005);
    Object.assign(P, cur, {
      squash: CAT.clamp(cur.squash + kick, -0.4, 0.4),
      breathe: Math.sin(t * (face.key === "sleep" ? 0.7 : 1.5))
    });
    st.apply(x);
    x.clearRect(0, 0, st.LW, st.LH);
    box.draw(x, P);
    Wardrobe.draw(x, box, P);
    if (float) {
      float.t += 1 / 60;
      Game.pop(x, float.text, float.x, float.y - float.t * 40, 26, "#FFF6E2", "#241F19");
      if (float.t > 0.9) float = null;
    }
  })();

  /* ---------- 档案 / 装扮 / 亲密 ---------- */
  $("#facts").innerHTML = CAT_CONTENT.FACTS.map(f => `<div class="kv"><span class="mut">${f.k}</span><b>${f.v}</b></div>`).join("") +
    `<div class="kv"><span class="mut">抠图源文件</span><b>assets/rabbitcat.jpg</b></div>`;

  function paintWear() {
    const w = CAT.wear();
    const row = k => {
      const it = Wardrobe.byId[w[k]];
      return `<div class="kv"><span class="mut">${Wardrobe.SLOTS.find(s => s.id === k).name}</span>
        <b>${it ? it.name : "没穿"}</b></div>`;
    };
    $("#wearNow").innerHTML = ["head", "cloth", "neck"].map(row).join("") +
      `<a class="btn gold block" href="dressup.html">去换装室</a>`;
  }
  paintWear();

  function daylog() {
    const d = CAT.load("daylog", {});
    return d.date === CAT.today() ? d : { date: CAT.today(), loves: 0, games: 0, memes: 0, outfits: 0 };
  }
  function paintLove() {
    const n = daylog().loves || 0;
    $("#loveN").textContent = n;
    $("#loveBar").style.width = Math.min(100, n / 20 * 100) + "%";
  }
  paintLove();
});
