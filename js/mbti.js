(() => {
  const QUESTIONS = [
    { text: "周末到了，你更想？", a: { text: "出去浪！找朋友玩", dim: "EI", val: "E" }, b: { text: "窝在家里发呆", dim: "EI", val: "I" } },
    { text: "家里来了陌生人，你会？", a: { text: "主动凑过去打招呼", dim: "EI", val: "E" }, b: { text: "躲起来暗中观察", dim: "EI", val: "I" } },
    { text: "你的充电方式是？", a: { text: "和朋友嗨一嗨", dim: "EI", val: "E" }, b: { text: "独处安静待着", dim: "EI", val: "I" } },

    { text: "看到一个新盒子，第一反应？", a: { text: "看看能不能钻进去", dim: "SN", val: "S" }, b: { text: "想象里面装着什么宝藏", dim: "SN", val: "N" } },
    { text: "吃饭时你更关注？", a: { text: "味道好不好吃", dim: "SN", val: "S" }, b: { text: "摆盘好不好看", dim: "SN", val: "N" } },
    { text: "你更相信？", a: { text: "亲眼看到的事实", dim: "SN", val: "S" }, b: { text: "说不清的第六感", dim: "SN", val: "N" } },

    { text: "朋友难过了，你会？", a: { text: "帮他想解决方案", dim: "TF", val: "T" }, b: { text: "先蹭蹭安慰他", dim: "TF", val: "F" } },
    { text: "做决定你更靠？", a: { text: "理性分析利弊", dim: "TF", val: "T" }, b: { text: "跟着感觉走", dim: "TF", val: "F" } },
    { text: "被铲屎官批评了，你会？", a: { text: "想想他说得对不对", dim: "TF", val: "T" }, b: { text: "先委屈一下再说", dim: "TF", val: "F" } },

    { text: "旅行风格？", a: { text: "提前做好攻略", dim: "JP", val: "J" }, b: { text: "走到哪算哪", dim: "JP", val: "P" } },
    { text: "你的猫窝整洁度？", a: { text: "整整齐齐一尘不染", dim: "JP", val: "J" }, b: { text: "乱中有序自成一派", dim: "JP", val: "P" } },
    { text: "面对逗猫棒，你会？", a: { text: "规划好路线再出击", dim: "JP", val: "J" }, b: { text: "随缘扑腾看心情", dim: "JP", val: "P" } },
  ];

  const TYPES = {
    INTJ: { img: "green",     title: "策略猫",   desc: "你是猫界的幕后军师。独处时你在思考猫生哲学，偶尔用绿光震慑不服从的铲屎官。你的计划完美无缺，只是有时候懒得执行。" },
    INTP: { img: "eleme",     title: "学者猫",   desc: "你是猫界的爱因斯坦。对一切充满好奇，尤其是那个会发出响声的鼠标。你活在自己的思维宇宙里，偶尔点份外卖补充能量。" },
    ENTJ: { img: "seal",      title: "指挥官猫", desc: "你是天生的领导者，指挥铲屎官如臂使指。你端坐如海豹，气场全开。你的猫生信条：要么按我的方式来，要么我自己来。" },
    ENTP: { img: "hashbrown", title: "辩论猫",   desc: "你是猫界的杠把子，什么都要反驳两句。你裹在脆薯饼里，脑子里全是新点子和恶作剧。无聊是你最大的敌人。" },
    INFJ: { img: "lipstick",  title: "预言猫",   desc: "你是猫界的神秘主义者，涂着红唇洞察一切。你能读懂铲屎官的情绪，却始终保持自己的节奏。你的内心是一个深邃的宇宙。" },
    INFP: { img: "sleep",     title: "治愈猫",   desc: "你是猫界的诗人，窝在被子里梦想环游世界。你温柔敏感，一个轻轻的摸头就能让你开心一整天。你的内心戏比电视剧还精彩。" },
    ENFJ: { img: "sit",       title: "主角猫",   desc: "你是猫界的社交达人，端坐C位光芒四射。你关心每一只猫的情绪，是猫群的灵魂人物。你的热情能融化最冷的铲屎官。" },
    ENFP: { img: "bunny",     title: "探险猫",   desc: "你是猫界的冒险家，戴着兔耳闯天下。每一天都是新的探险，每一个盒子都要钻一钻。你的快乐感染力让所有猫都想跟你玩。" },
    ISTJ: { img: "worker",    title: "检查猫",   desc: "你是猫界的模范员工，戴着工牌一丝不苟。你准时吃饭、准时巡逻、准时撒娇，一切都井井有条。铲屎官有你，三生有幸。" },
    ISFJ: { img: "flat",      title: "守护猫",   desc: "你是猫界的守护者，虽然一脸无语但默默关心所有人。你记住每只猫的喜好，在关键时刻送上温暖的蹭蹭。你的爱，安静但深沉。" },
    ESTJ: { img: "wide",      title: "管理猫",   desc: "你是猫界的管理者，瞪大眼睛监督一切。你确保猫粮按时发放、猫砂盆保持清洁。你的座右铭：没有规矩，不成方圆。" },
    ESFJ: { img: "dress",     title: "社交猫",   desc: "你是猫界的交际花，每天换装出席不同场合。你记得每只猫的生日，组织最多的猫聚会。你的温暖让整个猫群都围绕着你。" },
    ISTP: { img: "melon",     title: "工匠猫",   desc: "你是猫界的独行侠，抱着哈密瓜享受独处时光。你善于观察，动手能力强，能打开任何一扇门。你不喜欢被束缚，自由最重要。" },
    ISFP: { img: "pepper",    title: "艺术家猫", desc: "你是猫界的艺术家，在辣椒红与阳光之间寻找灵感。你随性而活，用爪子在沙发上创作抽象画。你的美，不需要被理解。" },
    ESTP: { img: "rabbitcat", title: "行动猫",   desc: "你是猫界的行动派，化身兔子极速出击。想到就做，从不犹豫。你是追逐激光笔的冠军，也是从桌上推杯子的第一猫。" },
    ESFP: { img: "baggif",    title: "表演猫",   desc: "你是猫界的超级明星，每个动作都是表演。你享受被关注的每一秒，撒娇、翻肚皮、打呼噜，都是你的拿手好戏。猫生就是一场秀！" },
  };

  const DIM_NAMES = { EI: "外向 · 内向", SN: "实感 · 直觉", TF: "思考 · 情感", JP: "判断 · 感知" };
  const OPT_ICONS = { E: "🐾", I: "🌙", S: "📦", N: "✨", T: "🧠", F: "💛", J: "📋", P: "🎲" };

  const DIM_COLORS = {
    EI: "#ff9f43",
    SN: "#54a0ff",
    TF: "#ff6b6b",
    JP: "#a78bfa",
  };

  const el = (id) => document.getElementById(id);
  let cur = 0;
  const answers = [];

  function showQuestion(idx) {
    const q = QUESTIONS[idx];
    el("qText").textContent = q.text;
    el("qDim").textContent = DIM_NAMES[q.dim];
    el("progressFill").style.width = `${((idx) / QUESTIONS.length) * 100}%`;
    el("progressText").textContent = `${idx + 1} / ${QUESTIONS.length}`;

    const opts = el("qOptions");
    opts.innerHTML = "";

    const shuffled = Math.random() < 0.5 ? [q.a, q.b] : [q.b, q.a];

    shuffled.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "q-opt";
      btn.innerHTML = `<span class="opt-icon">${OPT_ICONS[opt.val]}</span><span>${opt.text}</span>`;
      btn.addEventListener("click", () => {
        opts.querySelectorAll(".q-opt").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        MemeAudio.point();
        setTimeout(() => {
          answers.push({ dim: opt.dim, val: opt.val });
          cur++;
          if (cur < QUESTIONS.length) {
            showQuestion(cur);
          } else {
            showResult();
          }
        }, 350);
      });
      opts.appendChild(btn);
    });

    const card = el("qCard");
    card.style.animation = "none";
    card.offsetHeight;
    card.style.animation = "cardIn 0.35s cubic-bezier(.4,0,.2,1)";
  }

  function calcType() {
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    const dimScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
    const dimMap = { E: "EI", I: "EI", S: "SN", N: "SN", T: "TF", F: "TF", J: "JP", P: "JP" };

    for (const a of answers) {
      counts[a.val]++;
      dimScores[dimMap[a.val]] += (a.val === dimMap[a.val][0]) ? 1 : -1;
    }

    const type =
      (counts.E >= counts.I ? "E" : "I") +
      (counts.S >= counts.N ? "S" : "N") +
      (counts.T >= counts.F ? "T" : "F") +
      (counts.J >= counts.P ? "J" : "P");

    const pcts = {};
    for (const [dim, score] of Object.entries(dimScores)) {
      const total = 3;
      const raw = (score + total) / (total * 2);
      pcts[dim] = Math.round(Math.max(0.1, Math.min(0.9, raw)) * 100);
    }

    return { type, pcts };
  }

  function showResult() {
    const { type, pcts } = calcType();
    const info = TYPES[type];

    el("progressFill").style.width = "100%";

    const dimEntries = Object.entries(DIM_COLORS).map(([dim, color]) => {
      const pct = pcts[dim];
      const isLeft = pct >= 50;
      const leftPct = isLeft ? pct : 100 - pct;
      const names = DIM_NAMES[dim].split(" · ");
      return `
        <div class="dim-bar">
          <div class="dim-label">${names[0]} / ${names[1]}</div>
          <div class="dim-val" style="color:${color}">${isLeft ? names[0] : names[1]} ${leftPct}%</div>
          <div class="dim-track"><div class="dim-fill" style="width:${leftPct}%;background:${color}"></div></div>
        </div>`;
    }).join("");

    el("resultScreen").innerHTML = `
      <img class="result-avatar" src="assets/${info.img}_s.jpg" alt="${info.title}">
      <div class="result-badge">你的猫咪人格</div>
      <p class="result-type">${type}</p>
      <p class="result-title">${info.title}</p>
      <div class="result-dims">${dimEntries}</div>
      <div class="result-desc">${info.desc}</div>
      <div class="result-btns">
        <button class="btn" id="retryBtn">重新测试</button>
        <button class="btn ghost" id="shareBtn">复制结果</button>
      </div>
    `;

    el("startScreen").classList.add("hidden");
    el("quizScreen").classList.add("hidden");
    el("resultScreen").classList.remove("hidden");

    el("retryBtn").addEventListener("click", resetQuiz);
    el("shareBtn").addEventListener("click", () => {
      const text = `我的猫咪MBTI是 ${type}（${info.title}）！${info.desc}`;
      navigator.clipboard.writeText(text).then(() => {
        el("shareBtn").textContent = "已复制！";
        setTimeout(() => { el("shareBtn").textContent = "复制结果"; }, 2000);
      }).catch(() => {
        el("shareBtn").textContent = "复制失败";
        setTimeout(() => { el("shareBtn").textContent = "复制结果"; }, 2000);
      });
    });

    MemeAudio.match();
  }

  function resetQuiz() {
    cur = 0;
    answers.length = 0;
    el("resultScreen").classList.add("hidden");
    el("startScreen").classList.remove("hidden");
  }

  el("startBtn").addEventListener("click", () => {
    el("startScreen").classList.add("hidden");
    el("quizScreen").classList.remove("hidden");
    showQuestion(0);
  });
})();
