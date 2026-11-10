import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const CANON = s => String(s || "").toLowerCase().replace(/^ml[_:]/, "").replace(/[_\s-]/g, "");

export const BONES = [
  "ml_root", "ml_hips", "ml_spine_01", "ml_spine_02", "ml_chest", "ml_neck", "ml_head",
  "ml_jaw", "ml_ear_l", "ml_ear_r", "ml_eye_l", "ml_eye_r",
  "ml_front_leg_l", "ml_front_leg_r", "ml_front_knee_l", "ml_front_knee_r",
  "ml_front_paw_l", "ml_front_paw_r",
  "ml_back_leg_l", "ml_back_leg_r", "ml_back_knee_l", "ml_back_knee_r",
  "ml_back_paw_l", "ml_back_paw_r",
  "ml_tail_01", "ml_tail_02", "ml_tail_03", "ml_tail_04",
];

export const MORPHS = [
  "ml_ex_eye_close", "ml_ex_eye_wide", "ml_ex_mouth_open",
  "ml_ex_mouth_smile", "ml_ex_cheek_raise", "ml_ex_whisker_fan",
];

export const CLIPS = [
  "ml_idle", "ml_walk", "ml_look_around", "ml_run", "ml_jump", "ml_roll",
  "ml_pet", "ml_poke", "ml_stretch", "ml_shock", "ml_angry", "ml_collapse",
];

const CH = ["eye_close", "eye_wide", "mouth_open", "mouth_smile", "cheek_raise", "whisker_fan", "ear_back", "ear_up", "head_tilt", "look_x", "look_y"];

export const FACES = {
  normal:    { ear_up: .2 },
  happy:     { eye_close: .3, mouth_open: .2, mouth_smile: .8, cheek_raise: .7, ear_up: .3 },
  shock:     { eye_wide: 1, mouth_open: .7, mouth_smile: -.2, ear_back: .5, head_tilt: -.1 },
  disgust:   { eye_close: .8, mouth_smile: -.5, ear_back: .3, head_tilt: -.15 },
  angry:     { eye_wide: .4, mouth_open: .1, mouth_smile: -.8, whisker_fan: 1, ear_back: 1, head_tilt: -.2 },
  sad:       { eye_close: .4, mouth_smile: -.6, ear_back: .6, head_tilt: .25 },
  confused:  { eye_wide: .2, whisker_fan: .2, ear_back: .1, ear_up: .5, head_tilt: .6 },
  sleepy:    { eye_close: .7, mouth_open: .15, mouth_smile: -.2, ear_back: .4, head_tilt: .3 },
  smug:      { eye_close: .5, mouth_smile: .6, cheek_raise: .3, ear_up: .4, head_tilt: -.3 },
};

export const EVENTS = {
  tap:   { body: "ml_poke",         face: "disgust",  tail: "sway",   dur: 1.4 },
  good:  { body: "ml_jump",         face: "happy",    tail: "fast",   dur: 1.4 },
  bad:   { body: "ml_shock",        face: "confused", tail: "puffed", dur: 1.4 },
  combo: { body: "ml_look_around",  face: "smug",     tail: "fast",   dur: 1.6 },
  bonus: { body: "ml_jump",         face: "happy",    tail: "fast",   dur: 1.4 },
  win:   { body: "ml_victory",      face: "smug",     tail: "fast",   dur: 2.2 },
  lose:  { body: "ml_collapse",     face: "sad",      tail: "still",  dur: 2.4 },
  tick:  { body: "ml_stretch",      face: "sleepy",   tail: "sway",   dur: 1.0 },
};

const NEUTRAL = {}; CH.forEach(k => NEUTRAL[k] = 0);
NEUTRAL.ear_up = .2;

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;

const M3 = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .78, metalness: 0 }, o || {}));

function nod(name, parent, pos) {
  const o = new THREE.Object3D();
  o.name = name;
  if (pos) o.position.set(pos[0], pos[1], pos[2]);
  if (parent) parent.add(o);
  return o;
}

function mesh(geo, m, parent, pos, rot, zone) {
  const x = new THREE.Mesh(geo, m);
  if (pos) x.position.set(pos[0], pos[1], pos[2]);
  if (rot) x.rotation.set(rot[0], rot[1], rot[2]);
  if (zone) x.userData.zone = zone;
  parent.add(x);
  return x;
}

