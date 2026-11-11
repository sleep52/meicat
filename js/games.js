/* 游戏清单的唯一数据源（js/games.js）
 *
 * 大厅、首页推荐、每款游戏页的标题和结算文案都从这里取。
 * 只写一份，所以列表里不可能出现点进去 404 的死按钮；
 * 封面路径全部是 assets/covers/*.jpg，由真猫抠图在本地合成，不是另外拍的猫。
 */
window.CAT_GAMES = (() => {
  const G = [
    {
      id: "jump", name: "蓄力跳家具", href: "game/jump.html",
      sub: "按住蓄力，松手跳到真东西上",
      cover: "assets/covers/jump.jpg",
      how: "按住屏幕给猫蓄力，松手就往前跳。蓄得越久跳得越远，落进缝隙就摔一次；三条命，跳多远算多远。落在东西正中间算完美，连击有倍率。",
      mode: "lives", lives: 3, tags: ["蓄力", "落点判定", "连击倍率"]
    },
    {
      id: "laser", name: "追红点", href: "game/laser.html",
      sub: "把红点按住半秒才算追上",
      cover: "assets/covers/laser.jpg",
      how: "屏幕上会出现会跑的红点，用手指按住它。按住满半秒才算追上，红点会加速、会瞬移、会分裂。一局 60 秒。",
      mode: "time", dur: 60, tags: ["指针追踪", "按住判定", "轨迹升级"]
    },
    {
      id: "hide", name: "猫在哪里", href: "game/hide.html",
      sub: "听喵声偏哪边，翻开真东西找猫",
      cover: "assets/covers/hidecat.jpg",
      how: "猫藏在某件东西后面，每隔一会儿喵一声。戴耳机听她偏左耳还是右耳，屏幕上方也有一条方向指示（后几关会抖）。翻找次数有限，翻错就浪费一次。五关，东西越来越多、叫得越来越稀。",
      mode: "level", levels: 5, tags: ["听声辨位", "有限翻找", "五关卡"]
    },
    {
      id: "sneak", name: "偷吃木头人", href: "game/sneak.html",
      sub: "吸尘器转过来时，一动不动",
      cover: "assets/covers/sneak.jpg",
      how: "按住屏幕往前挪，去够桌上的零食盘。吸尘器会随机启动冲进过道——它开着的时候你还动着就被发现，抓到三次就结束。松手有惯性，最后一刻才停手照样算动。一局 60 秒。",
      mode: "time", dur: 60, tags: ["按住前进", "静止判定", "心理战"]
    },
    {
      id: "whack", name: "敲地鼠·零食版", href: "game/whack.html",
      sub: "冒出来的零食点走，别点到药",
      cover: "assets/covers/whack.jpg",
      how: "九宫格里会冒出真零食和真家务道具，点中零食加分，点中不该点的扣分并断连击。30 秒，越到后面冒得越快。",
      mode: "time", dur: 30, tags: ["反应", "连击", "误点惩罚"]
    },
    {
      id: "meow", name: "猫语翻译机", href: "game/meow.html",
      sub: "人话翻成喵语，也能反过来猜",
      cover: "assets/covers/meowtalk.jpg",
      how: "输入一句人话，按字数和声调确定性地翻成喵语，能真的发声；反过来还有猜意题，给你一句喵语猜她想干什么。做好的海报可以导出。",
      mode: "free", tags: ["确定性翻译", "发声", "海报导出"]
    }
  ];
  const byId = {};
  G.forEach(g => byId[g.id] = g);
  return { list: G, byId, cover: id => byId[id].cover };
})();
