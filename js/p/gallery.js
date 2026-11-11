document.addEventListener("DOMContentLoaded", () => {
  const { $, $$ } = CAT;
  let tab = "全部", q = "";

  /* 原片 + 本机添加的（表情包、上传的照片）合并成一份列表 */
  /* 站内原片改不了文件，但备注可以覆盖：单独存一份 notes，键是图片路径 */
  const notes = () => CAT.load("notes", {});
  function seed() {
    const n = notes();
    return CAT_CONTENT.PHOTOS.map(p => ({
      id: "p" + p.f, src: p.f,
      cap: n[p.f] === undefined ? p.cap : n[p.f],
      tag: p.t, day: "站内原片", own: false
    }));
  }
  function mine() { return CAT.list("album"); }
  function all() {
    const a = mine().map(o => ({ id: o.id, src: o.src, cap: o.cap || "", tag: o.tag || "自定义", day: o.day || "", own: true }))
      .concat(seed());
    return a;
  }
  const tags = () => ["全部", ...new Set(["表情包", "自定义", ...CAT_CONTENT.PHOTOS.map(p => p.t)])];

  function paintTabs() {
    $("#tabs").innerHTML = tags().map(t =>
      `<button class="slot${t === tab ? " on" : ""}" data-t="${t}">${t}</button>`).join("");
    $$("#tabs .slot").forEach(b => b.onclick = () => { tab = b.dataset.t; paintTabs(); paint(); });
  }

  function paint() {
    let a = all();
    if (tab !== "全部") a = a.filter(o => o.tag === tab);
    if (q) a = a.filter(o => (o.cap + o.tag + o.day).toLowerCase().includes(q.toLowerCase()));
    $("#cnt").textContent = a.length + " 张";
    $("#empty").classList.toggle("hide", a.length > 0);
    $("#grid").innerHTML = a.map((o, i) =>
      `<figure data-i="${i}" style="margin:0"><img alt="${o.cap}" data-src="${enc(o.src)}"><figcaption>${esc(o.cap || o.tag)}</figcaption></figure>`).join("");
    $$("#grid img").forEach(img => {
      const s = decodeURIComponent(img.dataset.src);
      if (img.src !== s) CAT.toImg(img, s, "照片");
    });
    $$("#grid figure").forEach(f => f.onclick = () => open(a[+f.dataset.i]));
  }
  const enc = s => encodeURIComponent(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- 单张详情：改备注 / 删除 / 下载 ---------- */
  function open(o) {
    const body = `<img src="${isData(o.src) ? o.src : CAT.asset(o.src)}" alt="${esc(o.cap)}"
        style="width:100%;border-radius:16px;border:2px solid var(--ink);background:var(--paper2)">
      <label class="small mut" style="display:block;margin-top:10px">备注
        <input type="text" id="cap" maxlength="30" value="${esc(o.cap)}" placeholder="写点什么"></label>
      <p class="mut small" style="margin-top:6px">${o.tag} · ${o.day || "站内原片"}${o.own ? " · 存在本机浏览器" : " · 站点自带删不掉，备注只写在这台设备"}</p>
      <div class="row2">
        <button class="btn line" id="dl">下载这张</button>
        ${o.own ? '<button class="btn coral" id="del">删除</button>' : '<button class="btn line" id="tomeme">去做表情包</button>'}
      </div>`;
    const w = CAT.sheet(body, { title: o.own ? "这张照片" : "原片", actions: '<button class="btn gold block" data-close>完成</button>' });
    const cap = w.querySelector("#cap");
    cap.oninput = () => {
      if (!o.own) {
        /* 原片本身不动，只把备注写进 notes 覆盖；改回原话就删掉这条覆盖 */
        const n = CAT.load("notes", {});
        const d = CAT_CONTENT.PHOTOS.find(p => p.f === o.src);
        if (d && cap.value === d.cap) delete n[o.src]; else n[o.src] = cap.value;
        if (CAT.save("notes", n)) { o.cap = cap.value; paint(); }
        return;
      }
      const a = CAT.list("album").map(x => x.id === o.id ? Object.assign(x, { cap: cap.value }) : x);
      if (CAT.save("album", a)) { o.cap = cap.value; paint(); }
    };
    w.querySelector("#dl").onclick = () => {
      const i = new Image();
      i.onload = () => {
        const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
        const g = c.getContext("2d"); g.drawImage(i, 0, 0);
        CAT.download(c, "momo-" + (o.tag) + ".png");
      };
      i.onerror = () => CAT.toast("这张读不到");
      i.src = isData(o.src) ? o.src : CAT.asset(o.src);
    };
    if (w.querySelector("#del")) w.querySelector("#del").onclick = () => {
      const a = CAT.list("album").filter(x => x.id !== o.id);
      CAT.save("album", a); CAT.close(); paint(); CAT.toast("已删除");
    };
    if (w.querySelector("#tomeme")) w.querySelector("#tomeme").onclick = () => {
      location.href = CAT.base + "meme.html";
    };
  }
  const isData = s => s.slice(0, 5) === "data:";

  /* ---------- 上传：压到最长边 900 再存，不然浏览器配额很快就满 ---------- */
  $("#file").onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const i = new Image();
      i.onload = () => {
        const k = Math.min(1, 900 / Math.max(i.width, i.height));
        const c = document.createElement("canvas");
        c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
        c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
        const src = c.toDataURL("image/jpeg", 0.82);
        const a = CAT.list("album");
        a.unshift({ id: Date.now(), src, cap: "", tag: "自定义", day: CAT.today() });
        while (a.length > 40) a.pop();
        if (CAT.save("album", a)) { CAT.sfx.good(); CAT.toast("加好了，只存在这台设备上"); paint(); }
        else { a.shift(); CAT.save("album", a); }
      };
      i.onerror = () => CAT.toast("这张图读不出来，换一张试试");
      i.src = rd.result;
    };
    rd.onerror = () => CAT.toast("文件读失败");
    rd.readAsDataURL(f);
    e.target.value = "";
  };

  $("#q").oninput = e => { q = e.target.value; paint(); };

  paintTabs(); paint();
});
