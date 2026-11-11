document.addEventListener("DOMContentLoaded", () => {
  const { $, $$ } = CAT;
  $("#line").textContent = CAT.pick(CAT_CONTENT.LINES);

  /* ---------- 首页那只猫：真猫抠图 + 当前装扮 ---------- */
  const cv = $("#cv");
  const st = Game.stage(cv, 480);
  const x = cv.getContext("2d");
  const box = Cat.box(0, 0, 480);
  const P = Cat.pose();
  let t = 0, react = null, love = 0;

  Promise.all([Cat.load(), Wardrobe.load()]).then(() => {
    $("#greet").textContent = "我家猫，在呢";
  });

  const ZONE_SAY = {
    head: ["摸头可以", "再往左一点", "哼", "耳朵别碰"],
    body: ["背痒?", "拍屁屁要出事", "呼噜噜", "肚子不是随便摸的"],
    paw: ["爪子是我的", "握手吗", "指甲剪过了", "踩着呢"],
    tail: ["尾巴=禁区", "炸了", "我忍", "松开！"]
  };

  cv.addEventListener("pointerdown", e => {
    const p = st.pt(e);
    const z = box.hit(P, p[0], p[1]);
    if (!z) { CAT.sfx.bad(); return; }
    react = { z, text: CAT.pick(ZONE_SAY[z]), t: 0 };
    CAT.sfx[z === "tail" ? "bad" : z === "head" ? "purr" : "meow"]();
    CAT.buzz(14);
    love++;
    const d = daylog(); d.loves++; saveDay(d); paintPills();
  });

  (function loop(ts) {
    requestAnimationFrame(loop);
    const dt = 1 / 60;
    t += dt;
    P.breathe = Math.sin(t * 1.5);
    P.x = react ? Math.sin(react.t * 26) * 4 * (1 - react.t) : 0;
    if (react) { react.t += dt; if (react.t > 0.9) react = null; }
    st.apply(x);
    x.clearRect(0, 0, st.LW, st.LH);
    box.draw(x, P);
    Wardrobe.draw(x, box, P);
    if (react) {
      const a = Cat.ANCHOR[react.z] || Cat.ANCHOR.body;
      const sp = Cat.toStage(Cat.tf(P), a[0], a[1]);
      Game.pop(x, react.text, sp[0], sp[1] - 24 - react.t * 30, 26, "#FFF6E2", "#241F19");
    }
  })();

  /* ---------- 顶部数据 ---------- */
  function daylog() {
    const d = CAT.load("daylog", {});
    if (d.date !== CAT.today()) return { date: CAT.today(), loves: 0, games: 0, memes: 0, outfits: 0, dressup: 0 };
    return d;
  }
  function saveDay(d) { CAT.save("daylog", d); }
  const s = CAT.stat();
  function paintPills() {
    const d = daylog();
    $("#pills").innerHTML = [
      ["star", s.points + " 积分"],
      ["heart", "今天摸了 " + d.loves + " 下"],
      ["paw", "玩过 " + s.games + " 局"],
      ["camera", "相册 " + CAT.list("album").length + " 条"]
    ].map(([i, txt]) => `<span class="pill">${CAT_ICONS[i]}${txt}</span>`).join("");
  }
  paintPills();

  /* ---------- 今日任务：四个，进度真的从今天的行为里读 ---------- */
  const TASKS = [
    { k: "loves", need: 5, name: "摸它 5 下", go: "pet.html" },
    { k: "games", need: 1, name: "玩 1 局游戏", go: "games.html" },
    { k: "memes", need: 1, name: "做 1 张表情包", go: "meme.html" },
    { k: "outfits", need: 1, name: "换 1 套装扮", go: "dressup.html" }
  ];
  $("#dayTag").textContent = CAT.today();
  function paintTasks() {
    const d = daylog();
    $("#tasks").innerHTML = TASKS.map(t => {
      const v = Math.min(d[t.k] || 0, t.need);
      return `<div class="task${v >= t.need ? " done" : ""}">
        <b>${t.name}</b><div class="bar"><i style="width:${v / t.need * 100}%"></i></div>
        <span class="n">${v >= t.need ? "已完成" : v + "/" + t.need}</span></div>`;
    }).join("") +
      `<p class="mut small" style="margin:10px 0 0">完成任务给 ${TASKS.length * 20} 积分，今天第一次打开会自动记数。</p>`;
  }
  paintTasks();
  const claimed = CAT.load("dayclaim", "");
  if (claimed !== CAT.today() && TASKS.every(t => (daylog()[t.k] || 0) >= t.need)) {
    CAT.save("dayclaim", CAT.today());
    CAT.patchStat({ points: TASKS.length * 20 });
    CAT.toast("今日任务全部完成，+" + TASKS.length * 20 + " 积分");
    paintPills();
  }

  /* ---------- 入口封面：全部用真猫合成图 ---------- */
  const tiles = $$("a.tile .ph");
  const tileSrc = ["assets/covers/dressup.jpg", "assets/covers/meme.jpg", "assets/covers/kitten.jpg", "assets/covers/hidecat.jpg"];
  tiles.forEach((img, i) => CAT.toImg(img, tileSrc[i]));

  /* 推荐三款：没玩过的按顺序给，玩过的把最低分那款顶上来 */
  const ranked = CAT_GAMES.list.slice().sort((a, b) => CAT.plays(a.id) - CAT.plays(b.id));
  $("#recGames").innerHTML = ranked.slice(0, 2).map(g =>
    `<a class="tile tap" href="${CAT.base}${g.href}"><img class="ph" data-c="${g.cover}" alt="${g.name}封面">
      <span class="badge">${g.mode === "free" ? "自由玩" : g.dur ? g.dur + " 秒" : "三条命"}</span>
      ${CAT.best(g.id) ? `<span class="best">${CAT.best(g.id)}</span>` : ""}
      <div class="tb"><b>${g.name}</b><span>${g.sub}</span></div></a>`).join("") +
    `<a class="tile tap" href="${CAT.base}games.html" style="display:grid;place-items:center;min-height:150px">
      <div class="tb center"><b>还有 ${CAT_GAMES.list.length - 2} 款</b><span>进游戏大厅 ›</span></div></a>`;
  $$("#recGames .ph").forEach(img => CAT.toImg(img, img.dataset.c));

  const ps = CAT_CONTENT.PHOTOS.slice(0, 3);
  $("#recPhotos").innerHTML = ps.map(p =>
    `<figure><img alt="${p.cap}" data-f="${p.f}"><figcaption>${p.cap}</figcaption></figure>`).join("");
  $$("#recPhotos img").forEach(img => CAT.toImg(img, img.dataset.f));
});
