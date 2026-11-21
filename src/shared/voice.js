// Plays recorded lines (public/voice/<id>.mp3, listed in public/voice/manifest.json) and reports loudness so a
// character's lips can follow. A missing recording is not an error: the line is simply timed from its length.
const VOICE_URL = new URL('../voice/', document.baseURI).href;

export class Voice {
  constructor() { this.volume = 1; this.lines = new Set(); this.hash = {}; this.current = null; this.muted = false; }

  async init() {
    try {
      const m = await fetch(VOICE_URL + 'manifest.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null));
      if (m) { this.lines = new Set(m.lines || []); this.hash = m.hash || {}; }
    } catch (e) { /* no recordings yet */ }
  }
  has(id) { return this.lines.has(id); }

  _graph(audio) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    if (!this.ctx) { this.ctx = new C(); this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 256; this.analyser.connect(this.ctx.destination); this.buf = new Uint8Array(this.analyser.fftSize); }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    try { const src = this.ctx.createMediaElementSource(audio); src.connect(this.analyser); return src; } catch (e) { return null; }
  }

  /** Loudness of what is playing now, 0..1. */
  level() {
    if (!this.current) return 0;
    if (this.current.fake) { const t = performance.now() / 1000; return 0.35 + 0.3 * Math.sin(t * 17) + 0.25 * Math.sin(t * 29.3); }
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.buf);
    let sum = 0; for (let i = 0; i < this.buf.length; i++) { const v = (this.buf[i] - 128) / 128; sum += v * v; }
    return Math.min(1, Math.sqrt(sum / this.buf.length) * 4.5);
  }

  /** Speak a line. Resolves when it has finished (or was stopped). `text` is used for timing when there is no recording. */
  play(id, text = '') {
    this.stop();
    return new Promise((resolve) => {
      const token = (this.current = { resolve, fake: false });
      const finish = () => { if (this.current === token) this.current = null; resolve(); };
      if (this.muted || this.volume <= 0 || !this.has(id)) {
        token.fake = !this.muted && this.volume > 0 ? false : false;
        token.fake = true;
        token.timer = setTimeout(finish, Math.min(9000, 900 + text.length * 52));
        return;
      }
      const audio = new Audio(); audio.crossOrigin = 'anonymous';
      audio.src = `${VOICE_URL}${id}.mp3?v=${this.hash[id] || ''}`;
      audio.volume = this.volume;
      token.audio = audio; this._graph(audio);
      audio.onended = finish; audio.onerror = () => { token.fake = true; token.timer = setTimeout(finish, 900 + text.length * 52); };
      audio.play().catch(() => { token.fake = true; token.timer = setTimeout(finish, 900 + text.length * 52); });
    });
  }

  stop() {
    const c = this.current; if (!c) return;
    this.current = null;
    if (c.audio) { c.audio.pause(); c.audio.src = ''; }
    clearTimeout(c.timer); c.resolve();
  }
}
