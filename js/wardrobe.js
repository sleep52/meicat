/* 换装（js/wardrobe.js）
 *
 * 6 件都是真图（assets/dressup/*.png，客户发来的宠物服产品图），不是画的。
 * 锚点一律写在**照片坐标**里（390×472 那张真猫抠图），因为角色只有一张照片，
 * 头/身/尾本来就是同一个变换，分部位反而会把对齐拆散。
 *
 * 照片坐标 = 舞台坐标反算：x_照 = 195 + (x_台 - 240)/0.88，y_照 = 472 + (y_台 - 520)/0.88。
 * 这套数值是从旧版逐像素对好的位置换算来的，动之前先想清楚要改的是哪一件。
 *
 * 为什么衣服看着偏小：正脸坐姿能露出的胸口只有照片 y≈290~468 这 178 像素，
 * 而「站姿宠物服」的产品图接近正方形，按高度放进去只能到 220 左右宽，
 * 比猫的身体窄一圈。这是素材和姿势的冲突，不是缩放能解决的。
 */
window.Wardrobe = (() => {
  const D = "assets/dressup/";

  const SLOTS = [
    { id: "head", name: "帽子" },
    { id: "cloth", name: "上衣" },
    { id: "neck", name: "围巾 / 领结" },
    { id: "pack", name: "背包", locked: "没有真图素材。要做得先给一张纯色背景的宠物背包产品图，这里不放假图。" }
  ];

  const ITEMS = [
    /* 贝雷帽原图上半截是缝死的两只布耳朵（v .23~.47），真猫自己的耳朵不能被盖住，
     * 所以 crop 从 .48 起只取帽顶+帽檐。 */
    { id: "beret", slot: "head", name: "猫耳贝雷帽", file: D + "beret.png",
      at: [205, 161], w: 250, u: 0.5, v: 1.0, crop: [0.10, 0.48, 0.90, 0.80] },

    { id: "sweater", slot: "cloth", name: "针织毛衣", file: D + "sweater.png",
      at: [205, 295], w: 222, u: 0.503, v: 0.13 },
    { id: "hoodie", slot: "cloth", name: "连帽卫衣", file: D + "hoodie.png",
      at: [205, 300], w: 227, u: 0.488, v: 0.19 },
    { id: "tater", slot: "cloth", name: "薯饼连帽衫", file: D + "tater.png",
      at: [205, 313], w: 222, u: 0.50, v: 0.30 },

    /* 围巾原图下面垂着两条长带子，坐姿猫身上会穿模，只取中间那一圈。 */
    { id: "scarf", slot: "neck", name: "格纹围巾", file: D + "scarf.png",
      at: [215, 296], w: 261, u: 0.50, v: 0.10, crop: [0.27, 0.30, 0.74, 0.42] },
    { id: "bowtie", slot: "neck", name: "缎面领结", file: D + "bowtie.png",
      at: [220, 304], w: 227, u: 0.484, v: 0.492 }
  ];

  const byId = {};
  ITEMS.forEach(i => byId[i.id] = i);
  const inSlot = slot => ITEMS.filter(i => i.slot === slot);

  const cache = {};
  let loading = null;
  function load() {
    if (loading) return loading;
    loading = Promise.all(ITEMS.map(i => CAT.img(i.file).then(im => { cache[i.file] = im; })));
    return loading;
  }
  const get = file => cache[file] || null;

  /* 画一件：进入照片坐标系后按 crop 裁切、按 w 定宽，(u,v) 那点落在 at 上 */
  function drawOne(x, box, P, it) {
    const img = get(it.file);
    if (!img) return false;
    box.inPhoto(x, P, c => {
      const nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height;
      const cr = it.crop || [0, 0, 1, 1];
      const sw = (cr[2] - cr[0]) * nw, sh = (cr[3] - cr[1]) * nh;
      const dw = it.w, dh = dw * sh / sw;
      c.drawImage(img, cr[0] * nw, cr[1] * nh, sw, sh,
        it.at[0] - (it.u || 0.5) * dw, it.at[1] - (it.v || 0.5) * dh, dw, dh);
    });
    return true;
  }

  /* 一整套：衣服先画，爪子压回上面，领饰和帽子最后盖住 */
  function draw(x, box, P, worn) {
    const w = worn || CAT.wear();
    ["cloth"].forEach(slot => { const it = byId[w[slot]]; if (it) drawOne(x, box, P, it); });
    box.paws(x, P);
    ["neck", "head"].forEach(slot => { const it = byId[w[slot]]; if (it) drawOne(x, box, P, it); });
  }

  /* 选择器缩略图：把裁切后的真图单独画成一块，所见即所选 */
  function thumb(it, size) {
    const img = get(it.file);
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    if (!img) { x.fillStyle = "#F0E7D6"; x.fillRect(0, 0, size, size); return c.toDataURL(); }
    const nw = img.naturalWidth || img.width, nh = img.naturalHeight || img.height;
    const cr = it.crop || [0, 0, 1, 1];
    const sw = (cr[2] - cr[0]) * nw, sh = (cr[3] - cr[1]) * nh;
    const k = Math.min(size / sw, size / sh) * 0.9;
    const dw = sw * k, dh = sh * k;
    x.drawImage(img, cr[0] * nw, cr[1] * nh, sw, sh, (size - dw) / 2, (size - dh) / 2, dw, dh);
    return c.toDataURL("image/png");
  }

  return { SLOTS, ITEMS, inSlot, byId, load, get, draw, drawOne, thumb };
})();