/* 占位角色：契约命名的骨骼节点 + 刚体分段。真 GLB 换成 skinned mesh，通道名完全一致。 */
function buildPlaceholder(cfg) {
  const sp = Object.assign({ headWidth: 1, bodyFat: 1, earSpread: 1 }, cfg.shapeParams || {});
  const fur = M3(cfg.furColor || "#E8A857");
  const deep = M3("#C9813F");
  const cream = M3("#FBEBD2");
  const pink = M3("#F2A0A8", { roughness: .55 });
  const eyeW = M3("#FFFDF6", { roughness: .25 });
  const eyeD = M3("#2B2320", { roughness: .18 });
  const wire = M3("#4A3B32", { roughness: .6 });

  const P = {};
  P.root = nod("ml_root");
  P.hips = nod("ml_hips", P.root, [0, .30, 0]);
  P.s1 = nod("ml_spine_01", P.hips, [0, .02, .10]);
  P.s2 = nod("ml_spine_02", P.s1, [0, .01, .12]);
  P.chest = nod("ml_chest", P.s2, [0, 0, .13]);
  P.neck = nod("ml_neck", P.chest, [0, .06, .06]);
  P.head = nod("ml_head", P.neck, [0, .04, .10]);

  const body = mesh(new THREE.SphereGeometry(.155, 22, 16), fur, P.chest, [0, -.02, .02], null, "body");
  body.scale.set(1, .92, 1.5 * sp.bodyFat);
  mesh(new THREE.SphereGeometry(.13, 18, 12), cream, P.chest, [0, -.075, .05]).scale.set(.92, .6, 1.25 * sp.bodyFat);
  mesh(new THREE.SphereGeometry(.10, 16, 12), deep, P.chest, [0, .01, -.06]).scale.set(.95, .7, 1.1 * sp.bodyFat);

  P.jaw = nod("ml_jaw", P.head, [0, -.055, .10]);
  P.earL = nod("ml_ear_l", P.head, [sp.earSpread * .078, .122, -.01]);
  P.earR = nod("ml_ear_r", P.head, [-sp.earSpread * .078, .122, -.01]);
  P.eyeL = nod("ml_eye_l", P.head, [.052, .016, .104]);
  P.eyeR = nod("ml_eye_r", P.head, [-.052, .016, .104]);

  const skull = mesh(new THREE.SphereGeometry(.135, 24, 18), fur, P.head, [0, 0, 0], null, "head");
  skull.scale.set(sp.headWidth, 1, 1);
  const muzzle = mesh(new THREE.SphereGeometry(.072, 16, 12), cream, P.head, [0, -.048, .082]);
  muzzle.scale.set(1.25, .78, .8);
  mesh(new THREE.SphereGeometry(.017, 12, 8), pink, P.head, [0, -.018, .124]);

  mesh(new THREE.ConeGeometry(.05, .09, 4), fur, P.earL, [0, .03, 0], [-.12, .35, .16], "head");
  mesh(new THREE.ConeGeometry(.05, .09, 4), fur, P.earR, [0, .03, 0], [-.12, -.35, -.16], "head");

  P.lids = [];
  for (const [side, host] of [["l", P.eyeL], ["r", P.eyeR]]) {
    const eye = mesh(new THREE.SphereGeometry(.032, 16, 12), eyeW, host, [0, 0, 0], null, "head");
    eye.scale.set(1, 1.18, .8);
    const pupil = mesh(new THREE.SphereGeometry(.018, 14, 10), eyeD, eye, [0, .002, .016]);
    pupil.scale.set(.6, 1.3, 1);
    const lid = mesh(new THREE.SphereGeometry(.0355, 16, 10, 0, Math.PI * 2, 0, Math.PI * .5), fur, eye, [0, .004, 0]);
    lid.rotation.x = -.5;
    P.lids.push({ eye, pupil, lid });
  }

  P.whiskL = nod("ml_whisker_l", P.head, [.07, -.045, .085]);
  P.whiskR = nod("ml_whisker_r", P.head, [-.07, -.045, .085]);
  [P.whiskL, P.whiskR].forEach(w => {
    const s = w === P.whiskR ? -1 : 1;
    for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(.0022, .0022, .12, 4), wire, w, [s * .06, .008 * i - .008, .004 * i], [0, 0, Math.PI / 2 + (i - 1) * .17]);
  });

  P.legs = {};
  for (const side of ["l", "r"]) {
    const sx = side === "l" ? 1 : -1;
    const fl = nod("ml_front_leg_" + side, P.chest, [sx * .082, -.05, .10]);
    mesh(new THREE.CapsuleGeometry(.031, .12, 4, 10), fur, fl, [0, -.095, 0]);
    const fk = nod("ml_front_knee_" + side, fl, [0, -.17, 0]);
    mesh(new THREE.CapsuleGeometry(.027, .06, 4, 10), fur, fk, [0, -.045, 0]);
    const fp = nod("ml_front_paw_" + side, fk, [0, -.085, .006]);
    mesh(new THREE.SphereGeometry(.035, 12, 8), cream, fp, [0, 0, 0], null, "paw").scale.set(1, .6, 1.25);

    const bl = nod("ml_back_leg_" + side, P.hips, [sx * .088, -.03, -.13]);
    mesh(new THREE.CapsuleGeometry(.038, .10, 4, 10), deep, bl, [0, -.08, -.012], [.22, 0, 0]);
    const bk = nod("ml_back_knee_" + side, bl, [0, -.15, -.028]);
    mesh(new THREE.CapsuleGeometry(.03, .09, 4, 10), deep, bk, [0, -.055, .018], [-.5, 0, 0]);
    const bp = nod("ml_back_paw_" + side, bk, [0, -.095, .05]);
    mesh(new THREE.SphereGeometry(.037, 12, 8), cream, bp, [0, 0, 0], null, "paw").scale.set(1, .6, 1.35);
    P.legs[side] = { fl, fk, fp, bl, bk, bp };
  }

  P.tail = [];
  let tp = P.hips;
  const tailOff = [[0, .02, -.15], [0, .028, -.10], [0, .04, -.10], [0, .032, -.09]];
  for (let i = 0; i < 4; i++) {
    const t = nod("ml_tail_0" + (i + 1), i ? P.tail[i - 1] : P.hips, tailOff[i]);
    mesh(new THREE.CapsuleGeometry(.035 - i * .006, .10 - i * .014, 4, 10), i < 2 ? fur : deep, t, [0, 0, -.045], [Math.PI / 2, 0, 0], "tail");
    P.tail.push(t);
  }
  P.muzzle = muzzle;
  return P;
}

