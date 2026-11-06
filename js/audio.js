// Tiny shared WebAudio blips, no assets needed.
window.MemeAudio = (() => {
  let ctx = null;
  let muted = localStorage.getItem("meme-muted") === "1";

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = "square", gain = 0.08, slideTo = null) {
    if (muted) return;
    try {
      const a = ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, a.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
      g.gain.setValueAtTime(gain, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur);
    } catch (e) { /* audio is a nice-to-have */ }
  }

  const api = {
    hit(combo) { tone(300 + Math.min(combo, 12) * 40, 0.12, "square"); },
    miss() { tone(140, 0.15, "sawtooth", 0.05); },
    fever() { tone(500, 0.4, "triangle", 0.1, 1200); },
    flap() { tone(420, 0.09, "triangle", 0.06, 620); },
    point() { tone(700, 0.1, "sine", 0.08, 1000); },
    crash() { tone(200, 0.5, "sawtooth", 0.12, 50); },
    flip() { tone(520, 0.06, "sine", 0.05); },
    match() { tone(660, 0.18, "triangle", 0.09, 990); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, "triangle", 0.09), i * 130)); },
    toggleMute() {
      muted = !muted;
      localStorage.setItem("meme-muted", muted ? "1" : "0");
      return muted;
    },
    get muted() { return muted; },
  };
  return api;
})();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("muteBtn");
  if (!btn) return;
  const sync = () => { btn.textContent = MemeAudio.muted ? "🔇" : "🔊"; };
  sync();
  btn.addEventListener("click", () => { MemeAudio.toggleMute(); sync(); });
});
