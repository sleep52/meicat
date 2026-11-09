/* 轻量 WebAudio 音效 —— 无需任何素材文件 */
window.SFX = (() => {
  let ctx = null;
  let enabled = true;
  let last = 0;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = "sine", vol = 0.2, when = 0) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      g.connect(c.destination);
      const t = c.currentTime + when;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t);
      o.stop(t + dur);
    } catch (e) {}
  }

  return {
    resume() { ac(); },
    toggle() { enabled = !enabled; return enabled; },
    get enabled() { return enabled; },
    // 撸猫：咕噜声（节流）
    purr() {
      const n = Date.now();
      if (n - last < 220) return;
      last = n;
      tone(110, 0.28, "sawtooth", 0.10);
    },
    meow() {
      tone(520, 0.12, "triangle", 0.22);
      setTimeout(() => tone(700, 0.16, "triangle", 0.18), 90);
    },
    pop() { tone(880, 0.07, "square", 0.16); },
    perfect() {
      tone(660, 0.10, "sine", 0.22);
      setTimeout(() => tone(990, 0.12, "sine", 0.2), 80);
    },
    good() { tone(620, 0.10, "sine", 0.18); },
    miss() { tone(220, 0.16, "sawtooth", 0.14); },
    catchFish() {
      tone(740, 0.08, "square", 0.18);
      setTimeout(() => tone(980, 0.10, "square", 0.16), 70);
    },
    bomb() {
      tone(160, 0.25, "sawtooth", 0.18);
      setTimeout(() => tone(90, 0.3, "sawtooth", 0.16), 60);
    },
    pounce() {
      tone(300, 0.06, "square", 0.18);
      setTimeout(() => tone(520, 0.08, "square", 0.16), 50);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => tone(f, 0.18, "triangle", 0.2), i * 110)
      );
    },
    levelup() {
      [659, 880, 1175].forEach((f, i) =>
        setTimeout(() => tone(f, 0.14, "triangle", 0.2), i * 90)
      );
    },
  };
})();
