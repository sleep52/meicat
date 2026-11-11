/* 游戏清单的唯一数据源。封面一律用真猫照片（assets/covers/*.jpg）：
 * 按 js/cat-rig.js 那套几何把 assets/pets/realcat/ 的分层照片当场合成，再叠真道具，
 * 所以列表里的猫和游戏里的猫是同一只。线稿猫和画出来的猫都已经下掉。 */
window.ML_GAMES = (() => {
  const cover = id => ({ img: "assets/covers/" + id + ".jpg" });
  return [
    { id: "jump", n: "蓄力跳家具", sub: "按住松手，落到真家伙上", href: "game/jump.html", rec: "jump", time: "60 秒", art: cover("jump"), tags: ["蓄力", "落点判定", "连击"] },
    { id: "sneak", n: "偷吃木头人", sub: "她转身时，一动不动", href: "game/sneak.html", rec: "sneak", time: "60 秒", art: cover("sneak"), tags: ["反应", "静止判定", "心理战"] },
    { id: "dressup", n: "真猫换装室", sub: "6 件真图衣裳，导出成品图", href: "game/dressup.html", rec: null, time: "自由玩", art: cover("dressup"), tags: ["创作", "PNG 导出", "收藏"] },
    { id: "kitten", n: "我家猫", sub: "真实猫部件装配，能摸能逗", href: "game/kitten.html", rec: null, time: "自由玩", art: cover("kitten"), tags: ["分层布偶", "分区触摸", "养成"] },
    { id: "laser", n: "追红点", sub: "按住半秒才算追上", href: "game/laser.html", rec: "laser", time: "60 秒", art: cover("laser"), tags: ["指针追踪", "连击窗口", "轨迹升级"] },
    { id: "hidecat", n: "猫在哪里", sub: "循着喵声挪开真东西", href: "game/hidecat.html", rec: "hidecat", time: "45 秒/关", art: cover("hidecat"), tags: ["听声辨位", "有限翻找", "五关卡"] },
    { id: "slingshot", n: "弹弓喂猫", sub: "拉开皮兜，等它张嘴", href: "game/slingshot.html", rec: "slingshot", time: "60 秒", art: cover("slingshot"), tags: ["弹道拖拽", "时机判定", "拆家值"] },
    { id: "parkour", n: "跑酷大扫除", sub: "跳越或低头钻开家务杂物", href: "game/parkour.html", rec: "parkour", time: "能跑多远", art: cover("parkour"), tags: ["横版跑酷", "跳/钻双键", "三格血"] },
    { id: "static", n: "静电吸毛", sub: "袜子搓满电，抬起来吸，甩手抖落", href: "game/static.html", rec: "static", time: "60 秒", art: cover("static"), tags: ["摩擦充能", "吸附半径", "甩袜手势"] },
    { id: "meowtalk", n: "猫语翻译机", sub: "人话翻成喵语，也能猜", href: "game/meowtalk.html", rec: "meowtalk", time: "自由玩", art: cover("meowtalk"), tags: ["确定性翻译", "猜意题库", "海报导出"] },
    { id: "meme", n: "表情包制造机", sub: "照片 + 文案 + 贴纸", href: "game/meme-maker.html", rec: null, time: "自由玩", art: cover("meme"), tags: ["图片创作", "PNG 导出"] },
    { id: "escape", n: "紧急撤离", sub: "主人 45 秒后到家", href: "game/escape.html", rec: "escape", time: "45 秒", art: cover("escape"), tags: ["限时操作", "随机事件"] },
    { id: "chaos", n: "混乱现场", sub: "越乱越好的 30 秒", href: "game/chaos.html", rec: "chaos", time: "30 秒", art: cover("chaos"), tags: ["自由操作", "连锁反应"] },
    { id: "boss", n: "谁是老板", sub: "家庭地位争夺战", href: "game/boss.html", rec: "boss", time: "4 个场景", art: cover("boss"), tags: ["剧情选择", "多结局"] },
    { id: "snack", n: "零食危机", sub: "接住奖励，躲开砸下来的", href: "game/snack-panic.html", rec: "snack", time: "45 秒", art: cover("snack"), tags: ["反应挑战", "收集"] },
    { id: "world", n: "宠物世界", sub: "实时渲染、能上手摸的角色", href: "game/pet-world.html", rec: null, time: "自由玩", art: cover("world"), tags: ["实时渲染", "点击互动"] },
    { id: "mbti", n: "猫咪精神状态测试", sub: "生成可分享的结果卡", href: "../mbti.html", rec: null, time: "2 分钟", art: cover("mbti"), tags: ["测试", "分享卡"] },
  ];
})();
