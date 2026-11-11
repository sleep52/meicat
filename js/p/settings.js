document.addEventListener("DOMContentLoaded", () => {
  const { $ } = CAT;

  function paintStats() {
    const s = CAT.stat();
    $("#statCards").innerHTML = [
      ["积分", s.points], ["玩过", s.games + " 局"],
      ["表情包", s.memes + " 张"], ["搭配", s.outfits + " 套"]
    ].map(([k, v]) => `<div class="center"><div style="font-size:22px;font-weight:900">${v}</div>
      <div class="mut small">${k}</div></div>`).join("");
  }
  paintStats();

  /* ---------- 偏好：真的写进 localStorage，立刻生效 ---------- */
  const bind = (id, key) => {
    const el = $("#" + id);
    el.checked = !!CAT.settings[key];
    el.onchange = () => {
      CAT.setSettings({ [key]: el.checked });
      if (key === "sound" && el.checked) CAT.sfx.good();
      if (key === "haptic" && el.checked) CAT.buzz(20);
    };
  };
  bind("pSound", "sound"); bind("pAnim", "anim"); bind("pHaptic", "haptic");
  $("#trySound").onclick = () => CAT.sfx.meow(true);

  /* ---------- 成绩 ---------- */
  function paintRecs() {
    const rows = CAT_GAMES.list.map(g => {
      const b = CAT.best(g.id), n = CAT.plays(g.id);
      return `<div class="kv"><span class="mut">${g.name}</span>
        <b>${n ? b + " 分 · " + n + " 局" : "还没玩过"}</b></div>`;
    });
    const total = CAT_GAMES.list.reduce((a, g) => a + CAT.plays(g.id), 0);
    $("#recN").textContent = total ? "共 " + total + " 局" : "暂无";
    $("#recs").innerHTML = rows.join("");
  }
  paintRecs();

  /* ---------- 数据 ---------- */
  const KEYS = ["settings", "records", "stats", "wear", "album", "fits", "daylog", "dayclaim", "notes"];
  function usage() {
    let n = 0;
    KEYS.forEach(k => { const s = localStorage.getItem("meicat:" + k); if (s) n += s.length; });
    $("#usage").textContent = (n / 1024).toFixed(1) + " KB / 约 5 MB";
    return n;
  }
  usage();
  $("#exp").onclick = () => {
    const out = {};
    KEYS.forEach(k => { const s = localStorage.getItem("meicat:" + k); if (s !== null) out[k] = JSON.parse(s); });
    out._exported = new Date().toISOString();
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "momo-save-" + CAT.today() + ".json";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    CAT.toast("已导出，换设备后用浏览器打开这个文件就能看到同样的数据（需手动恢复）");
  };
  $("#clr").onclick = () => {
    const w = CAT.sheet(`<p>会删掉：装扮、成绩、积分、相册里你自己加的照片和做过的表情包、原片上写过的备注、今日任务进度。</p>
      <p class="mut small">站点自带的 21 张原片不会被删。</p>
      <button class="btn coral block" id="yes">确认清空</button>
      <button class="btn line block" data-close>取消</button>`, { title: "确定吗", actions: "" });
    w.querySelector("#yes").onclick = () => {
      KEYS.forEach(k => localStorage.removeItem("meicat:" + k));
      CAT.close(); location.reload();
    };
  };

  /* ---------- 待补素材：明写还缺什么，不放假图 ---------- */
  const TODO = [
    ["闭眼 / 张嘴实拍", "现在眨眼和张嘴是空操作，因为只有一张睁眼坐姿照片。补两张同机位实拍就能做真表情。"],
    ["侧身 / 趴姿实拍", "跑酷、弹弓这类要猫朝侧面运动的玩法，用正脸照扭出来会像纸片，所以这两款暂时没上。"],
    ["背包产品图", "换装的第四个位置空着，因为没有背包的真图。"],
    ["尾巴分件", "摇尾需要能把尾巴单独转，现在尾巴和身体是同一张照片。"]
  ];
  $("#todo").innerHTML = TODO.map(([k, v]) =>
    `<div style="padding:9px 0;border-bottom:1px dashed var(--line)"><b>${k}</b>
      <p class="small mut" style="margin:2px 0 0">${v}</p></div>`).join("") +
    `<p class="small" style="margin-top:10px">提示词写在仓库 README 的「待补素材」一节，生成后放进对应目录、
      把 HTML 里的 <code>?v=</code> 加一就能上线。</p>`;
});
