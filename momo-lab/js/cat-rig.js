/* 真实猫布偶：分层 2D 角色（js/cat-rig.js）
 *
 * 素材是用户把自己家猫拆成的 6 张透明部件，按同一套参数装配：
 *   body 根层 → tail 挂在髋部 → head 压在颈缝上 → 五官贴片挂在 head 的局部坐标里
 * PARAMS 与离线对位得到的数值一致；每张贴片记的是「自己图上的地标 anchor」和
 * 「要落到的宿主坐标 at」，所以头旋转缩放时五官自动跟着走。
 * 命中检测用部件自己的 alpha 蒙版，摸到的是真剪影而不是矩形。
 */
window.CatRig = (() => {
  const STAGE_W = 480, STAGE_H = 560;
  const DIR = "assets/pets/realcat/";

  const P_BODY = { img: "body", size: [440, 528], anchor: [220, 516], at: [240, 520], s: .645 };
  const P_HEAD = { img: "head", size: [465, 528], anchor: [232, 520], at: [240, 276], s: .5 };
  const P_TAIL = { img: "tail", size: [385, 400], anchor: [45, 300], at: [318, 466], s: .44 };
  const P_FACE = {
    "eyes-open": { size: [336, 129], anchor: [168.9, 64], at: [232.4, 230.5], f: 1.085 },
    "eyes-closed": { size: [336, 148], anchor: [166.8, 92.9], at: [232.4, 243], f: 1.121 },
    "mouth-open": { size: [262, 336], anchor: [138.4, 37.9], at: [249.7, 286], f: 1.02 }
  };
  const NAMES = ["body", "head", "tail", "eyes-open", "eyes-closed", "mouth-open"];

  const imgs = {}, masks = {};
  let loading = null;

  /* ---------- 加载 + 命中蒙版（半分辨率，够用且省内存） ---------- */
  function alphaMask(name, size, step) {
    const w = Math.ceil(size[0] / step), h = Math.ceil(size[1] / step);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(imgs[name], 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 96 ? 1 : 0;
    return { w, h, step, m };
  }

  function load() {
    if (loading) return loading;
    loading = Promise.all(NAMES.map(n => ML.img(ML.asset(DIR + n + ".webp"))))
      .then(list => {
        NAMES.forEach((n, i) => { imgs[n] = list[i]; });
        try {
          masks.body = alphaMask("body", P_BODY.size, 2);
          masks.head = alphaMask("head", P_HEAD.size, 2);
          masks.tail = alphaMask("tail", P_TAIL.size, 2);
        } catch (e) {
          /* 画布被污染（file:// 直接打开）时只影响命中精度，不影响画面 */
          for (const k in masks) delete masks[k];
        }
        return API;
      });
    return loading;
  }

  /* ---------- 姿态 ---------- */
  function pose(o) {
    return Object.assign({
      x: 0, y: 0, scale: 1,        // 舞台整体位移/缩放
      breathe: 0,                  // -1..1 呼吸相位
      bodyRot: 0, bodySquash: 0,   // 身体倾斜 / 挤压（落地、扑、伸懒腰）
      headX: 0, headY: 0, headRot: 0, headSquash: 1,
      blink: 0, mouth: 0,          // 0..1 闭眼量 / 张嘴量
      tailRot: 0, tailWag: 0, tailPuff: 0,
      shadow: 1
    }, o || {});
  }

  /* 每帧先把三个部件的实际变换算好，draw 和 hit 共用 */
  function tf(P) {
    const br = 1 + .018 * P.breathe;
    return {
      body: {
        sx: P_BODY.s * (1 - .012 * P.breathe) * (1 + P.bodySquash * .1),
        sy: P_BODY.s * (1 - P.bodySquash * .12) * br,
        rot: P.bodyRot, dx: 0, dy: 0
      },
      tail: {
        sx: P_TAIL.s * (1 + P.tailPuff * .35),
        sy: P_TAIL.s * (1 + P.tailPuff * .35),
        rot: P.tailRot + P.tailWag, dx: 0, dy: 0
      },
      head: {
        sx: P_HEAD.s * P.headSquash,
        sy: P_HEAD.s * (2 - P.headSquash) * br,
        rot: P.headRot, dx: P.headX, dy: P.headY
      }
    };
  }

  function apply(x, part, t) {
    x.translate(part.at[0] + t.dx, part.at[1] + t.dy);
    if (t.rot) x.rotate(t.rot);
    x.scale(t.sx, t.sy);
    x.translate(-part.anchor[0], -part.anchor[1]);
  }

  function face(x, name, alpha) {
    const f = P_FACE[name];
    if (alpha !== undefined) x.globalAlpha = alpha;
    x.drawImage(imgs[name], f.at[0] - f.anchor[0], f.at[1] - f.anchor[1],
      f.size[0] * f.f, f.size[1] * f.f);
    if (alpha !== undefined) x.globalAlpha = 1;
  }

  function draw(x, P) {
    const T = tf(P);
    x.save();
    x.translate(STAGE_W / 2 + P.x, STAGE_H / 2 + P.y);
    x.scale(P.scale, P.scale);
    x.translate(-STAGE_W / 2, -STAGE_H / 2);

    x.save();
    x.globalAlpha = .28 * P.shadow;
    x.fillStyle = "#4a3a22";
    x.beginPath();
    x.ellipse(240, 518, 134 * P.shadow, 21, 0, 0, Math.PI * 2);
    x.fill();
    x.restore();

    x.save(); apply(x, P_BODY, T.body); x.drawImage(imgs.body, 0, 0, P_BODY.size[0], P_BODY.size[1]); x.restore();
    x.save(); apply(x, P_TAIL, T.tail); x.drawImage(imgs.tail, 0, 0, P_TAIL.size[0], P_TAIL.size[1]); x.restore();

    x.save();
    apply(x, P_HEAD, T.head);
    x.drawImage(imgs.head, 0, 0, P_HEAD.size[0], P_HEAD.size[1]);
    face(x, "eyes-open");
    if (P.blink > .01) face(x, "eyes-closed", P.blink);
    if (P.mouth > .01) face(x, "mouth-open", P.mouth);
    x.restore();

    x.restore();
  }

  /* ---------- 命中：画布坐标 -> 舞台坐标 -> 部件局部坐标 -> 查蒙版 ---------- */
  /* file:// 下画布被跨源图片污染，蒙版建不起来；退化成椭圆近似，页面照样能摸 */
  const ELLIPSE = {
    head: { at: [232, 264], rx: 224, ry: 256 },
    tail: { at: [192, 200], rx: 184, ry: 192 },
    body: { at: [220, 264], rx: 214, ry: 254 }
  };
  function toStage(P, wx, wy) {
    const s = P.scale;
    return [(wx - STAGE_W / 2 - P.x) / s + STAGE_W / 2, (wy - STAGE_H / 2 - P.y) / s + STAGE_H / 2];
  }
  function toLocal(part, t, px, py) {
    let x = px - (part.at[0] + t.dx), y = py - (part.at[1] + t.dy);
    if (t.rot) {
      const c = Math.cos(-t.rot), s = Math.sin(-t.rot);
      const nx = x * c - y * s, ny = x * s + y * c; x = nx; y = ny;
    }
    // apply() 是 at ← rot ← scale ← (-anchor)，反着走回图片坐标
    return [x / t.sx + part.anchor[0], y / t.sy + part.anchor[1]];
  }
  function inMask(name, lx, ly) {
    const mk = masks[name];
    const ix = Math.floor(lx / mk.step), iy = Math.floor(ly / mk.step);
    if (ix < 0 || iy < 0 || ix >= mk.w || iy >= mk.h) return false;
    return mk.m[iy * mk.w + ix] === 1;
  }
  function inEllipse(key, lx, ly) {
    const e = ELLIPSE[key];
    const u = (lx - e.at[0]) / e.rx, v = (ly - e.at[1]) / e.ry;
    return u * u + v * v <= 1;
  }
  const onPart = (name, key, lx, ly) => masks.head ? inMask(name, lx, ly) : inEllipse(key, lx, ly);

  function hit(P, wx, wy) {
    const T = tf(P);
    const [sx, sy] = toStage(P, wx, wy);
    let [lx, ly] = toLocal(P_HEAD, T.head, sx, sy);
    if (onPart("head", "head", lx, ly)) return "head";
    [lx, ly] = toLocal(P_TAIL, T.tail, sx, sy);
    if (onPart("tail", "tail", lx, ly)) return "tail";
    [lx, ly] = toLocal(P_BODY, T.body, sx, sy);
    if (!onPart("body", "body", lx, ly)) return null;
    return ly > 452 ? "paw" : "body";   // 身体图下半截是两只前爪
  }

  /* 某个部位在舞台上的近似中心，用来飘字和生成粒子 */
  const LOCAL = { head: [232, 250], body: [220, 250], paw: [220, 480], tail: [190, 210] };
  function center(P, which) {
    const T = tf(P);
    const part = which === "head" ? P_HEAD : which === "tail" ? P_TAIL : P_BODY;
    const t = T[which === "paw" ? "body" : which];
    const l = LOCAL[which];
    let x = (l[0] - part.anchor[0]) * t.sx, y = (l[1] - part.anchor[1]) * t.sy;
    if (t.rot) {
      const c = Math.cos(t.rot), s = Math.sin(t.rot);
      const nx = x * c - y * s, ny = x * s + y * c; x = nx; y = ny;
    }
    return [part.at[0] + t.dx + x, part.at[1] + t.dy + y];
  }

  const API = { STAGE_W, STAGE_H, P_BODY, P_HEAD, P_TAIL, P_FACE, imgs, masks, pose, load, draw, hit, center };
  return API;
})();
