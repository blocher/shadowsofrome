// Small synthesised sound effects (Web Audio): glass on marble, a sliding counter, a capture, interface ticks.
export class Sfx {
  constructor() { this.volume = 0.7; this.ctx = null; }
  _ctx() {
    if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; this.ctx = new C(); this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.out.gain.value = this.volume;
    return this.ctx;
  }
  _noise(dur) {
    const c = this.ctx, buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf; return s;
  }
  _ping(freq, dur, gain, type = 'sine', when = 0) {
    const c = this._ctx(); if (!c) return;
    const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.985, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  }
  /** Glass set down on stone. */
  click(strength = 1) {
    const c = this._ctx(); if (!c || this.volume <= 0) return;
    const n = this._noise(0.05), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    f.type = 'bandpass'; f.frequency.value = 3200 + Math.random() * 900; f.Q.value = 1.4;
    g.gain.setValueAtTime(0.5 * strength, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(f); f.connect(g); g.connect(this.out); n.start(t);
    this._ping(2100 + Math.random() * 500, 0.09, 0.1 * strength);
    this._ping(5200 + Math.random() * 800, 0.05, 0.05 * strength);
  }
  /** A counter sliding across marble. */
  slide(distance = 1) {
    const c = this._ctx(); if (!c || this.volume <= 0) return;
    const dur = Math.min(0.5, 0.14 + distance * 0.06), n = this._noise(dur), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    f.type = 'bandpass'; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1500, t + dur); f.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(this.out); n.start(t);
  }
  /** A captured piece lifted and dropped in the dish. */
  take() { this._ping(1568, 0.22, 0.12, 'triangle'); this._ping(2349, 0.3, 0.07, 'sine', 0.05); setTimeout(() => this.click(0.8), 520); }
  bind() { this._ping(196, 0.3, 0.2, 'triangle'); this._ping(294, 0.25, 0.08, 'sine', 0.03); }
  tick() { this._ping(1200, 0.04, 0.05, 'square'); }
  error() { this._ping(180, 0.14, 0.12, 'sawtooth'); }
  fanfare() { [392, 523.25, 659.25, 783.99].forEach((f, i) => { this._ping(f, 0.5, 0.1, 'triangle', i * 0.12); this._ping(f * 2, 0.4, 0.04, 'sine', i * 0.12); }); }
  low() { [330, 277, 220].forEach((f, i) => this._ping(f, 0.5, 0.09, 'triangle', i * 0.16)); }
}
