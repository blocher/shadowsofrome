// Who says what, and when. The director owns the two actors, Dux, the voice and the speech bubbles, so that only
// one character speaks at a time and lines are not repeated until the pool is used up.
import * as THREE from 'three';
import { CHARACTER_ORDER } from '../../shared/characters.js';

export class Director {
  /** @param app { stage, voice, ui, banter: { BANTER, BANTER_VS } } */
  constructor(app) {
    this.app = app; this.actors = [null, null]; this.dux = null; this.used = new Map(); this.busy = false; this.lastBanter = 0; this.quiet = false;
    this.speaking = null; this.chattiness = 1;
    app.stage.frameHooks.push((dt, time) => this._tick(dt, time));
  }

  setCast(left, right, dux) { this.actors = [left, right]; this.dux = dux; }
  seatOf(charId) { return this.actors.findIndex((a) => a && a.id === charId); }
  /** The boy who is not playing: he coaches and comments from the side. */
  bystander() { return CHARACTER_ORDER.find((id) => this.seatOf(id) < 0); }

  _tick(dt, time) {
    const lvl = this.speaking ? this.app.voice.level() : 0;
    for (const a of this.actors) if (a) { a.setTalking(this.speaking && this.speaking.actor === a ? lvl : 0); a.update(dt, time); }
    if (this.dux) {
      this.dux.update(dt, time);
      // left to himself, Dux fidgets: a nut, a nap, a bit of scolding
      this.duxIdle = (this.duxIdle ?? 9) - dt;
      if (this.duxIdle <= 0) {
        this.duxIdle = 8 + Math.random() * 10;
        if (this.dux.ready && !this.dux.moving && this.dux.pose === 'sit' && this.dux.onGround) this.dux.setPose(['eat', 'eat', 'chatter', 'sleep', 'scared'][Math.floor(Math.random() * 5)], 2.5 + Math.random() * 3);
      }
    }
  }

  pick(pool, key) {
    if (!pool || !pool.length) return null;
    let used = this.used.get(key);
    if (!used || used.size >= pool.length) { used = new Set(); this.used.set(key, used); }
    const fresh = pool.filter((l) => !used.has(l.id));
    const line = fresh[Math.floor(Math.random() * fresh.length)];
    used.add(line.id);
    return line;
  }

  /** Speak one line and wait for it to finish. `who` is a speaker id (a boy, 'narrator', 'blandula', ...). */
  async say(who, line, { mood, hold = 0.35 } = {}) {
    if (!line) return;
    const seat = this.seatOf(who), actor = seat >= 0 ? this.actors[seat] : null;
    this.busy = true;
    this.speaking = { actor, who };
    const m = mood || line.mood;
    if (actor && m) actor.setMood(m, 0);
    if (actor) actor.setActive(true);
    this.app.ui.showLine(who, line.text, seat);
    await this.app.voice.play(line.id, line.text);
    this.speaking = null;
    if (hold) await this.app.stage.wait(hold);
    this.app.ui.hideLine(who);
    if (actor && m && m !== 'neutral') actor.setMood('neutral', 0);
    this.busy = false; this.lastBanter = performance.now();
  }
  stopSpeaking() { this.app.voice.stop(); }

  /**
   * A line of table talk for an event, if nobody is speaking. Returns a promise that resolves when the line is over
   * (or at once if nothing was said). opts: { vs: opponentId, chance, force, gap } (gap: minimum seconds since the last line).
   */
  async banter(event, who, opts = {}) {
    const { BANTER, BANTER_VS } = this.app.banter;
    if (this.quiet && !opts.force) return false;
    if (this.busy) { if (!opts.force) return false; while (this.busy) await this.app.stage.wait(0.1); }
    if (!opts.force) {
      if (Math.random() > (opts.chance ?? 1) * this.chattiness) return false;
      if (performance.now() - this.lastBanter < (opts.gap ?? 5) * 1000) return false;
    }
    let pool = null, key = `${event}:${who}`;
    if (opts.vs && BANTER_VS[event] && BANTER_VS[event][`${who}>${opts.vs}`] && Math.random() < 0.55) { pool = BANTER_VS[event][`${who}>${opts.vs}`]; key += '>' + opts.vs; }
    if (!pool) pool = BANTER[event] && BANTER[event][who];
    const line = this.pick(pool, key);
    if (!line) return false;
    await this.say(who, line, { mood: opts.mood });
    return true;
  }

  mood(seat, mood, hold = 2.5) { const a = this.actors[seat]; if (a) a.setMood(mood, hold); }
  setTurn(seat) { this.actors.forEach((a, i) => a && a.setActive(i === seat)); }

  // ---- Dux -----------------------------------------------------------------------------------------------------
  anchors(board) {
    const st = this.app.stage, far = -(board.cols / 2 + 1.2);
    const world = (v) => () => st.toOverlay(v);
    this.duxAnchors = {
      // Dux keeps to the far corner of the table on his master's side (Titus'), or the right if Titus is not playing
      home: () => (st.aspect < 1 ? st.toOverlay(new THREE.Vector3(0, 0, far - 0.35)) : st.toOverlay(new THREE.Vector3((this.seatOf('titus') === 0 ? -1 : 1) * (board.rows / 2 + 1.0), 0, far - 0.2))),
      left: world(new THREE.Vector3(-(board.rows / 2 + 2.2), 0, far + 0.6)),
      right: world(new THREE.Vector3(board.rows / 2 + 2.2, 0, far + 0.6)),
      tray0: world(board.trayPosition(0).add(new THREE.Vector3(1.1, 0, -0.2))),
      tray1: world(board.trayPosition(1).add(new THREE.Vector3(-1.1, 0, -0.2))),
      head0: () => (this.actors[0] && this.actors[0].ready ? this.actors[0].headTop() : this.duxAnchors.left()),
      head1: () => (this.actors[1] && this.actors[1].ready ? this.actors[1].headTop() : this.duxAnchors.right()),
      square: (i) => world(board.pos(i).add(new THREE.Vector3(0, 0, -0.9))),
    };
    if (this.dux && this.dux.ready) { this.dux.anchor = this.duxAnchors.home; this.dux.at.copy(this.duxAnchors.home()); }
  }
  async duxGo(name, pose = 'sit', arg) {
    if (!this.dux || !this.dux.ready || !this.duxAnchors) return;
    const anchor = name === 'square' ? this.duxAnchors.square(arg) : this.duxAnchors[name];
    await this.dux.goTo(anchor, { pose, onGround: !name.startsWith('head') });
  }
  duxPose(pose, hold = 0) { if (this.dux) this.dux.setPose(pose, hold); }
}