/* GLB 只改了骨骼名、还没带动作片段时，用同一套程序化动作直接驱动它的骨骼。 */
const POSE_BONES = ["ml_root", "ml_hips", "ml_chest", "ml_neck", "ml_head", "ml_jaw", "ml_ear_l", "ml_ear_r", "ml_eye_l", "ml_eye_r",
  "ml_front_leg_l", "ml_front_knee_l", "ml_back_leg_l", "ml_back_knee_l",
  "ml_front_leg_r", "ml_front_knee_r", "ml_back_leg_r", "ml_back_knee_r",
  "ml_tail_01", "ml_tail_02", "ml_tail_03", "ml_tail_04"];

function bundleFromBones(byBone) {
  const g = k => byBone[CANON(k)];
  if (!POSE_BONES.every(k => g(k))) return null;
  const legs = {};
  for (const s of ["l", "r"]) {
    legs[s] = { fl: g("ml_front_leg_" + s), fk: g("ml_front_knee_" + s), fp: g("ml_front_paw_" + s), bl: g("ml_back_leg_" + s), bk: g("ml_back_knee_" + s), bp: g("ml_back_paw_" + s) };
  }
  return {
    root: g("ml_root"), hips: g("ml_hips"), s1: g("ml_spine_01"), s2: g("ml_spine_02"),
    chest: g("ml_chest"), neck: g("ml_neck"), head: g("ml_head"), jaw: g("ml_jaw"),
    earL: g("ml_ear_l"), earR: g("ml_ear_r"), eyeL: g("ml_eye_l"), eyeR: g("ml_eye_r"),
    lids: [], whiskL: null, whiskR: null, muzzle: null, legs,
    tail: [1, 2, 3, 4].map(i => g("ml_tail_0" + i)),
  };
}

/* 真模型的网格不会带占位角色的 userData.zone，靠骨骼名回溯分区。 */
function zoneOfBone(name) {
  const c = CANON(name);
  if (!c) return null;
  if (/^(head|jaw|ear|eye)/.test(c)) return "head";
  if (/^tail/.test(c)) return "tail";
  if (/(paw|leg|knee)/.test(c)) return "paw";
  if (/^(root|hips|spine|chest|neck)/.test(c)) return "body";
  return null;
}

export class Pet3D {
  constructor({ canvas, cfg = {}, quality } = {}) {
    this.cfg = cfg;
    this.canvas = canvas;
    this.ch = Object.assign({}, NEUTRAL);
    this.target = Object.assign({}, NEUTRAL);
    this.faceName = "normal";
    this.body = "ml_idle";
    this.prevBody = null;
    this.bodyT = 0; this.prevT = 0; this.blend = 1;
    this.lockUntil = 0; this.returnTo = "ml_idle";
    this.tailMode = "sway"; this.earMode = "idle";
    this.blinkAt = 2 + Math.random() * 3; this.blinkT = null;
    this.look = new THREE.Vector2();
    this.time = 0; this.paused = false; this.running = false;
    this.fps = 0; this._frames = 0; this._ft = performance.now(); this._slow = 0;
    this.report = { source: "placeholder", bones: [], clips: [], morphs: [], missing: [], warnings: [] };
    this.dHead = { p: new THREE.Vector3(), r: new THREE.Euler() };
    this.prevPose = new Map(); this.curPose = new Map();
  }

