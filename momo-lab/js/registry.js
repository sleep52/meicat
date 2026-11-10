window.ML_GAMES = (() => {
  const S = b => `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
  const CAT = (x, y, s, rot = "") => `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rot})"><ellipse cx="0" cy="6" rx="17" ry="12" fill="#E8A857"/><circle cx="-14" cy="-4" r="10" fill="#E8A857"/><path d="M-21 -11l-1-8 7 4zM-9 -12l2-8 5 6z" fill="#E8A857"/><circle cx="-17" cy="-5" r="1.6" fill="#222" stroke="none"/><path d="M15 2c8-4 10-12 6-16" /><path d="M-9 6l1 10M-1 8l1 9M8 6l1 10" stroke-width="2.5"/></g>`;
  const SVG = {
    jump: S(`<rect x="4" y="58" width="30" height="24" rx="4" fill="#DCD2F5"/><rect x="74" y="40" width="40" height="42" rx="4" fill="#BFE4D0"/><path d="M20 50c14-26 44-32 62-8" stroke-dasharray="4 7"/><path d="M0 82h120" stroke-width="4"/>${CAT(48, 26, .78, -12)}`),
    sneak: S(`<ellipse cx="24" cy="70" rx="20" ry="10" fill="#F5E66B"/><path d="M8 62c8-6 24-6 32 0" stroke-width="2.5"/>${CAT(56, 52, .7, 0)}<circle cx="96" cy="30" r="18" fill="#fff"/><circle cx="96" cy="30" r="7" fill="#222" stroke="none"/><path d="M84 14l-6-6M108 14l6-6M96 10v-8" stroke-width="2.5"/>`),
    dressup: S(`<circle cx="60" cy="38" r="24" fill="#E8A857"/><path d="M42 20l-4-16 15 8zM78 20l4-16-15 8z" fill="#E8A857"/><circle cx="51" cy="36" r="2.6" fill="#222" stroke="none"/><circle cx="69" cy="36" r="2.6" fill="#222" stroke="none"/><path d="M60 44l-4 3 4 3 4-3z" fill="#fff"/><path d="M48 58l12 10 12-10z" fill="#F16D5B"/><circle cx="60" cy="60" r="4" fill="#F5E66B"/><path d="M36 66l6 18M84 66l-6 18"/>`),
    meme: S(`<path d="M14 12h92v48H64l-16 16v-16H14z" fill="#fff"/><circle cx="44" cy="30" r="3" fill="#222" stroke="none"/><circle cx="76" cy="30" r="3" fill="#222" stroke="none"/><path d="M52 44c6 5 12 5 18 0" stroke-width="2.5"/><path d="M28 22l4-8 4 8M86 22l4-8 4 8" stroke-width="2.5"/>`),
    pet: S(`<ellipse cx="60" cy="60" rx="30" ry="24" fill="#E8A857"/><circle cx="60" cy="32" r="21" fill="#E8A857"/><path d="M44 18l-4-14 14 7zM76 18l4-14-14 7z" fill="#E8A857"/><circle cx="52" cy="30" r="2.6" fill="#222" stroke="none"/><circle cx="68" cy="30" r="2.6" fill="#222" stroke="none"/><path d="M88 66c12-4 14-18 8-24" /><path d="M30 74l-8 10M90 74l8 10" stroke-width="2.5"/>`),
    quiz: S(`<circle cx="60" cy="45" r="30" fill="#F5E66B"/><text x="60" y="58" text-anchor="middle" font-family="Arial" font-size="36" font-weight="900" fill="#222" stroke="none">?</text><path d="M18 20l6-8M102 20l-6-8"/>`),
  };
  window.ML_GAME_ART = SVG;
  return [
    { id: "jump", n: "蓄力跳家具", sub: "按住松手，跳到该跳的地方", href: "game/jump.html", rec: "jump", time: "60 秒", art: { svg: "jump" }, tags: ["蓄力", "落点判定", "连击"] },
    { id: "sneak", n: "偷吃木头人", sub: "她转身时，一动不动", href: "game/sneak.html", rec: "sneak", time: "60 秒", art: { svg: "sneak" }, tags: ["反应", "静止判定", "心理战"] },
    { id: "dressup", n: "MOMO 换装室", sub: "给它戴帽子，导出成品图", href: "game/dressup.html", rec: null, time: "自由玩", art: { svg: "dressup" }, tags: ["创作", "PNG 导出", "收藏"] },
    { id: "meme", n: "表情包制造机", sub: "照片 + 文案 + 贴纸", href: "game/meme-maker.html", rec: null, time: "自由玩", art: { img: "assets/games/meme-cover.png" }, tags: ["图片创作", "PNG 导出"] },
    { id: "escape", n: "紧急撤离", sub: "主人 45 秒后到家", href: "game/escape.html", rec: "escape", time: "45 秒", art: { img: "assets/games/escape-cover.png" }, tags: ["限时操作", "随机事件"] },
    { id: "chaos", n: "混乱现场", sub: "越乱越好的 30 秒", href: "game/chaos.html", rec: "chaos", time: "30 秒", art: { img: "assets/games/chaos-cover.png" }, tags: ["自由操作", "连锁反应"] },
    { id: "boss", n: "谁是老板", sub: "家庭地位争夺战", href: "game/boss.html", rec: "boss", time: "4 个场景", art: { img: "assets/games/boss-cover.png" }, tags: ["剧情选择", "多结局"] },
    { id: "snack", n: "零食危机", sub: "接住奖励，躲开黄瓜", href: "game/snack-panic.html", rec: "snack", time: "45 秒", art: { img: "assets/games/snack-cover.png" }, tags: ["反应挑战", "收集"] },
    { id: "world", n: "宠物世界", sub: "实时渲染、能上手摸的角色", href: "game/pet-world.html", rec: null, time: "自由玩", art: { svg: "pet" }, tags: ["实时渲染", "点击互动"] },
    { id: "mbti", n: "猫咪精神状态测试", sub: "生成可分享的结果卡", href: "../mbti.html", rec: null, time: "2 分钟", art: { svg: "quiz" }, tags: ["测试", "分享卡"] },
  ];
})();
