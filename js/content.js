/* 文案与素材清单（js/content.js）
 *
 * 这里的每一条 caption 都是对着 assets/ 里的真图看过的，不是按文件名猜的。
 * 只有实拍照片和实拍抠图会出现在这份表里——AI 画的猫（assets/pets/pet001/、
 * assets/hero/、assets/games/ 里的 box-cat / pot-cat、assets/effects/、
 * assets/custom/、根目录那批 pet-*.png 卡通猫）一律不引用：
 * 站里的猫必须是真的那只。文件还在素材里没删，只是不上线。
 */
/* 真道具素材表：全部是 assets/props/ 下的实拍抠图，有透明通道，可以直接叠在猫身上。
 * 六款游戏和表情包制造机共用这一份，避免每个页面各写一遍路径。 */
window.CAT_PROPS = (() => {
  const P = {
    ball: "assets/props/snack-ball.png",
    cookie: "assets/props/snack-cookie.png",
    dropball: "assets/props/snack-dropball.png",
    fish: "assets/props/snack-fish.png",
    kibble: "assets/props/snack-kibble.png",
    platter: "assets/props/snack-platter.png",
    strips: "assets/props/snack-strips.png",
    toyfish: "assets/props/snack-toyfish.png",
    gift: "assets/props/prop-gift.png",
    pillow: "assets/props/prop-pillow.png",
    socks: "assets/props/prop-socks.png",
    trashbin: "assets/props/prop-trashbin.png",
    detergent: "assets/props/prop-detergent.png",
    broom: "assets/props/prop-broom.png",
    vacuum: "assets/props/prop-vacuum.png",
    hairdryer: "assets/props/prop-hairdryer.png"
  };
  /* 好=能吃的，坏=不该碰的（whack / sneak 用同一套判定） */
  const GOOD = ["ball", "cookie", "kibble", "platter", "strips", "toyfish", "fish", "dropball"];
  const BAD = ["broom", "detergent", "trashbin", "vacuum", "hairdryer", "pillow", "gift", "socks"];
  const name = {
    ball: "毛线球", cookie: "小饼干", dropball: "弹力球", fish: "小鱼干",
    kibble: "猫粮", platter: "零食盘", strips: "鸡肉条", toyfish: "玩具鱼",
    gift: "礼物盒", pillow: "抱枕", socks: "袜子", trashbin: "垃圾桶",
    detergent: "洗衣液", broom: "扫把", vacuum: "吸尘器", hairdryer: "吹风机"
  };
  return { P, GOOD, BAD, name, path: k => P[k] };
})();

