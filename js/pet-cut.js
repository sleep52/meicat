(() => {
  const RE = /assets\/pet-(paw-icon|fish-icon|fishing-icon|clipboard-icon|hand-cursor|heart-deco|flower-deco|star-deco|paw-deco|food-fish|food-chicken|food-can|food-kibble|food-shrimp|cartoon-cat|yellow-kitten|laurel|crown-banner)_/;
  const PINK_RE = /assets\/pet-lying-cat_/;
  const SIZE = 256;

  function cut(img, pink) {
    const c = document.createElement("canvas");
    c.width = c.height = SIZE;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const id = ctx.getImageData(0, 0, SIZE, SIZE);
    const d = id.data;
    const bg = new Uint8Array(SIZE * SIZE);
    const stack = [];
    const isWhite = (i) => {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      return mn > 200 && mx - mn < 12;
    };
    const isPink = (i) => {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      return r > 190 && r - g > 45 && r - b > 25 && b > g - 10;
    };
    const isBg = pink ? isPink : isWhite;
    for (let x = 0; x < SIZE; x++) stack.push(x, (SIZE - 1) * SIZE + x);
    for (let y = 0; y < SIZE; y++) stack.push(y * SIZE, y * SIZE + SIZE - 1);
    while (stack.length) {
      const p = stack.pop();
      if (bg[p]) continue;
      if (!isBg(p * 4)) continue;
      bg[p] = 1;
      d[p * 4 + 3] = 0;
      const x = p % SIZE, y = (p / SIZE) | 0;
      if (x > 0) stack.push(p - 1);
      if (x < SIZE - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - SIZE);
      if (y < SIZE - 1) stack.push(p + SIZE);
    }
    if (pink) {
      // 素材右下角带"AI生成"水印，猫身止于 0.82 高度，直接裁掉水印带
      for (let y = (SIZE * 0.88) | 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const p = y * SIZE + x;
          bg[p] = 1;
          d[p * 4 + 3] = 0;
        }
      }
    }
    for (let p = 0; p < SIZE * SIZE; p++) {
      if (bg[p]) continue;
      const x = p % SIZE, y = (p / SIZE) | 0;
      const near = (x > 0 && bg[p - 1]) || (x < SIZE - 1 && bg[p + 1]) ||
                   (y > 0 && bg[p - SIZE]) || (y < SIZE - 1 && bg[p + SIZE]);
      if (!near) continue;
      const i = p * 4;
      const fringe = pink
        ? d[i] > 190 && d[i] - d[i + 1] > 30
        : Math.min(d[i], d[i + 1], d[i + 2]) > 200;
      if (fringe) d[i + 3] = 120;
    }
    ctx.putImageData(id, 0, 0);
    img.src = c.toDataURL();
  }

  document.querySelectorAll("img").forEach((img) => {
    const pink = PINK_RE.test(img.src);
    if (!pink && !RE.test(img.src)) return;
    if (img.complete && img.naturalWidth) cut(img, pink);
    else img.addEventListener("load", () => cut(img, pink), { once: true });
  });
})();