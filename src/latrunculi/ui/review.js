// Post-game analysis: an advantage graph, every move graded, the turning points in words, and a replay you can
// step through or play on from.
import { applyMove, notate, sq } from '../engine/engine.js';
import { CHARACTERS, GLASS } from '../../shared/characters.js';
import { el, esc } from './ui.js';

const TAG_WORDS = { best: 'best', brilliant: 'brilliant', good: 'good', inaccuracy: 'inaccuracy', mistake: 'mistake', blunder: 'blunder' };

export class ReviewPanel {
  constructor(app, session, onClose) {
    this.app = app; this.onClose = onClose;
    this.rules = session.rules; this.seats = session.seats; this.setting = session.cfg.setting; this.glass = [session.glassOf(0), session.glassOf(1)];
    this.moves = session.log.map((e) => e.move);
    this.by = session.log.map((e) => e.by);
    this.texts = session.log.map((e) => e.text);
    // positions[k] is the position before move k; the last entry is the final position
    this.positions = session.log.map((e) => e.state); this.positions.push(session.state);
    this.start = this.positions[0];
    this.cur = this.positions.length - 1;
    this.data = null;
  }

  name(seat) { return CHARACTERS[this.seats[seat].char].name; }

  async open() {
    const app = this.app;
    app.ui.showHud(false);
    if (app.stage.aspect >= 1.2) { app.stage.shiftX = -0.2; app.stage.fitCamera(); if (app.actors[1]) app.actors[1].mesh.visible = false; }
    const p = this.panel = el(`<div class="review panel">
      <h2>The game, move by move <button class="btn ghost small" data-a="close">Close</button></h2>
      <div class="progress"><i></i></div>
      <canvas width="800" height="260" aria-label="Advantage through the game"></canvas>
      <div class="acc"><span>${esc(this.name(0))} <b data-f="a0">…</b></span><span>accuracy</span><span><b data-f="a1">…</b> ${esc(this.name(1))}</span></div>
      <div class="turns" data-f="turns"><i>Studying the game…</i></div>
      <div class="moves" data-f="moves"></div>
      <div class="note" data-f="note">Step through the game with the arrows, or click the graph.</div>
      <div class="stepper"><button class="btn small" data-a="first">⏮</button><button class="btn small" data-a="prev">◀ Back</button><button class="btn small" data-a="next">Forward ▶</button><button class="btn small" data-a="last">⏭</button><button class="btn small primary" data-a="playon">Play on from here</button></div>
    </div>`);
    app.ui.root.append(p);
    this.f = {}; for (const n of p.querySelectorAll('[data-f]')) this.f[n.dataset.f] = n;
    this.canvas = p.querySelector('canvas');
    p.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a], [data-ply]'); if (!b) return;
      if (b.dataset.ply !== undefined) return this.go(+b.dataset.ply);
      const a = b.dataset.a;
      if (a === 'close') this.close();
      else if (a === 'first') this.go(0); else if (a === 'prev') this.go(this.cur - 1); else if (a === 'next') this.go(this.cur + 1); else if (a === 'last') this.go(this.positions.length - 1);
      else if (a === 'playon') this.playOn();
    });
    this.canvas.addEventListener('click', (e) => { const r = this.canvas.getBoundingClientRect(); this.go(Math.round(((e.clientX - r.left) / r.width) * (this.positions.length - 1))); });
    this.keys = (e) => { if (e.key === 'ArrowLeft') this.go(this.cur - 1); else if (e.key === 'ArrowRight') this.go(this.cur + 1); };
    window.addEventListener('keydown', this.keys);
    this.renderMoves(); this.go(this.cur); this.drawGraph();
    const bar = p.querySelector('.progress i');
    try {
      this.data = await app.ai.review(this.start, this.moves, { timeMs: 220, names: { 1: this.name(0), '-1': this.name(1) } }, (pr) => { bar.style.width = `${Math.round((pr.done / Math.max(1, pr.total)) * 100)}%`; });
    } catch (e) { console.error(e); }
    if (this.closed) return;
    p.querySelector('.progress').classList.add('hidden');
    if (this.data) { this.renderMoves(); this.renderSummary(); this.drawGraph(); this.go(this.cur); } else this.f.turns.innerHTML = '<i>The analysis could not be completed.</i>';
  }

  close(silent) {
    if (this.closed) return;
    this.closed = true;
    window.removeEventListener('keydown', this.keys);
    this.app.ai.cancel();
    this.panel.remove();
    this.app.stage.shiftX = 0; this.app.stage.fitCamera(); if (this.app.actors[1] && this.app.actors[1].ready) this.app.actors[1].mesh.visible = true;
    this.app.board.clearMarks();
    if (!silent && this.onClose) this.onClose();
  }

  ply(k) { return this.data && this.data.plies ? this.data.plies[k] : null; }

  renderMoves() {
    const rows = this.moves.map((m, k) => {
      const seat = this.by[k], g = GLASS[this.glass[seat]], d = this.ply(k);
      const tag = d && d.tag && d.tag !== 'good' ? `<span class="tag ${d.tag}">${TAG_WORDS[d.tag] || d.tag}</span>` : '';
      return `<button class="mv" data-ply="${k + 1}"><span class="p">${k + 1}</span><i style="background:${g.css}"></i><span>${esc(this.texts[k])}</span>${tag}</button>`;
    }).join('');
    this.f.moves.innerHTML = rows || '<p style="padding:.5em">No moves were played.</p>';
  }

  renderSummary() {
    const d = this.data, acc = d.accuracy || {};
    this.f.a0.textContent = acc.white != null ? `${Math.round(acc.white)}%` : '–';
    this.f.a1.textContent = acc.black != null ? `${Math.round(acc.black)}%` : '–';
    const tp = (d.turningPoints || []).slice(0, 3);
    this.f.turns.innerHTML = tp.length
      ? '<b style="font-family:var(--caps);font-size:.7rem;letter-spacing:.16em;color:var(--gold)">TURNING POINTS</b>' + tp.map((t) => `<button data-ply="${t.ply + 1}">Move ${t.ply + 1}: ${esc(t.text || '')}</button>`).join('')
      : '<i>A steady game: no single move decided it.</i>';
  }

  drawGraph() {
    const c = this.canvas, x = c.getContext('2d'), W = c.width, H = c.height, n = this.positions.length - 1;
    x.clearRect(0, 0, W, H);
    const g0 = GLASS[this.glass[0]].css, g1 = GLASS[this.glass[1]].css;
    x.fillStyle = 'rgba(255,255,255,0.04)'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(230,185,92,0.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
    const graph = this.data && this.data.graph;
    if (graph && graph.length) {
      const clamp = (v) => Math.max(-6, Math.min(6, v)), px = (i) => (n ? (i / n) * W : 0), py = (v) => H / 2 - (clamp(v) / 6) * (H / 2 - 8);
      const pts = graph.map((v, i) => [px(i), py(v)]);
      for (const [sign, color] of [[1, g0], [-1, g1]]) {
        x.save(); x.beginPath(); x.rect(0, sign > 0 ? 0 : H / 2, W, H / 2); x.clip();
        x.beginPath(); x.moveTo(0, H / 2); for (const [a, b] of pts) x.lineTo(a, b); x.lineTo(pts[pts.length - 1][0], H / 2); x.closePath();
        x.globalAlpha = 0.55; x.fillStyle = color; x.fill(); x.restore();
      }
      x.strokeStyle = '#f7dc9a'; x.lineWidth = 2.5; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke();
      (this.data.plies || []).forEach((d, k) => {
        if (d.tag !== 'blunder' && d.tag !== 'mistake' && d.tag !== 'brilliant') return;
        x.fillStyle = d.tag === 'brilliant' ? '#7ddba0' : d.tag === 'blunder' ? '#ff6a50' : '#f39a4a';
        x.beginPath(); x.arc(px(k + 1), py(graph[k + 1] ?? 0), 6, 0, 7); x.fill();
      });
    } else { x.fillStyle = 'rgba(244,234,215,0.5)'; x.font = '28px serif'; x.fillText('…', W / 2 - 8, H / 2 - 12); }
    const cx = n ? (this.cur / n) * W : 0;
    x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, H); x.stroke();
    x.fillStyle = 'rgba(244,234,215,0.75)'; x.font = '22px serif';
    x.fillText(this.name(0) + ' ahead', 10, 26); x.fillText(this.name(1) + ' ahead', 10, H - 12);
  }

  go(k) {
    k = Math.max(0, Math.min(this.positions.length - 1, k));
    this.cur = k;
    const b = this.app.board, state = this.positions[k];
    b.sync(state); b.clearMarks();
    const prev = k > 0 ? this.moves[k - 1] : null;
    b.setLast(prev ? (prev.t === 'm' ? [prev.from, prev.to] : prev.t === 'p' ? [prev.to] : []) : []);
    for (const n of this.f.moves.querySelectorAll('.mv')) n.classList.toggle('cur', +n.dataset.ply === k);
    const curNode = this.f.moves.querySelector('.mv.cur'); if (curNode) curNode.scrollIntoView({ block: 'nearest' });
    // commentary on the move that led here, and the better move if there was one
    let note = k === 0 ? 'The starting position.' : `Move ${k}, ${this.name(this.by[k - 1])}: ${this.texts[k - 1]}.`;
    const d = k > 0 ? this.ply(k - 1) : null;
    if (d) {
      const before = this.positions[k - 1];
      if (d.tag && d.tag !== 'good') note += ` ${d.tag === 'best' ? 'The best move.' : d.tag === 'brilliant' ? 'Brilliant: a sacrifice that works.' : `A${d.tag === 'inaccuracy' ? 'n' : ''} ${d.tag}${d.loss >= 0.4 ? `, costing about ${d.loss.toFixed(1)} of a piece` : ''}.`}`;
      const better = d.best && !(d.best.t === d.move.t && d.best.from === d.move.from && d.best.to === d.move.to);
      if (better && d.tag !== 'best' && d.tag !== 'good' && d.tag !== 'brilliant') {
        note += ` Better was ${notate(before, d.best)}.`;
        if (d.best.t === 'm') b.setHint({ from: d.best.from, to: d.best.to, showTo: true }); else if (d.best.t === 'p') b.setHint({ from: -1, to: d.best.to, showTo: true });
      }
      const tp = (this.data.turningPoints || []).find((t) => t.ply === k - 1); if (tp && tp.text) note += ' ' + tp.text;
    }
    if (k === this.positions.length - 1 && state.over) note += state.over.winner ? ` ${this.name(state.over.winner > 0 ? 0 : 1)} won.` : ' A draw.';
    this.f.note.textContent = note;
    this.drawGraph();
  }

  /** Leave the review and continue from the position on screen: you take the side to move, the AI the other. */
  playOn() {
    const state = this.positions[this.cur];
    if (state.over) { this.app.ui.toast('The game is already over here. Step back first.'); return; }
    const mover = state.turn > 0 ? 0 : 1;
    const seats = this.seats.map((s, i) => ({ ...s, kind: i === mover ? 'human' : 'ai', level: s.level || 3 }));
    const fresh = { ...state, history: [state.key], over: null, last: null };
    this.close(true); this.app.review = null;
    this.app.startGame({ rules: this.rules, seats, setting: this.setting, startState: fresh, coach: true, glass: this.glass });
  }
}
