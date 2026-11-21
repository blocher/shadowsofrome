// The living characters: two boys at the ends of the table and Dux the monkey.
// Each boy is a set of photographic frames (neutral, talk, blink, moods) blended in a shader, with breathing,
// blinking, lip movement driven by the voice, and eyes that find the viewer when hovered.
import * as THREE from 'three';
import { CHARACTERS, FRAMES, DUX_POSES } from '../../shared/characters.js';
import { ART, loadTexture } from './stage.js';

const VERT = `
  uniform float uTime, uPhase, uBreath, uLean;
  varying vec2 vUv;
  void main(){
    vUv = uv;
    vec3 p = position;
    float up = smoothstep(0.12, 0.95, uv.y);
    p.y += sin(uTime * 1.25 + uPhase) * 0.0045 * up * uBreath;                 // chest rises
    p.x += (sin(uTime * 0.53 + uPhase * 1.7) * 0.004 + uLean * 0.012) * up * up; // the head drifts
    p.xy *= 1.0 + sin(uTime * 1.25 + uPhase) * 0.0016 * uBreath;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAG = `
  uniform sampler2D tBase, tNext, tTalk, tBlink;
  uniform float uMix, uTalk, uBlink, uFlip, uOpacity, uDim, uHasTalk, uHasBlink, uFade;
  uniform vec2 uMouth, uEyes;
  uniform vec3 uTint;
  varying vec2 vUv;
  void main(){
    vec2 uv = vec2(mix(vUv.x, 1.0 - vUv.x, uFlip), vUv.y);
    vec4 c = mix(texture2D(tBase, uv), texture2D(tNext, uv), uMix);
    // lips: blend toward the open-mouth frame inside a soft ellipse around the mouth
    vec2 dm = (uv - uMouth) * vec2(1.0, 1.25);
    float mm = smoothstep(0.105, 0.04, length(dm)) * uTalk * uHasTalk;
    c = mix(c, texture2D(tTalk, uv), mm);
    // eyelids
    vec2 de = (uv - uEyes) * vec2(1.0, 2.2);
    float em = smoothstep(0.17, 0.09, length(de)) * uBlink * uHasBlink;
    c = mix(c, texture2D(tBlink, uv), em);
    c.rgb *= uTint * uDim;
    float fade = smoothstep(0.0, uFade, vUv.y);
    gl_FragColor = vec4(c.rgb, c.a * fade * uOpacity);
  }`;

const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); blank.needsUpdate = true;

export class Actor {
  /** @param side -1 = left end of the table (plays White), +1 = right end */
  constructor(stage, id, side) {
    this.stage = stage; this.id = id; this.side = side; this.info = CHARACTERS[id];
    this.frames = {}; this.mood = 'neutral'; this.talk = 0; this.talkGoal = 0; this.blinkAt = 2 + Math.random() * 3; this.blink = 0;
    this.active = false; this.dim = 1; this.hover = false; this.ready = false;
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        tBase: { value: blank }, tNext: { value: blank }, tTalk: { value: blank }, tBlink: { value: blank },
        uMix: { value: 0 }, uTalk: { value: 0 }, uBlink: { value: 0 }, uFlip: { value: side > 0 ? 1 : 0 }, uOpacity: { value: 0 },
        uDim: { value: 1 }, uHasTalk: { value: 0 }, uHasBlink: { value: 0 }, uFade: { value: 0.2 },
        uMouth: { value: new THREE.Vector2(0.5, 0.6) }, uEyes: { value: new THREE.Vector2(0.5, 0.7) },
        uTint: { value: new THREE.Vector3(1, 1, 1) }, uTime: { value: 0 }, uPhase: { value: Math.random() * 6 }, uBreath: { value: 1 }, uLean: { value: 0 },
      },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 16, 24), this.mat);
    this.mesh.renderOrder = 10 + (side > 0 ? 1 : 0);
    this.mesh.visible = false;
    stage.overlay.add(this.mesh);
  }

  async load() {
    const dir = `characters/${this.id}/`;
    const [neutral, meta] = await Promise.all([
      loadTexture(dir + 'neutral.webp'),
      fetch(ART + dir + 'meta.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if (!neutral) return false;
    this.frames.neutral = neutral;
    this.imgAspect = neutral.image.width / neutral.image.height;
    const u = this.mat.uniforms;
    u.tBase.value = neutral; u.tNext.value = neutral;
    const L = (meta && (meta.landmarks || meta)) || {};
    this.marks = { eyeL: L.eyeL || [0.46, 0.3], eyeR: L.eyeR || [0.56, 0.3], mouth: L.mouth || [0.51, 0.4], headTop: L.headTop || [0.5, 0.12], chin: L.chin || [0.5, 0.45] };
    const pt = (a) => new THREE.Vector2(a[0], 1 - a[1]);
    u.uMouth.value.copy(pt(this.marks.mouth));
    u.uEyes.value.copy(pt(this.marks.eyeL).add(pt(this.marks.eyeR)).multiplyScalar(0.5));
    this.meta = meta;
    this.mesh.visible = true; this.ready = true;
    this.layout();
    this.stage.tween(0.8, (t) => { u.uOpacity.value = t; }, 'out');
    // the other frames arrive in the background
    for (const f of FRAMES) {
      if (f === 'neutral') continue;
      loadTexture(dir + f + '.webp').then((t) => {
        if (!t) return;
        this.frames[f] = t;
        if (f === 'talk') { u.tTalk.value = t; u.uHasTalk.value = 1; }
        if (f === 'blink') { u.tBlink.value = t; u.uHasBlink.value = 1; }
      });
    }
    return true;
  }

  dispose() {
    this.stage.overlay.remove(this.mesh);
    for (const t of Object.values(this.frames)) t.dispose();
    this.mat.dispose(); this.mesh.geometry.dispose();
  }

  /** Where this actor stands on screen, for the current window shape. Sized by the head, so the three boys keep
   *  their true proportions whatever the framing of their pictures: Aghiles looms, Maximus is slight. */
  layout() {
    if (!this.ready) return;
    const a = this.stage.aspect, sc = this.info.scale, m = this.marks;
    let head, chinY, inset;
    if (a >= 1.45) { head = 0.37; chinY = 0.2; inset = 0.44; } else if (a >= 1.0) { head = 0.27; chinY = 0.44; inset = 0.34; } else { head = 0.16; chinY = 0.5; inset = 0.25; }
    const headFrac = Math.max(0.12, m.chin[1] - m.headTop[1]);
    const h = (head * sc) / headFrac, w = h * this.imgAspect;
    const faceX = this.side * (a - inset), fx = (m.chin[0] + m.headTop[0]) / 2 - 0.5;
    // the picture faces right; the right-hand actor is mirrored
    const cy = chinY + (sc - 1) * 0.22 - (0.5 - m.chin[1]) * h;
    this.mesh.scale.set(w, h, 1);
    this.mesh.position.set(this.side < 0 ? faceX - fx * w : faceX + fx * w, cy, 0);
    this.box = { x: this.mesh.position.x, y: cy, w, h };
    this.mat.uniforms.uFade.value = 0.22;
  }

  /** Overlay coordinates of a landmark given as [x, y] fractions of the picture (y from the top). */
  point(m) {
    const fx = this.side > 0 ? 1 - m[0] : m[0];
    return new THREE.Vector2(this.box.x + (fx - 0.5) * this.box.w, this.box.y + (0.5 - m[1]) * this.box.h);
  }
  /** Top of the head, for Dux to sit on. */
  headTop() { const p = this.point(this.marks.headTop); p.y -= this.box.h * 0.02; return p; }
  /** Is this overlay point over the actor's head and shoulders? */
  contains(x, y) {
    if (!this.ready) return false;
    const top = this.point(this.marks.headTop), chin = this.point(this.marks.chin), r = (top.y - chin.y);
    return Math.abs(x - (top.x + chin.x) / 2) < r * 1.1 && y < top.y + r * 0.1 && y > chin.y - r * 1.2;
  }

  /** Change expression. Frames: neutral, thinking, pleased, rattled, triumphant, sulking, look. */
  setMood(mood, hold = 0) {
    if (!this.ready) return;
    if (!this.frames[mood]) mood = 'neutral';
    clearTimeout(this.moodTimer);
    if (hold > 0) this.moodTimer = setTimeout(() => this.setMood(this.baseMood || 'neutral'), hold * 1000); else this.baseMood = mood;
    if (mood === this.mood) return;
    this.mood = mood;
    const u = this.mat.uniforms, tex = this.frames[mood], token = (this.moodToken = (this.moodToken || 0) + 1);
    if (u.uMix.value > 0.5) u.tBase.value = u.tNext.value;
    u.tNext.value = tex; u.uMix.value = 0;
    this.stage.tween(0.28, (t) => { if (this.moodToken === token) u.uMix.value = t; }, 'inOut').then(() => {
      if (this.moodToken === token) { u.tBase.value = tex; u.uMix.value = 0; }
    });
  }

  setTalking(level) { this.talkGoal = level; }
  setActive(on) { this.active = on; }

  update(dt, time) {
    if (!this.ready) return;
    const u = this.mat.uniforms;
    u.uTime.value = time;
    this.talk += (this.talkGoal - this.talk) * Math.min(1, dt * 22);
    u.uTalk.value = this.talk;
    // blink
    this.blinkAt -= dt;
    if (this.blinkAt <= 0) { this.blinkAt = 2.2 + Math.random() * 4.5; this.blink = 0.16; if (Math.random() < 0.2) this.blinkAt = 0.3; }
    if (this.blink > 0) { this.blink -= dt; u.uBlink.value = Math.sin(Math.max(0, this.blink) / 0.16 * Math.PI); } else u.uBlink.value = 0;
    const tint = this.stage.tint || [1, 1, 1];
    u.uTint.value.set(tint[0], tint[1], tint[2]);
    const goal = this.active ? 1.06 : 0.82;
    this.dim += (goal - this.dim) * Math.min(1, dt * 4);
    u.uDim.value = this.dim;
    // lean toward the pointer a little
    const px = this.stage.pointer.x * this.stage.aspect;
    u.uLean.value += ((px - this.box.x) * 0.25 - u.uLean.value) * Math.min(1, dt * 2);
    u.uBreath.value = this.stage.reduceMotion ? 0.3 : 1;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Dux. A sprite that lives on the table, hops between places and changes pose.
export class Dux {
  constructor(stage) {
    this.stage = stage; this.poses = {}; this.pose = 'sit'; this.ready = false;
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, opacity: 0 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.renderOrder = 30; this.mesh.visible = false;
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, uniforms: { uA: { value: 0.5 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uA; varying vec2 vUv; void main(){ float d = length((vUv - 0.5) * vec2(1.0, 2.6)); gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(0.5, 0.0, d) * uA); }',
    }));
    this.shadow.renderOrder = 29; this.shadow.visible = false;
    stage.overlay.add(this.shadow, this.mesh);
    this.anchor = () => new THREE.Vector2(0, 0.5); // function returning overlay coordinates of his feet
    this.at = new THREE.Vector2(0, 0.5); this.hop = 0; this.face = 1; this.size = 0.34; this.onGround = true;
  }

  async load() {
    const sit = await loadTexture('dux/sit.webp');
    if (!sit) return false;
    this.poses.sit = sit; this.mat.map = sit; this.mat.needsUpdate = true;
    this.mesh.visible = true; this.shadow.visible = true; this.ready = true;
    this.stage.tween(0.8, (t) => { this.mat.opacity = t; }, 'out');
    for (const p of DUX_POSES) if (p !== 'sit') loadTexture(`dux/${p}.webp`).then((t) => { if (t) this.poses[p] = t; });
    return true;
  }
  dispose() { this.stage.overlay.remove(this.mesh, this.shadow); for (const t of Object.values(this.poses)) t.dispose(); }

  setPose(pose, hold = 0) {
    if (!this.ready) return;
    if (!this.poses[pose]) pose = 'sit';
    clearTimeout(this.poseTimer);
    if (hold > 0) this.poseTimer = setTimeout(() => this.setPose('sit'), hold * 1000);
    this.pose = pose; this.mat.map = this.poses[pose]; this.mat.needsUpdate = true;
    this.squash = 1;
  }

  /** Hop to a new anchor (a function returning overlay coordinates). `onGround` false = perched (no shadow). */
  async goTo(anchor, { pose = 'sit', onGround = true, dur = 0.55 } = {}) {
    if (!this.ready) return;
    const from = this.at.clone(), to = anchor();
    this.face = to.x >= from.x ? 1 : -1;
    this.moving = true;
    await this.stage.tween(dur, (t) => { this.at.lerpVectors(from, anchor(), t); this.hop = Math.sin(t * Math.PI) * (0.12 + from.distanceTo(to) * 0.18); }, 'inOut');
    this.hop = 0; this.moving = false; this.anchor = anchor; this.onGround = onGround;
    this.setPose(pose);
  }

  update(dt, time) {
    if (!this.ready) return;
    if (!this.moving) this.at.lerp(this.anchor(), Math.min(1, dt * 10));
    const a = this.stage.aspect, s = this.size * (a >= 1 ? 1 : 0.8);
    this.squash = Math.max(0, (this.squash || 0) - dt * 4);
    const bob = this.stage.reduceMotion ? 0 : Math.sin(time * 2.2) * 0.004;
    const sx = s * (1 + this.squash * 0.12), sy = s * (1 - this.squash * 0.1 + bob * 3);
    this.mesh.scale.set(sx * this.face, sy, 1);
    this.mesh.position.set(this.at.x, this.at.y + sy * 0.466 + this.hop, 0);
    this.shadow.visible = this.onGround || this.moving;
    this.shadow.scale.set(s * 0.8, s * 0.5, 1);
    this.shadow.position.set(this.at.x, this.at.y + 0.01, 0);
    this.shadow.material.uniforms.uA.value = 0.5 * (1 - Math.min(1, this.hop * 4));
  }
  contains(x, y) {
    const s = this.size;
    return this.ready && Math.abs(x - this.at.x) < s * 0.4 && y > this.at.y && y < this.at.y + s * 0.9;
  }
}
