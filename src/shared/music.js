// A quiet soundtrack made on the spot: a lyre picking out slow phrases in an old mode over a low drone, in a
// little reverberant space. Nothing is downloaded and it never repeats exactly. It starts on the first tap or
// click (browsers do not allow sound before that), fades while someone is speaking, and can be turned off.
const SCENES = {
  // root frequency (Hz), the notes of the mode in semitones above it, and how busy the player is
  cubiculum: { root: 164.81, mode: [0, 1, 5, 7, 8, 12, 13, 17, 19], gap: [0.55, 1.5], rest: [3.2, 7], drone: 0.9 },   // night: Phrygian, sparse
  colosseum: { root: 146.83, mode: [0, 2, 5, 7, 9, 12, 14, 17, 19], gap: [0.38, 1.0], rest: [2.2, 5], drone: 0.6 },  // noon: brighter, a little quicker
  atrium: { root: 220.0, mode: [-12, -5, 0, 2, 3, 7, 8, 12, 14], gap: [0.5, 1.3], rest: [2.8, 6], drone: 0.8 },       // dusk: Aeolian
};

export class Music {
  constructor() { this.volume = 0.5; this.scene = 'cubiculum'; this.on = false; this.ctx = null; this.buffers = new Map(); this.timer = null; this.ducked = false; this.degree = 4; }

  /** Call from a tap or click handler. Safe to call again and again. */
  start() {
    if (this.volume <= 0) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    if (!this.ctx) this._build(new C());
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (this.on) return;
    this.on = true;
    this._level();
    this._drone(true);
    this._schedule(1.2);
  }
  stop() { this.on = false; clearTimeout(this.timer); if (this.ctx) { this._level(); this._drone(false); } }
  setVolume(v) { this.volume = v; if (v <= 0) this.stop(); else if (this.ctx) this._level(); }
  setScene(id) { if (SCENES[id] && id !== this.scene) { this.scene = id; this.degree = 4; if (this.on) this._drone(true); } }
  /** Step back while a voice is speaking. */
  duck(on) { if (this.ducked === on) return; this.ducked = on; if (this.ctx) this._level(); }

  _level() {
    const t = this.ctx.currentTime, target = this.on ? this.volume * (this.ducked ? 0.7 : 1.7) : 0;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(target, t, this.on ? 0.6 : 0.25);
  }

  _build(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5200;
    this.master.connect(tone); tone.connect(ctx.destination);
    // a small stone room: decaying filtered noise as the impulse response
    const len = Math.floor(ctx.sampleRate * 3.0), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch); let lp = 0;
      for (let i = 0; i < len; i++) { const n = Math.random() * 2 - 1; lp += (n - lp) * 0.35; d[i] = lp * Math.pow(1 - i / len, 2.6); }
    }
    this.reverb = ctx.createConvolver(); this.reverb.buffer = ir;
    this.wet = ctx.createGain(); this.wet.gain.value = 0.55;
    this.reverb.connect(this.wet); this.wet.connect(this.master);
    this.dry = ctx.createGain(); this.dry.gain.value = 0.8; this.dry.connect(this.master);
    // drone: root and fifth, breathing slowly
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 420;
    this.droneGain.connect(dlp); dlp.connect(this.dry); dlp.connect(this.reverb);
    this.droneOsc = [0, 1, 2].map((i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'sine' : 'triangle'; const g = ctx.createGain(); g.gain.value = [0.5, 0.32, 0.22][i]; o.connect(g); g.connect(this.droneGain); o.start(); return o; });
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.025; lfo.connect(lg); lg.connect(this.droneGain.gain); lfo.start();
    document.addEventListener('visibilitychange', () => { if (!this.ctx) return; if (document.hidden) this.ctx.suspend().catch(() => {}); else if (this.on) this.ctx.resume().catch(() => {}); });
  }

  _drone(on) {
    const t = this.ctx.currentTime, s = SCENES[this.scene], base = s.root / (s.root > 180 ? 4 : 2);
    this.droneOsc[0].frequency.setTargetAtTime(base, t, 1.5);
    this.droneOsc[1].frequency.setTargetAtTime(base * 1.4983, t, 1.5);
    this.droneOsc[2].frequency.setTargetAtTime(base * 2.003, t, 1.5);
    this.droneGain.gain.setTargetAtTime(on && this.on ? 0.11 * s.drone : 0, t, 2.5);
  }

  /** A plucked string (Karplus-Strong), rendered once per pitch and kept. */
  _pluck(freq) {
    const key = Math.round(freq * 10);
    let buf = this.buffers.get(key);
    if (buf) return buf;
    const sr = this.ctx.sampleRate, n = Math.max(2, Math.round(sr / freq)), len = Math.floor(sr * 3.2);
    buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0), line = new Float32Array(n);
    let lp = 0;
    for (let i = 0; i < n; i++) { const x = Math.random() * 2 - 1; lp += (x - lp) * 0.5; line[i] = lp; } // a softened burst: gut, not wire
    const damp = 0.9965 - Math.min(0.004, freq / 200000);
    for (let i = 0, p = 0; i < len; i++) { const next = (p + 1) % n, v = (line[p] + line[next]) * 0.5 * damp; d[i] = line[p]; line[p] = v; p = next; }
    for (let i = 0; i < 64; i++) d[i] *= i / 64; // no click at the start
    this.buffers.set(key, buf);
    return buf;
  }

  _note(semi, when, vel) {
    const ctx = this.ctx, s = SCENES[this.scene], freq = s.root * Math.pow(2, semi / 12);
    const src = ctx.createBufferSource(); src.buffer = this._pluck(freq);
    const g = ctx.createGain(); g.gain.value = 0.62 * vel;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = (Math.random() - 0.5) * 0.7; src.connect(g); g.connect(pan); pan.connect(this.dry); pan.connect(this.reverb); } else { src.connect(g); g.connect(this.dry); g.connect(this.reverb); }
    src.start(when);
  }

  /** Compose and queue one phrase, then arrange to be called again for the next. */
  _schedule(delay) {
    clearTimeout(this.timer);
    if (!this.on) return;
    const ctx = this.ctx, s = SCENES[this.scene], rnd = (a, b) => a + Math.random() * (b - a);
    let t = ctx.currentTime + delay;
    const notes = 3 + Math.floor(Math.random() * 5), m = s.mode;
    for (let i = 0; i < notes; i++) {
      const last = i === notes - 1;
      // a wandering line that mostly steps, sometimes leaps, and comes to rest on the root or the fifth
      let step = Math.random() < 0.72 ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -2 : 2) * (Math.random() < 0.3 ? 2 : 1);
      this.degree = Math.max(0, Math.min(m.length - 1, this.degree + step));
      if (last) this.degree = [0, 3, 5].reduce((best, k) => (Math.abs(k - this.degree) < Math.abs(best - this.degree) ? k : best), 0);
      const vel = (last ? 0.9 : rnd(0.45, 0.85)) * (i === 0 ? 1 : 0.92);
      this._note(m[this.degree], t, vel);
      if (Math.random() < (last ? 0.5 : 0.14) && this.degree >= 3) this._note(m[this.degree - 3], t + 0.02, vel * 0.55); // a second string underneath
      t += rnd(s.gap[0], s.gap[1]) * (last ? 1 : Math.random() < 0.2 ? 0.5 : 1);
    }
    const rest = rnd(s.rest[0], s.rest[1]);
    this.timer = setTimeout(() => this._schedule(0.1), Math.max(500, (t - ctx.currentTime + rest) * 1000));
  }
}
