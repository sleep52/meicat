document.addEventListener("DOMContentLoaded", () => {
  const { $ } = CAT;
  const L = CAT_GAMES.list;
  const played = L.filter(g => CAT.plays(g.id)).length;
  $("#sum").textContent = L.length + " 款 · 玩过 " + played + " 款";

  const s = CAT.stat();
  $("#stats").innerHTML = [
    ["star", s.points + " 积分"],
    ["paw", "共 " + L.reduce((a, g) => a + CAT.plays(g.id), 0) + " 局"],
    ["heart", "摸了 " + s.loves + " 下"],
    ["camera", "表情包 " + s.memes + " 张"]
  ].map(([i, t]) => `<span class="pill">${CAT_ICONS[i]}${t}</span>`).join("");

  /* 大卡：一张一张排，封面 + 玩法 + 最高分 + 标签，全部可点 */
  $("#list").innerHTML = L.map(g => {
    const b = CAT.best(g.id), n = CAT.plays(g.id);
    return `<a class="tile tap" href="${CAT.base}${g.href}">
      <img class="ph" alt="${g.name}封面" data-c="${g.cover}">
      <span class="badge">${g.mode === "free" ? "自由玩" : g.mode === "lives" ? "三条命" : g.dur ? g.dur + " 秒" : g.levels + " 关"}</span>
      ${b ? `<span class="best">最高 ${b}</span>` : ""}
      <div class="tb"><b>${g.name}</b><span>${g.sub}</span>
        <div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap">
          ${g.tags.map(t => `<span class="chip">${t}</span>`).join("")}
          ${n ? `<span class="chip">玩过 ${n} 次</span>` : ""}
        </div></div></a>`;
  }).join("");
  CAT.$$("#list .ph").forEach(img => CAT.toImg(img, img.dataset.c, "封面 " + img.dataset.c));
});