window.CAT_CONTENT = (() => {
  const R = "assets/";
  /* 21 张真猫表情原片：相册与表情包制造机的底图 */
  const PHOTOS = [
    { f: R + "rabbitcat.jpg", t: "证件照", cap: "正脸坐姿·抠图原片", w: 415, h: 472 },
    { f: R + "meijiejie.jpg", t: "怼脸", cap: "眉姐姐本姐，瞳孔全开怼镜头", w: 337, h: 337 },
    { f: R + "flat.jpg", t: "怼脸", cap: "怼脸平视，一脸无语", w: 332, h: 332 },
    { f: R + "wide.jpg", t: "惊讶", cap: "瞳孔地震", w: 337, h: 337 },
    { f: R + "sit.jpg", t: "日常", cap: "户外端坐，太阳底下眯着", w: 180, h: 180 },
    { f: R + "sleep.jpg", t: "睡觉", cap: "埋进被窝，只留一张脸", w: 480, h: 455 },
    { f: R + "touch.jpg", t: "互动", cap: "被伸手摸脸，忍了", w: 240, h: 240 },
    { f: R + "hand.jpg", t: "互动", cap: "两只前爪被人握住", w: 469, h: 469 },
    { f: R + "baggif.jpg", t: "外卖", cap: "装在麦当劳脆薯饼袋里", w: 240, h: 240 },
    { f: R + "hashbrown.jpg", t: "外卖", cap: "脆薯饼本饼，袋子还印着 logo", w: 470, h: 471 },
    { f: R + "eleme.jpg", t: "上班", cap: "蓝色外卖头盔，准备出发", w: 479, h: 479 },
    { f: R + "worker.jpg", t: "上班", cap: "戴工牌上班，头顶白帽", w: 480, h: 480 },
    { f: R + "morning.jpg", t: "早晨", cap: "穿着纸尿裤说一句 good morning", w: 480, h: 480 },
    { f: R + "dress.jpg", t: "穿搭", cap: "碎花小披肩，粉色滚边", w: 480, h: 480 },
    { f: R + "lashes.jpg", t: "美妆", cap: "贴了假睫毛，眼线也画了", w: 394, h: 480 },
    { f: R + "lipstick.jpg", t: "美妆", cap: "白毛巾包头，涂了口红", w: 480, h: 480 },
    { f: R + "bunny.jpg", t: "变身", cap: "加了兔耳朵滤镜", w: 399, h: 480 },
    { f: R + "pepper.jpg", t: "变身", cap: "套了个黄灯笼椒头套", w: 472, h: 461 },
    { f: R + "melon.jpg", t: "拆家", cap: "半个蜜瓜扣在头上，地上还剩一半", w: 480, h: 480 },
    { f: R + "seal.jpg", t: "变身", cap: "身体被换成海豹，脸还是那张脸", w: 480, h: 480 },
    { f: R + "green.jpg", t: "滤镜", cap: "绿幕本幕，P 图都省了", w: 240, h: 240 }
  ];

  /* 表情包制造机的贴纸：只用 assets/props/ 里带透明通道的实拍抠图 */
  const STICKERS = [
    { k: "cookie", n: "小饼干" }, { k: "kibble", n: "猫粮" }, { k: "platter", n: "零食盘" },
    { k: "strips", n: "鸡肉条" }, { k: "fish", n: "小鱼干" }, { k: "toyfish", n: "玩具鱼" },
    { k: "ball", n: "毛线球" }, { k: "dropball", n: "弹力球" },
    { k: "gift", n: "礼物盒" }, { k: "pillow", n: "抱枕" }, { k: "socks", n: "袜子" },
    { k: "broom", n: "扫把" }, { k: "vacuum", n: "吸尘器" }, { k: "detergent", n: "洗衣液" },
    { k: "trashbin", n: "垃圾桶" }, { k: "hairdryer", n: "吹风机" }
  ];

  /* 表情包默认文案：按照片分类给，避免每张都要从零想词 */
  const CAPS = {
    证件照: ["本喵", "在吗", "说", "我看着呢"],
    怼脸: ["我真的会谢", "你最好有事", "哦？", "再说一遍"],
    惊讶: ["？？？", "瞳孔地震", "什么", "我没听错吧"],
    日常: ["晒太阳", "无事发生", "今天也还行", "别吵"],
    睡觉: ["已离线", "再睡五分钟", "装睡中", "勿扰"],
    互动: ["被摸了", "手拿走", "勉强让你摸", "手感好吗"],
    外卖: ["饭呢", "到点了", "我的脆薯饼", "超时了知道吗"],
    上班: ["打工猫", "在班", "别找我", "已读不回"],
    早晨: ["good morning", "早起毁一天", "还没醒", "先喂再说话"],
    穿搭: ["今日穿搭", "好看吧", "新衣服", "夸"],
    美妆: ["化了妆的", "睫毛还行", "口红不错", "美不美"],
    变身: ["我不是猫", "我是兔子", "我是甜椒", "认不出来吧"],
    拆家: ["不是我干的", "蜜瓜自己掉的", "意外", "与我无关"],
    滤镜: ["绿幕状态", "后期一下", "扣个背景", "特效中"]
  };

  /* 猫语翻译机：确定性翻译，同一句话永远翻成同一串喵 */
  const MEOW = {
    /* 音节表按声调选：一声长喵，二声上扬，三声先降后升，四声短促 */
    tone: ["mā", "má", "mǎ", "mà"],
    tail: ["——", "!", "?", "…", "。", "~"],
    /* 常见意图：命中词库就换整句，否则按字切音节 */
    intent: [
      { keys: ["吃", "饭", "零食", "饿", "罐"], meow: "嗷呜——嗷呜喵！", say: "饿了，现在就要。" },
      { keys: ["摸", "抱", "撸"], meow: "咕噜噜……喵。", say: "可以摸，但仅限三下。" },
      { keys: ["睡", "困", "觉"], meow: "喵呜——（拉长）", say: "睡了，别叫我。" },
      { keys: ["开", "门", "进", "出"], meow: "喵！喵！喵嗷！", say: "门，立刻，打开。" },
      { keys: ["洗澡", "水", "吹"], meow: "嗷呜呜呜——！！", say: "反对你，强烈反对。" },
      { keys: ["工作", "上班", "加班", "老板"], meow: "喵（平）……喵（更平）", say: "同情你，但与我无关。" },
      { keys: ["喜欢", "爱", "乖", "宝贝"], meow: "咪——咕噜。", say: "听见了，勉强承认。" },
      { keys: ["陪", "玩", "球", "逗"], meow: "喵呜？喵呜！", say: "玩可以，你负责累。" },
      { keys: ["药", "医院", "针"], meow: "哈————！", say: "此事没有商量。" },
      { keys: ["几点", "时间", "晚", "早"], meow: "喵～喵～", say: "对我来说只有「现在」和「不是现在」。" }
    ],
    /* 猜意题：给一串喵语，猜她想干什么 */
    quiz: [
      { q: "嗷呜——嗷呜喵！", a: ["要吃的", "想出门", "夸我", "我饿了"], right: 0, why: "两声短促加一声拉长，是催饭的标准句式。" },
      { q: "哈————！", a: ["生气警告", "打招呼", "做噩梦", "饿了"], right: 0, why: "长哈气不带转折，是明确的「退后」。" },
      { q: "咕噜噜……喵。", a: ["允许摸但限三下", "疼", "看见鸟", "无聊"], right: 0, why: "咕噜在前、短喵收尾，是「勉强同意」。" },
      { q: "喵！喵！喵嗷！", a: ["三连催：开门", "要玩具", "认错猫", "困了"], right: 0, why: "同一音节重复且一次比一次短，是催促升级。" },
      { q: "喵（平）……喵（更平）", a: ["同情你但与我无关", "极度兴奋", "身体不舒服", "想洗澡"], right: 0, why: "音调一路走低，是本喵对上班的标准回应。" },
      { q: "咪——咕噜。", a: ["承认喜欢", "警告", "要水", "找妈妈"], right: 0, why: "细「咪」接咕噜，是少见的软化语气。" }
    ]
  };

  /* 首页/角色页的碎碎念 */
  const LINES = [
    "本喵今天也在。", "零食放高处是没用的。", "你手机比我好看？",
    "三点钟是我固定的拆家时间。", "摸头可以，摸尾巴不行。", "我已经三天没上秤了，别问。",
    "键盘是我的床。", "叫我是因为你有事求我。", "纸箱比猫窝贵。"
  ];

  const FACTS = [
    { k: "品种", v: "金渐层英国短毛" },
    { k: "日常", v: "吃、睡、拆、装无辜" },
    { k: "巅峰时间", v: "凌晨三点" },
    { k: "弱点", v: "罐头开盖声" },
    { k: "职业", v: "家庭一级拆迁户" }
  ];

  return { R, PHOTOS, STICKERS, CAPS, MEOW, LINES, FACTS };
})();
