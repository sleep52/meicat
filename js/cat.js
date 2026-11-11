/* 真猫布偶（js/cat.js）
 *
 * 角色只有一张图：assets/pets/realcat/body.webp，它是 assets/rabbitcat.jpg
 * （客户真猫的正脸坐姿实拍，415×472）抠出来的 390×472 透明图。
 * 一张照片 = 一个剪影，所以这里只保留对整张照片做得真的形变：
 * 呼吸、落地挤压、倾斜、跳动。闭眼/张嘴/摇尾要额外的实拍分件才做得真，
 * 现在没有，相应参数就不作用——不做假表情层。
 *
 * 舞台是 480×560 的固定坐标系，游戏用 Cat.box() 把它塞进自己的逻辑坐标，
 * 于是 draw / hit / 部位锚点都说的是游戏坐标，不用九份页面各复刻一遍变换。
 */
window.Cat = (() => {
  const STAGE_W = 480, STAGE_H = 560;
  const FILE = "assets/pets/realcat/body.webp";

  /* anchor 是照片上的支点（脚底中点），at 是它在舞台上的落点，s 是缩放 */
  const SPRITE = { size: [390, 472], anchor: [195, 472], at: [240, 520], s: 0.88 };
  const TOP = SPRITE.at[1] - SPRITE.anchor[1] * SPRITE.s;   // 照片顶边在舞台上的 y = 104.64
  const CONTENT = {
    x0: SPRITE.at[0] - SPRITE.anchor[0] * SPRITE.s,
    y0: TOP,
    x1: SPRITE.at[0] + (SPRITE.size[0] - SPRITE.anchor[0]) * SPRITE.s,
    y1: SPRITE.at[1]
  };

  /* 两只前爪在照片里的位置，用来单独画一层，让衣服压不住爪尖 */
  const PAWS = [[148, 445, 60], [274, 445, 62]];

  const im = { body: null };
  let mask = null, pawLayer = null, ready = null;

  function buildMask() {
    const step = 2, w = Math.ceil(SPRITE.size[0] / step), h = Math.ceil(SPRITE.size[1] / step);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(im.body, 0, 0, w, h);
    let d;
    try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    const m = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 96 ? 1 : 0;
    return { w, h, step, m };
  }

  /* 只留两只爪子的剪影：先画整只猫，再用 destination-in 把别处擦掉 */
  function buildPaws() {
    const [W, H] = SPRITE.size;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.drawImage(im.body, 0, 0, W, H);
    x.globalCompositeOperation = "destination-in";
    for (const [cx, cy, r] of PAWS) {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.72, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.save(); x.translate(cx, cy); x.scale(1, 0.74); x.translate(-cx, -cy);
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      x.restore();
    }
    x.globalCompositeOperation = "source-over";
    return c;
  }

  function load() {
    if (ready) return ready;
    ready = CAT.img(FILE).then(i => {
      if (!i) { CAT.toast("真猫素材 assets/pets/realcat/body.webp 读不到"); return API; }
      im.body = i;
      mask = buildMask();
      pawLayer = buildPaws();
      return API;
    });
    return ready;
  }

  /* ---------- 姿态 ---------- */
  function pose(o) {
    return Object.assign({
      x: 0, y: 0, scale: 1,
      breathe: 0,        // -1..1 呼吸相位
      squash: 0,         // 落地挤压（正=压扁）
      rot: 0,            // 整只猫倾斜
      shadow: 1          // 影子强度/大小
    }, o || {});
  }

  /* 一张照片只有一个变换 */
  function tf(P) {
    const br = 1 + 0.018 * P.breathe;
    return {
      sx: SPRITE.s * (1 - 0.012 * P.breathe) * (1 + P.squash * 0.1),
      sy: SPRITE.s * (1 - P.squash * 0.12) * br,
      rot: P.rot,
      dx: 0, dy: 0
    };
  }

  /* 进入照片坐标系：之后 drawImage 一律用照片像素 */
  function apply(x, t) {
    x.translate(SPRITE.at[0] + t.dx, SPRITE.at[1] + t.dy);
    if (t.rot) x.rotate(t.rot);
    x.scale(t.sx, t.sy);
    x.translate(-SPRITE.anchor[0], -SPRITE.anchor[1]);
  }
  /* 反变换：舞台点 -> 照片点，命中检测和「把道具钉在猫身上」都要用 */
  function toPhoto(t, px, py) {
    let x = px - (SPRITE.at[0] + t.dx), y = py - (SPRITE.at[1] + t.dy);
    if (t.rot) {
      const c = Math.cos(-t.rot), s = Math.sin(-t.rot);
      const nx = x * c - y * s, ny = x * s + y * c;
      x = nx; y = ny;
    }
    return [x / t.sx + SPRITE.anchor[0], y / t.sy + SPRITE.anchor[1]];
  }
  /* 照片点 -> 舞台点 */
  function toStage(t, lx, ly) {
    let x = (lx - SPRITE.anchor[0]) * t.sx, y = (ly - SPRITE.anchor[1]) * t.sy;
    if (t.rot) {
      const c = Math.cos(t.rot), s = Math.sin(t.rot);
      const nx = x * c - y * s, ny = x * s + y * c;
      x = nx; y = ny;
    }
    return [SPRITE.at[0] + t.dx + x, SPRITE.at[1] + t.dy + y];
  }

  function shadow(x, P) {
    x.save();
    x.globalAlpha = 0.26 * P.shadow;
    x.fillStyle = "#4a3a22";
    x.beginPath();
    x.ellipse(240, 518, 150 * P.shadow, 20, 0, 0, Math.PI * 2);
    x.fill();
    x.restore();
  }

  function draw(x, P) {
    const t = tf(P);
    x.save();
    x.translate(STAGE_W / 2 + P.x, STAGE_H / 2 + P.y);
    x.scale(P.scale, P.scale);
    x.translate(-STAGE_W / 2, -STAGE_H / 2);
    shadow(x, P);
    if (im.body) { x.save(); apply(x, t); x.drawImage(im.body, 0, 0, SPRITE.size[0], SPRITE.size[1]); x.restore(); }
    x.restore();
  }

  /* 衣服压在爪子上面时，把爪子重新画回最上层 */
  function drawPaws(x, P) {
    if (!pawLayer) return;
    const t = tf(P);
    x.save();
    x.translate(STAGE_W / 2 + P.x, STAGE_H / 2 + P.y);
    x.scale(P.scale, P.scale);
    x.translate(-STAGE_W / 2, -STAGE_H / 2);
    apply(x, t);
    x.drawImage(pawLayer, 0, 0);
    x.restore();
  }

  /* ---------- 分区触摸 ---------- */
  /* 按照片真实长相划：下巴（y≈283）以上是头脸，最下面一排是两只前爪，
   * 爪子两侧算尾巴根，中间是背和肚子。 */
  function zone(lx, ly) {
    const fy = ly / SPRITE.size[1];
    if (fy < 0.60) return "head";
    if (fy > 0.86) return Math.abs(lx - 212) < 105 ? "paw" : "tail";
    return "body";
  }
  const ELLIPSE = { head: [205, 145, 115, 150], body: [200, 380, 160, 95] };
  function onCat(lx, ly, z) {
    if (mask) {
      const ix = Math.floor(lx / mask.step), iy = Math.floor(ly / mask.step);
      if (ix < 0 || iy < 0 || ix >= mask.w || iy >= mask.h) return false;
      return mask.m[iy * mask.w + ix] === 1;
    }
    /* file:// 下画布被跨源图片污染，抠不出蒙版；退化成椭圆近似，页面照样能摸 */
    const e = z === "head" ? ELLIPSE.head : ELLIPSE.body;
    const u = (lx - e[0]) / e[2], v = (ly - e[1]) / e[3];
    return u * u + v * v <= 1;
  }

  const ANCHOR = { head: [195, 130], body: [200, 360], paw: [212, 448], tail: [338, 430], chin: [195, 292] };

  /* ---------- 舞台盒 ---------- */
  function box(gx, gy, gw) {
    const s = gw / STAGE_W;
    const self = {
      gx, gy, gw, gh: STAGE_H * s, s,
      draw(x, P) { x.save(); x.translate(gx, gy); x.scale(s, s); draw(x, P); x.restore(); },
      /* 在盒子里以照片坐标画东西（服装、贴纸、道具钉在猫身上） */
      inPhoto(x, P, fn) {
        const t = tf(P);
        x.save();
        x.translate(gx, gy); x.scale(s, s);
        x.translate(STAGE_W / 2 + P.x, STAGE_H / 2 + P.y);
        x.scale(P.scale, P.scale);
        x.translate(-STAGE_W / 2, -STAGE_H / 2);
        apply(x, t);
        fn(x, t);
        x.restore();
      },
      paws(x, P) { x.save(); x.translate(gx, gy); x.scale(s, s); drawPaws(x, P); x.restore(); },
      /* 舞台点 -> 盒子（游戏）坐标，带上整体位移与缩放 */
      p(px, py, P) {
        if (P) return [gx + (STAGE_W / 2 + P.x + (px - STAGE_W / 2) * P.scale) * s,
          gy + (STAGE_H / 2 + P.y + (py - STAGE_H / 2) * P.scale) * s];
        return [gx + px * s, gy + py * s];
      },
      /* 游戏坐标 -> 照片坐标 */
      photo(P, wx, wy) {
        let sx = (wx - gx) / s, sy = (wy - gy) / s;
        if (P) { sx = (sx - STAGE_W / 2 - P.x) / P.scale + STAGE_W / 2; sy = (sy - STAGE_H / 2 - P.y) / P.scale + STAGE_H / 2; }
        return toPhoto(tf(P || pose()), sx, sy);
      },
      /* 摸到了算哪个部位，没摸到猫返回 null */
      hit(P, wx, wy) {
        const [lx, ly] = self.photo(P, wx, wy);
        if (lx < 0 || ly < 0 || lx > SPRITE.size[0] || ly > SPRITE.size[1]) return null;
        const z = zone(lx, ly);
        return onCat(lx, ly, z) ? z : null;
      },
      /* 部位锚点（照片坐标）换算到游戏坐标，飘字、生成粒子用 */
      at(P, which) {
        const l = ANCHOR[which] || ANCHOR.body;
        const st = toStage(tf(P), l[0], l[1]);
        return self.p(st[0], st[1], P);
      }
    };
    return self;
  }

  const API = {
    STAGE_W, STAGE_H, SPRITE, CONTENT, PAWS, ANCHOR, FILE, im,
    load, pose, tf, apply, toPhoto, toStage, draw, drawPaws, box, zone
  };
  return API;
})();