  async mount() {
    const coarse = matchMedia("(pointer:coarse)").matches;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, .1, 20);
    this.camera.position.set(0, .55, coarse ? 1.95 : 1.72);
    this.camera.lookAt(0, .33, 0);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.ray = new THREE.Raycaster();

    this.scene.add(new THREE.HemisphereLight(0xfff3e0, 0xd6c9b6, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.35); key.position.set(1.4, 2.4, 1.8); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2ac, .8); rim.position.set(-2, 1.3, -2.2); this.scene.add(rim);

    const fake = mesh(new THREE.CircleGeometry(.36, 26), new THREE.MeshBasicMaterial({ color: 0x221a12, transparent: true, opacity: .14 }), this.scene, [0, .004, .02], [-Math.PI / 2, 0, 0]);
    fake.renderOrder = -1;

    const src = this.cfg.modelData || this.cfg.modelUrl;
    if (src) {
      try { await this.loadGLB(src); }
      catch (e) { this.report.missing.push("GLB 加载失败（" + e.message + "），已退回占位角色"); }
    }
    if (!this.loaded) this.buildPlaceholderScene();

    this.collect();
    if (this.mixer && !this.report.clips.length) {
      const B = bundleFromBones(this.byBone);
      if (B) {
        this.P = B; this.mixer = null; this.action = null; this.clips = null;
        this.report.warnings.push("GLB 未带动作片段，已用程序化动作驱动其骨骼");
      }
    }
    this.resize();
    this.running = true;
    this._last = performance.now();
    this.loop();
    return this;
  }

  buildPlaceholderScene() {
    this.P = buildPlaceholder(this.cfg);
    this.scene.add(this.P.root);
    this.loaded = true;
  }

  async loadGLB(src) {
    const loader = new GLTFLoader();
    const gltf = typeof src === "string"
      ? await loader.loadAsync(src)
      : await new Promise((res, rej) => loader.parse(src, "", res, rej));
    this.model = gltf.scene;
    this.scene.add(this.model);
    this.mixer = new THREE.AnimationMixer(this.model);
    this.clips = {};
    gltf.animations.forEach(c => { this.clips[CANON(c.name)] = c; this.report.clips.push(c.name); });
    this.model.traverse(o => {
      if (o.isMesh && o.morphTargetDictionary && !this.morphHost) {
        this.morphHost = o;
        this.morphIndex = {};
        MORPHS.forEach(m => {
          const k = Object.keys(o.morphTargetDictionary).find(n => CANON(n) === CANON(m));
          if (k == null) this.report.missing.push("形态键缺失：" + m);
          else { this.morphIndex[m] = o.morphTargetDictionary[k]; this.report.morphs.push(m); }
        });
      }
    });
    this.loaded = true;
    this.report.source = "glb";
    this.report.bytes = typeof src === "string" ? 0 : src.byteLength;
  }

  collect() {
    const found = {};
    this.scene.traverse(o => { if (o.name && !found[o.name]) { const c = CANON(o.name); if (BONES.some(b => CANON(b) === c)) found[c] = o; } });
    this.byBone = found;
    this.nodes = Object.values(found);
    BONES.forEach(b => { const c = CANON(b); if (found[c]) this.report.bones.push(b); else this.report.missing.push("骨骼缺失：" + b); });
    CLIPS.forEach(cl => { if (this.clips && !this.clips[CANON(cl)]) this.report.missing.push("动作缺失：" + cl); });
    this.base = this.nodes.map(n => ({ n, p: n.position.clone(), q: n.quaternion.clone(), e: n.rotation.clone(), s: n.scale.clone() }));
  }

  getBone(c) { return this.byBone[CANON(c)]; }

  play(spec) {
    if (!spec || !spec.body) return;
    const now = performance.now();
    if (now < this.lockUntil && spec.priority !== true) return;
    if (spec.body === this.body) return;
    this.setBody(spec.body);
    const dur = spec.dur || spec.duration || 1.6;
    this.lockUntil = now + dur * 1000;
    this.returnTo = spec.returnTo || "ml_idle";
    if (spec.face) this.setFace(spec.face);
    if (spec.tail) this.tailMode = spec.tail;
    if (spec.ears) this.earMode = spec.ears;
  }

  setFace(name) {
    if (!FACES[name]) return;
    this.faceName = name;
    this.target = Object.assign({}, NEUTRAL, FACES[name]);
  }

  setGaze(nx, ny) { this.look.set(nx, ny); }

  zoneAt(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    this.ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.camera);
    const host = this.model ? [this.model] : (this.P ? [this.P.root] : []);
    for (const h of this.ray.intersectObjects(host, true)) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.zone) return o.userData.zone;
        const z = o.name ? zoneOfBone(o.name) : null;
        if (z) return z;
        o = o.parent;
      }
    }
    return null;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width | 0), h = Math.max(1, r.height | 0);
    this.renderer.setPixelRatio(this.dpr || Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  tick(dt) {
    this.time += dt;
    for (const k of CH) {
      let want = this.target[k];
      if (k === "look_x") want = this.look.x;
      if (k === "look_y") want = this.look.y;
      this.ch[k] = lerp(this.ch[k], want, Math.min(1, dt * 9));
    }

    if (this.time > this.blinkAt) { this.blinkAt = this.time + 2.4 + Math.random() * 3.6; this.blinkT = 0; }
    let blink = 0;
    if (this.blinkT != null) {
      this.blinkT += dt;
      blink = this.blinkT < .09 ? this.blinkT / .09 : this.blinkT < .18 ? 1 - (this.blinkT - .09) / .09 : 0;
      if (this.blinkT > .2) this.blinkT = null;
    }
    this.blink = clamp01(blink);

    if (this.lockUntil && performance.now() > this.lockUntil) { this.lockUntil = 0; this.queue(this.returnTo); }
    if (this.queueBody) { this.setBody(this.queueBody); this.queueBody = null; }
    this.blend = Math.min(1, this.blend + dt * 4.5);

    if (this.mixer) this.updateGLB(dt);
    else { this.bodyT += dt; this.prevT += dt; this.posePlaceholder(); }

    this.applyFace();
    this.frames(dt);
  }

  queue(body) { if (body && body !== this.body) this.queueBody = body; }

  setBody(body) {
    if (!body || body === this.body) return;
    this.prevBody = this.body; this.prevT = this.bodyT;
    this.body = body; this.bodyT = 0; this.blend = 0;
    if (this.mixer) this.startClip(body);
  }

  startClip(body) {
    const clip = this.clips && this.clips[CANON(body)];
    if (!clip) return;
    const next = this.mixer.clipAction(clip);
    next.reset();
    next.loop = CANON(body) === "idle" ? THREE.LoopRepeat : THREE.LoopOnce;
    next.clampWhenFinished = next.loop === THREE.LoopOnce;
    next.setLoop(next.loop, next.loop === THREE.LoopRepeat ? Infinity : 1);
    next.play();
    if (this.action && this.action !== next) this.action.crossFadeTo(next, .22, false);
    else if (this.action === next) this.action.time = 0;
    this.action = next;
    this.clipBody = body;
  }

  updateGLB(dt) {
    this.bodyT += dt;
    if (this.clipBody !== this.body) this.startClip(this.body);
    this.mixer.update(dt);
  }

  applyFace() {
    const c = this.ch;
    const close = clamp01(c.eye_close + this.blink);
    if (this.morphIndex) {
      const inf = this.morphHost.morphTargetInfluences;
      const put = (name, v) => { const i = this.morphIndex[name]; if (i != null) inf[i] = v; };
      put(MORPHS[0], close);
      put(MORPHS[1], clamp01(c.eye_wide));
      put(MORPHS[2], clamp01(c.mouth_open));
      put(MORPHS[3], c.mouth_smile);
      put(MORPHS[4], clamp01(c.cheek_raise));
      put(MORPHS[5], clamp01(c.whisker_fan));
    }
    const T = this.faceTargets();
    if (!T) return;
    if (T.lids) T.lids.forEach(l => {
      l.lid.rotation.x = -.5 + close * 1.7;
      const s = 1 + c.eye_wide * .24 - close * .1;
      l.eye.scale.set(1, 1.18 * s, .8);
      l.pupil.position.set(c.look_x * .011, .002 + c.look_y * .008, .016);
      l.pupil.scale.set(.6, 1.3 * (1 + c.eye_wide * .3), 1);
    });
    if (T.jaw) T.jaw.rotation.x = c.mouth_open * .55;
    if (T.muzzle) {
      T.muzzle.scale.set(1.25 * (1 + c.cheek_raise * .16 + c.whisker_fan * .1), .78 * (1 + c.cheek_raise * .32), .8);
      T.muzzle.rotation.z = c.mouth_smile * .18;
    }
    if (T.whiskL) T.whiskL.rotation.z = -c.whisker_fan * .3 + c.mouth_smile * .08;
    if (T.whiskR) T.whiskR.rotation.z = c.whisker_fan * .3 - c.mouth_smile * .08;
    const back = c.ear_back, up = c.ear_up;
    if (T.earL) { T.earL.rotation.x = -.1 + back * .95 - up * .3; T.earL.rotation.z = back * .45 - up * .2; }
    if (T.earR) { T.earR.rotation.x = -.1 + back * .95 - up * .3; T.earR.rotation.z = -(back * .45 - up * .2); }
    if (T.head) T.head.rotation.z += c.head_tilt * .5;
    if (T.eyeL) T.eyeL.rotation.y = c.look_x * .35;
    if (T.eyeR) T.eyeR.rotation.y = c.look_x * .35;
    if (T.eyeL) T.eyeL.rotation.x = -c.look_y * .25;
    if (T.eyeR) T.eyeR.rotation.x = -c.look_y * .25;
  }

  faceTargets() {
    if (this.P) return Object.assign({ lids: this.P.lids }, this.P);
    if (!this.byBone) return null;
    const g = k => this.getBone(k);
    return { jaw: g("ml_jaw"), earL: g("ml_ear_l"), earR: g("ml_ear_r"), head: g("ml_head"), eyeL: g("ml_eye_l"), eyeR: g("ml_eye_r") };
  }

  resetPose() {
    for (const b of this.base) { b.n.position.copy(b.p); b.n.quaternion.copy(b.q); b.n.scale.copy(b.s); }
  }

  capturePose(map) {
    for (const b of this.base) {
      let e = map.get(b.n);
      if (!e) { e = { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 }; map.set(b.n, e); }
      e.px += b.n.position.x - b.p.x; e.py += b.n.position.y - b.p.y; e.pz += b.n.position.z - b.p.z;
      e.rx += b.n.rotation.x - b.e.x; e.ry += b.n.rotation.y - b.e.y; e.rz += b.n.rotation.z - b.e.z;
      e.sx = b.n.scale.x / b.s.x; e.sy = b.n.scale.y / b.s.y; e.sz = b.n.scale.z / b.s.z;
    }
  }

  motions(t) {
    const P = this.P;
    const put = (n, ax, v) => { if (n) n.rotation[ax] += v; };
    const limb = (speed, amp) => {
      for (const side of ["l", "r"]) {
        const L = P.legs[side], ph = side === "l" ? 0 : Math.PI;
        put(L.fl, "x", Math.sin(t * speed + ph) * amp);
        put(L.fk, "x", Math.max(0, -Math.sin(t * speed + ph + .8)) * amp * 1.1);
        put(L.bl, "x", Math.sin(t * speed + ph + Math.PI) * amp * .9);
        put(L.bk, "x", Math.min(0, Math.sin(t * speed + ph + Math.PI)) * amp);
      }
    };
    const hop = v => { if (P.hips) P.hips.position.y += v; };
    const lift = v => { if (P.root) P.root.position.y += v; };
    const k = (time, d) => clamp01(time / d);
    const scale = (n, x, y, z) => { if (n) { n.scale.x *= x; n.scale.y *= y; n.scale.z *= z; } };
    return {
      ml_idle: () => { hop(Math.sin(t * 2.1) * .006); scale(P.chest, 1 + Math.sin(t * 2.1) * .018, 1 + Math.sin(t * 2.1) * .018, 1 + Math.sin(t * 2.1) * .018); put(P.neck, "y", Math.sin(t * .5) * .1); put(P.head, "x", Math.sin(t * .7) * .04); limb(.9, .05); },
      ml_sit: () => { for (const s of ["l", "r"]) { put(P.legs[s].bl, "x", -.95); put(P.legs[s].bk, "x", 1.3); } put(P.chest, "x", .06); },
      ml_walk: () => { hop(Math.abs(Math.sin(t * 7)) * .012); limb(7, .42); put(P.neck, "x", -.05); },
      ml_run: () => { hop(Math.abs(Math.sin(t * 11)) * .028); limb(11, .78); put(P.chest, "x", -.16); put(P.hips, "x", .1); },
      ml_jump: () => { const e = Math.sin(k(t, .55) * Math.PI); lift(e * .34); for (const s of ["l", "r"]) { put(P.legs[s].fl, "x", -e * .8); put(P.legs[s].bl, "x", e * .7); } put(P.chest, "x", -e * .18); },
      ml_roll: () => { const q = ease(k(t, 1.1)); if (P.root) { P.root.rotation.z = q * Math.PI * 2; P.root.position.y = Math.sin(q * Math.PI) * .12; } },
      ml_look_around: () => { put(P.head, "y", Math.sin(t * 1.6) * .5); put(P.neck, "y", Math.sin(t * 1.6 - .5) * .18); put(P.head, "x", Math.sin(t * 1.1) * .08); limb(.9, .04); },
      ml_pet: () => { put(P.head, "x", .2 + Math.sin(t * 3) * .05); put(P.neck, "x", .1); hop(Math.sin(t * 1.4) * .005); },
      ml_poke: () => { const e = ease(k(t, .4)); put(P.head, "x", -.32 * e); put(P.neck, "x", -.16 * e); if (P.root) P.root.position.x = .05 * e; hop(-.02 * e); },
      ml_stretch: () => { const e = ease(k(t, .9)); put(P.chest, "x", .38 * e); if (P.chest) P.chest.position.y -= .05 * e; put(P.head, "x", -.3 * e); for (const s of ["l", "r"]) { put(P.legs[s].fl, "x", .5 * e); put(P.legs[s].bl, "x", -.3 * e); } },
      ml_shock: () => { const e = ease(k(t, .28)); lift(.12 * e); scale(P.chest, 1 + .05 * e, 1 + .06 * e, 1 + .05 * e); for (const s of ["l", "r"]) { put(P.legs[s].fl, "x", -.5 * e); put(P.legs[s].bl, "x", .4 * e); } },
      ml_angry: () => { scale(P.chest, 1.08, 1.1, 1.04); put(P.head, "x", .12); limb(9, .3); },
      ml_collapse: () => { const q = ease(k(t, .7)); if (P.root) { P.root.rotation.z = q * 1.3; P.root.position.y -= q * .15; } for (const s of ["l", "r"]) { put(P.legs[s].fl, "x", .9 * q); put(P.legs[s].bl, "x", -.6 * q); } },
      ml_victory: () => { const e = ease(k(t, .6)); put(P.head, "x", -.25 * e); if (P.chest) P.chest.position.y += .03 * e; for (const s of ["l", "r"]) put(P.legs[s].fl, "x", -1.1 * e); lift(.04 * Math.sin(t * 6) * e); },
    };
  }

  poseOne(name, t, map) {
    this.resetPose();
    const M = this.motions(t);
    (M[name] || M.ml_idle)();
    this.capturePose(map);
  }

  posePlaceholder() {
    const P = this.P;
    this.prevPose.clear(); this.curPose.clear();
    if (this.prevBody && this.blend < 1) this.poseOne(this.prevBody, this.prevT, this.prevPose);
    this.poseOne(this.body, this.bodyT, this.curPose);

    const w = this.blend, mixed = new Map();
    const all = new Set([...this.prevPose.keys(), ...this.curPose.keys()]);
    for (const n of all) {
      const a = this.prevPose.get(n) || { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
      const b = this.curPose.get(n) || a;
      mixed.set(n, {
        px: lerp(a.px, b.px, w), py: lerp(a.py, b.py, w), pz: lerp(a.pz, b.pz, w),
        rx: lerp(a.rx, b.rx, w), ry: lerp(a.ry, b.ry, w), rz: lerp(a.rz, b.rz, w),
        sx: lerp(a.sx, b.sx, w), sy: lerp(a.sy, b.sy, w), sz: lerp(a.sz, b.sz, w),
      });
    }
    this.resetPose();
    for (const b of this.base) {
      const e = mixed.get(b.n);
      if (!e) continue;
      b.n.position.set(b.p.x + e.px, b.p.y + e.py, b.p.z + e.pz);
      b.n.rotation.set(b.e.x + e.rx, b.e.y + e.ry, b.e.z + e.rz);
      b.n.scale.set(b.s.x * e.sx, b.s.y * e.sy, b.s.z * e.sz);
    }

    const t = this.time;
    const puff = this.tailMode === "puffed";
    const spd = this.tailMode === "fast" ? 7.5 : this.tailMode === "still" ? 0 : 2.4;
    const amp = this.tailMode === "still" ? 0 : this.tailMode === "fast" ? .5 : .3;
    const wave = Math.sin(t * spd);
    P.tail.forEach((sg, i) => {
      sg.rotation.y += wave * amp * (1 + i * .3);
      sg.rotation.x += (puff ? -.35 : .3) * (1 + i * .08);
      const s = puff ? 1 + .12 * (i + 1) : 1;
      sg.children.forEach(c => { if (c.isMesh) c.scale.set(s, 1, s); });
    });
    [P.earL, P.earR].forEach((e, i) => {
      if (!e) return;
      const twitch = Math.sin(t * (2.6 + i * .8) + i * 2) * (.05 + (this.earMode === "alert" ? .07 : 0));
      e.rotation.y += twitch;
    });
  }

  frames(dt) {
    this._frames++;
    const now = performance.now();
    if (now - this._ft > 1000) {
      this.fps = Math.round(this._frames * 1000 / (now - this._ft));
      this._frames = 0; this._ft = now;
      // 后台标签页 rAF 被浏览器挂起，采样出来的帧率是假的，不能据此降级。
      if (this.fps < 26 && !this.dpr && !document.hidden) {
        this._slow++;
        if (this._slow >= 2) { this.dpr = 1; this.resize(); this.report.warnings.push("已自动降级到 1.0 像素比（帧率不足）"); }
      } else this._slow = 0;
    }
  }

  loop() {
    if (!this.running) return;
    this._raf = requestAnimationFrame(() => this.loop());
    const now = performance.now();
    const dt = Math.min(.05, (now - this._last) / 1000);
    this._last = now;
    if (this.paused) return;
    this.tick(dt);
    this.renderer.render(this.scene, this.camera);
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; this._last = performance.now(); this._ft = this._last; this._frames = 0; }

  snap({ face, size = 800, transparent = true } = {}) {
    const from = this.faceName;
    if (face) { this.setFace(face); for (let i = 0; i < 24; i++) this.tick(1 / 30); }
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ex = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, preserveDrawingBuffer: true });
    ex.setClearColor(0x000000, transparent ? 0 : 1);
    const cam = this.camera.clone();
    cam.aspect = 1; cam.updateProjectionMatrix();
    ex.setPixelRatio(1); ex.setSize(size, size, false);
    ex.render(this.scene, cam);
    const url = c.toDataURL("image/png");
    ex.dispose();
    if (face) { this.setFace(from); for (let i = 0; i < 16; i++) this.tick(1 / 30); }
    return url;
  }

  stats() {
    const i = this.renderer.info;
    return { fps: this.fps, source: this.report.source, bones: this.report.bones.length, clips: this.report.clips.length, morphs: this.report.morphs.length, missing: this.report.missing, warnings: this.report.warnings, tris: i.render.triangles, calls: i.render.calls, dpr: this.dpr || Math.min(devicePixelRatio || 1, 1.5) };
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    if (this._off) this._off();
    this.scene.traverse(o => {
      if (o.isMesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
          for (const key in m) { const v = m[key]; if (v && v.isTexture) v.dispose(); }
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
    this.scene.clear();
  }
}

export async function attach({ canvas, cfg, onZone }) {
  const pet = new Pet3D({ canvas, cfg });
  await pet.mount();
  const ndc = e => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }; };
  const move = e => pet.setGaze(ndc(e).x, ndc(e).y);
  const down = e => { const p = ndc(e); pet.setGaze(p.x, p.y); if (onZone) onZone(pet.zoneAt(e.clientX, e.clientY)); };
  const vis = () => document.hidden ? pet.pause() : pet.resume();
  const rs = () => pet.resize();
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerdown", down);
  document.addEventListener("visibilitychange", vis);
  addEventListener("resize", rs);
  pet._off = () => {
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerdown", down);
    document.removeEventListener("visibilitychange", vis);
    removeEventListener("resize", rs);
  };
  return pet;
}

