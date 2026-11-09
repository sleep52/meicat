(() => {
  const RE = /assets\/pet-(paw-icon|fish-icon|fishing-icon|clipboard-icon|hand-cursor|heart-deco|flower-deco|star-deco|paw-deco|food-fish|food-chicken|food-can|food-kibble|cartoon-cat|laurel|crown-banner)_/;
  const SIZE = 256;

  function cut(img) {
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
      return mn > 232 && mx - mn < 14;
    };
    for (let x = 0; x < SIZE; x++) stack.push(x, (SIZE - 1) * SIZE + x);
    for (let y = 0; y < SIZE; y++) stack.push(y * SIZE, y * SIZE + SIZE - 1);
    while (stack.length) {
      const p = stack.pop();
      if (bg[p]) continue;
      if (!isWhite(p * 4)) continue;
      bg[p] = 1;
      d[p * 4 + 3] = 0;
      const x = p % SIZE, y = (p / SIZE) | 0;
      if (x > 0) stack.push(p - 1);
      if (x < SIZE - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - SIZE);
      if (y < SIZE - 1) stack.push(p + SIZE);
    }
    for (let p = 0; p < SIZE * SIZE; p++) {
      if (bg[p]) continue;
      const x = p % SIZE, y = (p / SIZE) | 0;
      const near = (x > 0 && bg[p - 1]) || (x < SIZE - 1 && bg[p + 1]) ||
                   (y > 0 && bg[p - SIZE]) || (y < SIZE - 1 && bg[p + SIZE]);
      if (!near) continue;
      const i = p * 4;
      if (Math.min(d[i], d[i + 1], d[i + 2]) > 200) d[i + 3] = 120;
    }
    ctx.putImageData(id, 0, 0);
    img.src = c.toDataURL();
  }

  document.querySelectorAll("img").forEach((img) => {
    if (!RE.test(img.src)) return;
    if (img.complete && img.naturalWidth) cut(img);
    else img.addEventListener("load", () => cut(img), { once: true });
  });
})();