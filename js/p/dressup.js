document.addEventListener("DOMContentLoaded", () => {
  const { $, $$ } = CAT;
  let slot = "head";
  const cv = $("#cv");
  const st = Game.stage(cv, 480);
  const x = cv.getContext("2d");
  const box = Cat.box(0, 0, 480);
  const P = Cat.pose();
  let t = 0, kick = 0;

  Promise.all([Cat.load(), Wardrobe.load()]).then(() => {
    $("#load").classList.add("hide");
    paintSlots(); paintItems(); paintNow(); paintSaved();
  });

  (function loop() {
    requestAnimationFrame(loop);
    t += 1 / 60;
    if (kick > 0) kick = Math.max(0, kick - 0.06);
    P.breathe = Math.sin(t * 1.4);
    P.squash = kick * 0.12;
    st.apply(x); x.clearRect(0, 0, st.LW, st.LH);
    box.draw(x, P);
    Wardrobe.draw(x, box, P);
  })();

  /* ---------- 部位标签 ---------- */
  function paintSlots() {
    $("#slots").innerHTML = Wardrobe.SLOTS.map(s =>
      `<button class="slot${s.id === slot ? " on" : ""}" data-s="${s.id}">${s.name}${s.locked ? "（待补）" : ""}</button>`).join("");
    $$("#slots .slot").forEach(b => b.onclick = () => { slot = b.dataset.s; paintSlots(); paintItems(); });
  }

  /* ---------- 单品：缩略图就是真图裁切后的样子，所见即所选 ---------- */
  function paintItems() {
    const s = Wardrobe.SLOTS.find(o => o.id === slot);
    const w = CAT.wear();
    if (s.locked) {
      $("#items").innerHTML = `<div class="card locked" style="grid-column:1/-1;background:var(--paper2)">
        <b>${s.name}：没有素材</b><p class="small mut" style="margin-top:4px">${s.locked}</p></div>`;
      return;
    }
    const list = Wardrobe.inSlot(slot);
    $("#items").innerHTML =
      `<button class="item none${!w[slot] ? " on" : ""}" data-id=""><b>不穿</b></button>` +
      list.map(i => `<button class="item${w[slot] === i.id ? " on" : ""}" data-id="${i.id}">
        <img alt="${i.name}" data-thumb="${i.id}"><b>${i.name}</b></button>`).join("");
    $$("#items .item").forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      const off = !!id && CAT.wear()[slot] === id;   // 再点一次身上这件 = 脱下
      CAT.setWear(slot, off ? null : (id || null));
      if (id && !off) { CAT.patchStat({ outfits: 1 }); bump(); }
      CAT.sfx.tap();
      paintItems(); paintNow();
      const d = daylog(); if (!off) d.outfits++; CAT.save("daylog", d);
    });
    $$("#items img[data-thumb]").forEach(img => {
      img.src = Wardrobe.thumb(Wardrobe.byId[img.dataset.thumb], 160);
    });
  }

  /* 换装时让猫抖一下，确认真的穿上了 */
  function bump() { kick = 1; }

  function paintNow() {
    const w = CAT.wear();
    const on = Wardrobe.ITEMS.filter(i => w[i.slot] === i.id).map(i => i.name);
    $("#nowTxt").textContent = "现在：" + (on.length ? on.join(" + ") : "素着");
  }

  /* ---------- 随机 / 脱下 / 收藏 / 导出 ---------- */
  $("#btnRand").onclick = () => {
    ["head", "cloth", "neck"].forEach(k => {
      const l = Wardrobe.inSlot(k);
      CAT.setWear(k, CAT.pick(l).id);
    });
    CAT.sfx.bonus(); bump(); paintItems(); paintNow();
    const d = daylog(); d.outfits++; CAT.save("daylog", d);
  };
  $("#btnClear").onclick = () => {
    ["head", "cloth", "neck"].forEach(k => CAT.setWear(k, null));
    CAT.sfx.tap(); paintItems(); paintNow();
  };

  /* 成品图：600×750，真猫 + 当前装扮 + 搭配名 */
  function render(worn, withUi) {
    const c = document.createElement("canvas");
    c.width = 600; c.height = 750;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 750);
    grad.addColorStop(0, "#FDF8EE"); grad.addColorStop(1, "#EFE0C3");
    g.fillStyle = grad; g.fillRect(0, 0, 600, 750);
    g.fillStyle = "rgba(74,58,34,.10)";
    g.beginPath(); g.ellipse(300, 690, 190, 26, 0, 0, Math.PI * 2); g.fill();
    const b = Cat.box(60, 60, 480);
    b.draw(g, Cat.pose({ breathe: 0.4 }));
    Wardrobe.draw(g, b, Cat.pose({ breathe: 0.4 }), worn);
    g.strokeStyle = "#241F19"; g.lineWidth = 8;
    CAT.round(g, 10, 10, 580, 730, 26); g.stroke();
    const w = worn || CAT.wear();
    const names = Wardrobe.ITEMS.filter(i => w[i.slot] === i.id).map(i => i.name);
    g.fillStyle = "#241F19"; g.font = CAT.FONT("900", 26); g.textAlign = "center";
    g.fillText(names.length ? names.join(" + ") : "今日素颜", 300, 726);
    return c;
  }
  $("#btnPng").onclick = () => {
    CAT.download(render(null), "momo-" + Date.now() + ".png");
    CAT.toast("已导出 PNG");
  };
  $("#btnSave").onclick = () => {
    const w = CAT.wear();
    if (!Object.values(w).some(Boolean)) { CAT.toast("先穿点东西再收藏"); return; }
    const a = CAT.list("fits");
    a.unshift({ id: Date.now(), wear: w });
    while (a.length > 12) a.pop();
    if (CAT.save("fits", a)) { CAT.sfx.good(); paintSaved(); CAT.toast("已存进收藏"); }
  };
  function paintSaved() {
    const a = CAT.list("fits");
    $("#savedN").textContent = a.length + " 套";
    $("#saved").innerHTML = a.length ? a.map(f => {
      const names = Wardrobe.ITEMS.filter(i => f.wear[i.slot] === i.id).map(i => i.name);
      return `<button class="item" data-fit="${f.id}"><b style="margin-top:6px">${names.join("<br>") || "空"}</b>
        <span class="mut small">点一下穿上</span></button>`;
    }).join("") : `<p class="mut small" style="grid-column:1/-1">还没有收藏的搭配。</p>`;
    $$("#saved [data-fit]").forEach(b => b.onclick = () => {
      const f = CAT.list("fits").find(o => String(o.id) === b.dataset.fit);
      if (!f) return;
      ["head", "cloth", "neck"].forEach(k => CAT.setWear(k, f.wear[k] || null));
      paintItems(); paintNow(); CAT.sfx.good(); CAT.toast("穿上了");
    });
  }

  function daylog() {
    const d = CAT.load("daylog", {});
    return d.date === CAT.today() ? d : { date: CAT.today(), loves: 0, games: 0, memes: 0, outfits: 0 };
  }
});