export function forwardMLSound(pet, map = EVENTS) {
  if (!window.ML || typeof window.ML.onSound !== "function") return () => {};
  return window.ML.onSound(ev => { const spec = map[ev]; if (spec) pet.play(Object.assign({ priority: true }, spec)); });
}

/* 按契约体检一个已解析的 gltf；外包或 AI 交付时先看这个报告。 */
export function audit(gltf, bytes = 0) {
  const bones = [], morphs = [], tex = [];
  const clips = (gltf.animations || []).map(c => c.name);
  let tris = 0;
  gltf.scene.traverse(o => {
    if (o.isBone || (o.name && /^ml_/.test(o.name))) if (bones.indexOf(o.name) < 0) bones.push(o.name);
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    tris += Math.round((g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0)) / 3);
    if (o.morphTargetDictionary) Object.keys(o.morphTargetDictionary).forEach(k => { if (morphs.indexOf(k) < 0) morphs.push(k); });
    ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"].forEach(slot => {
      const m = o.material && o.material[slot];
      if (m && m.image) {
        const w = m.image.width || 0, h = m.image.height || 0;
        if (!tex.some(t => t.slot === slot && t.w === w && t.h === h)) tex.push({ slot, w, h });
      }
    });
  });
  const miss = (want, have) => want.filter(n => !have.some(h => CANON(h) === CANON(n)));
  const mb = miss(BONES, bones), mc = miss(CLIPS, clips), mm = miss(MORPHS, morphs);
  return {
    tris, clips, boneCount: bones.length, morphCount: morphs.length, tex, bytes,
    bones, morphs,
    boneHits: BONES.length - mb.length, clipHits: CLIPS.length - mc.length,
    missingBones: mb,
    missingClips: mc,
    missingMorphs: mm,
    overBudget: { tris: tris > 20000, morphs: morphs.length > 6, bigTex: tex.some(t => Math.max(t.w, t.h) > 2048), bigFile: bytes > 1.5 * 1024 * 1024 },
  };
}

/* 把占位角色导成真正的 GLB，用来验证 GLB 通路本身（不需要任何外部美术）。 */
export async function placeholderGLB(cfg) {
  const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
  return new GLTFExporter().parseAsync(buildPlaceholder(cfg || {}).root, { binary: true, onlyVisible: true, truncateDrawRange: true });
}
