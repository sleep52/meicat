/* 真猫布偶：单张实拍抠图 + 整体形变（js/cat-rig.js）
 *
 * 之前这版角色是 6 层 AI 画的猫，不是你家猫。现在 body 是 D:/cat/images/17.jpg
 * 的实拍抠图（390×472 透明 PNG）：一只真猫、一个剪影，所以只保留能对整张照片
 * 做得真的形变——呼吸、落地挤压、倾斜、跳动。
 * P_HEAD / P_TAIL 不再是独立图片，只是指向同一张照片的坐标别名，让换装、找猫
 * 这类「按部位摆东西」的代码还能共用同一套 apply() 数学。
 * blink / mouth / tailPuff 要额外的实拍素材才做得真，现在是空操作。
 */
window.CatRig = (() => {
  const STAGE_W = 480, STAGE_H = 560;
  const DIR = "assets/pets/realcat/";

  const SPRITE = { img: "body", size: [390, 472], anchor: [195, 472], at: [240, 520], s: .88 };
  const P_BODY = SPRITE;
  /* 别名：anchor 是照片里的部位点，at 是它在舞台上的落点。
   * 因为 at = TOP + anchor*s（TOP = 照片顶边在舞台上的 y = 520-472*.88 = 105），
   * 走 apply() 算出来的变换和 body 逐像素相同，叠画不会重影。 */
  const P_HEAD = { img: "body", size: SPRITE.size, anchor: [195, 150], at: [240, 237], s: SPRITE.s };
  const P_TAIL = { img: "body", size: SPRITE.size, anchor: [195, 400], at: [240, 457], s: SPRITE.s };
  /* 外部只读 at[1]（眼线在舞台上的高度）。五官贴片没有真图，一律不画。
   * 数值是量出来的：照片里两眼之间在 (225,188)，嘴在 (225,255)。 */
  const P_FACE = {
    "eyes-open": { size: [1, 1], anchor: [0, 0], at: [266, 270], f: 1 },
    "eyes-closed": { size: [1, 1], anchor: [0, 0], at: [266, 270], f: 1 },
    "mouth-open": { size: [1, 1], anchor: [0, 0], at: [266, 328], f: 1 }
  };

  const imgs = {}, masks = {};
  let loading = null;

  /* ---------- 加载 + 命中蒙版（半分辨率，够用且省内存） ---------- */
  function alphaMask(size, step) {
    const w = Math.ceil(size[0] / step), h = Math.ceil(size[1] / step);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(imgs.body, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 96 ? 1 : 0;
    return { w, h, step, m };
  }

  function load() {
    if (loading) return loading;
    loading = ML.img(ML.asset(DIR + "body.webp")).then(im => {
      imgs.body = im; imgs.head = im; imgs.tail = im;
      try {
        const m = alphaMask(SPRITE.size, 2);
        masks.body = masks.head = masks.tail = m;
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
      bodyRot: 0, bodySquash: 0,   // 倾斜 / 挤压（落地、扑、伸懒腰）
      headX: 0, headY: 0, headRot: 0, headSquash: 1,
      blink: 0, mouth: 0,          // 没有闭眼/张嘴真图，参数留着但不作用
      tailRot: 0, tailWag: 0, tailPuff: 0,
      shadow: 1
    }, o || {});
  }

  /* 一张照片只有一个变换：头的转动和位移当成整只猫倾身。
   * 三个键返回同一个对象，外部按哪个部位取都是同一套数学。 */
  function tf(P) {
    const br = 1 + .018 * P.breathe;
    const t = {
      sx: SPRITE.s * (1 - .012 * P.breathe) * (1 + P.bodySquash * .1) * (1 + (P.headSquash - 1) * .05),
      sy: SPRITE.s * (1 - P.bodySquash * .12) * br * (1 - (P.headSquash - 1) * .05),
      rot: P.bodyRot + P.headRot * .35 + P.tailWag * .02,
      dx: P.headX * .35, dy: P.headY * .35
    };
    return { body: t, head: t, tail: t };
  }

  function apply(x, part, t) {
    x.translate(part.at[0] + t.dx, part.at[1] + t.dy);
    if (t.rot) x.rotate(t.rot);
    x.scale(t.sx, t.sy);
    x.translate(-part.anchor[0], -part.anchor[1]);
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
    x.ellipse(240, 518, 150 * P.shadow, 20, 0, 0, Math.PI * 2);
    x.fill();
    x.restore();

    if (imgs.body) {
      x.save();
      apply(x, P_BODY, T.body);
      x.drawImage(imgs.body, 0, 0, SPRITE.size[0], SPRITE.size[1]);
      x.restore();
    }
    x.restore();
  }

  /* ---------- 命中：画布坐标 -> 舞台坐标 -> 照片坐标 -> 查剪影蒙版 ---------- */
  /* file:// 下画布被跨源图片污染，蒙版建不起来；退化成椭圆近似，页面照样能摸 */
  const ELLIPSE = {
    head: { cx: 205, cy: 145, rx: 115, ry: 150 },
    body: { cx: 200, cy: 380, rx: 160, ry: 95 }
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
  function inMask(lx, ly) {
    const mk = masks.body;
    const ix = Math.floor(lx / mk.step), iy = Math.floor(ly / mk.step);
    if (ix < 0 || iy < 0 || ix >= mk.w || iy >= mk.h) return false;
    return mk.m[iy * mk.w + ix] === 1;
  }
  function inEllipse(lx, ly, z) {
    const e = ELLIPSE[z === "head" ? "head" : "body"];
    const u = (lx - e.cx) / e.rx, v = (ly - e.cy) / e.ry;
    return u * u + v * v <= 1;
  }

  /* 分区按照片实际长相来：下巴（照片 y≈290）以上是头脸，
   * 最下面一排 y≈405 以下是两只前爪，爪子两侧那圈毛算尾巴根，中间是背和肚子。 */
  function zone(lx, ly) {
    const fy = ly / SPRITE.size[1];
    if (fy < .60) return "head";
    if (fy > .86) return Math.abs(lx - 212) < 105 ? "paw" : "tail";
    return "body";
  }
  function hit(P, wx, wy) {
    const T = tf(P);
    const [sx, sy] = toStage(P, wx, wy);
    const [lx, ly] = toLocal(P_BODY, T.body, sx, sy);
    if (lx < 0 || ly < 0 || lx > SPRITE.size[0] || ly > SPRITE.size[1]) return null;
    const z = zone(lx, ly);
    const on = masks.body ? inMask(lx, ly) : inEllipse(lx, ly, z);
    return on ? z : null;
  }

  /* 某个部位在照片里的点，换算到舞台上，用来飘字和生成粒子 */
  const LOCAL = { head: [205, 130], body: [200, 360], paw: [212, 448], tail: [338, 430] };
  function center(P, which) {
    const t = tf(P).body, l = LOCAL[which] || LOCAL.body;
    let x = (l[0] - SPRITE.anchor[0]) * t.sx, y = (l[1] - SPRITE.anchor[1]) * t.sy;
    if (t.rot) {
      const c = Math.cos(t.rot), s = Math.sin(t.rot);
      const nx = x * c - y * s, ny = x * s + y * c; x = nx; y = ny;
    }
    return [SPRITE.at[0] + t.dx + x, SPRITE.at[1] + t.dy + y];
  }

  /* 舞台盒：把 480×560 的布偶塞进游戏自己的逻辑坐标系。
   * 游戏只需给出左上角和目标宽，盒子里 draw/hit/at 说的是游戏的坐标，
   * 免得九款游戏各自复刻一遍 translate/scale 反算。 */
  function box(gx, gy, gw) {
    const s = gw / STAGE_W, self = {
      gx, gy, gw, gh: STAGE_H * s, s,
      draw(x, P) { x.save(); x.translate(gx, gy); x.scale(s, s); draw(x, P); x.restore(); },
      hit(P, wx, wy) { return hit(P, (wx - gx) / s, (wy - gy) / s); },
      /* 舞台点 -> 游戏点；P 传了就带上整体位移与缩放 */
      p(px, py, P) {
        if (P) {
          return [gx + (STAGE_W / 2 + P.x + (px - STAGE_W / 2) * P.scale) * s,
            gy + (STAGE_H / 2 + P.y + (py - STAGE_H / 2) * P.scale) * s];
        }
        return [gx + px * s, gy + py * s];
      },
      at(P, which) { const c = center(P, which); return self.p(c[0], c[1], P); }
    };
    return self;
  }

  /* 照片内容在舞台上的包围盒，给按整体宽高摆位的游戏用 */
  const CONTENT = {
    x0: SPRITE.at[0] - SPRITE.anchor[0] * SPRITE.s,
    y0: SPRITE.at[1] - SPRITE.anchor[1] * SPRITE.s,
    x1: SPRITE.at[0] + (SPRITE.size[0] - SPRITE.anchor[0]) * SPRITE.s,
    y1: SPRITE.at[1]
  };

  const API = {
    STAGE_W, STAGE_H, SPRITE, P_BODY, P_HEAD, P_TAIL, P_FACE, CONTENT,
    imgs, masks, pose, load, tf, apply, draw, hit, zone, center, box
  };
  return API;
})();
