// Turns clicks on the board into moves. One instance serves the game, the tutorial and the puzzles.
import { legalMoves, trapsOfMove } from '../engine/engine.js';

export class BoardInput {
  constructor(stage) {
    this.stage = stage; this.board = null; this.pending = null; this.onActorClick = null; this.onHover = null;
    const c = stage.canvas;
    let down = null;
    c.addEventListener('pointerdown', (e) => { if (e.button === 0) down = { x: e.clientX, y: e.clientY }; });
    c.addEventListener('pointerup', (e) => {
      if (e.button !== 0 || !down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
      if (moved < 12) this._click(e.clientX, e.clientY);
    });
    c.addEventListener('pointermove', (e) => this._move(e.clientX, e.clientY));
    c.addEventListener('pointerleave', () => { if (this.board) this.board.setHover(-1); });
  }
  setBoard(board) { this.board = board; }

  overlayPoint(x, y) {
    const r = this.stage.canvas.getBoundingClientRect();
    return { x: (((x - r.left) / r.width) * 2 - 1) * this.stage.aspect, y: -(((y - r.top) / r.height) * 2 - 1) };
  }

  /** Ask the player for a move in `state`. Options: allow(move) filters legal moves; onSelect(square). Resolves to a move, or null if cancelled. */
  request(state, opts = {}) {
    this.cancel();
    return new Promise((resolve) => {
      const all = legalMoves(state), moves = opts.allow ? all.filter(opts.allow) : all;
      this.pending = { state, moves, resolve, selected: -1, opts };
      if (state.chain >= 0) this._select(state.chain);
    });
  }
  cancel() {
    const p = this.pending; if (!p) return;
    this.pending = null;
    if (this.board) { if (p.selected >= 0) this.board.lift(p.selected, false); this.board.setSelection(-1); this.board.setHover(-1); }
    p.resolve(null);
  }
  /** Submit a move from outside (the "end turn" button, a hint being accepted). */
  submit(move) {
    const p = this.pending; if (!p) return;
    this.pending = null;
    if (p.selected >= 0) this.board.lift(p.selected, false);
    this.board.setSelection(-1); this.board.setHover(-1);
    p.resolve(move);
  }

  _select(i) {
    const p = this.pending, b = this.board;
    if (p.selected >= 0) b.lift(p.selected, false);
    p.selected = i;
    if (i < 0) { b.setSelection(-1); return; }
    b.lift(i, true);
    const targets = p.moves.filter((m) => m.t === 'm' && m.from === i).map((m) => ({ to: m.to, takes: trapsOfMove(p.state, m).length > 0 }));
    b.setSelection(i, targets);
    p.opts.onSelect && p.opts.onSelect(i);
  }

  _click(x, y) {
    const o = this.overlayPoint(x, y);
    if (this.onActorClick && this.onActorClick(o.x, o.y)) return;
    const p = this.pending, b = this.board;
    if (!p || !b) return;
    const i = b.squareAtScreen(x, y);
    if (i < 0) { if (p.state.chain < 0) this._select(-1); return; }
    if (p.state.phase === 'place') {
      const m = p.moves.find((mv) => mv.t === 'p' && mv.to === i);
      if (m) this.submit(m); else p.opts.onIllegal && p.opts.onIllegal(i);
      return;
    }
    if (p.selected >= 0) {
      const m = p.moves.find((mv) => mv.t === 'm' && mv.from === p.selected && mv.to === i);
      if (m) { this.submit(m); return; }
    }
    if (p.state.chain >= 0) return; // only the capturing piece may continue
    if (p.moves.some((mv) => mv.t === 'm' && mv.from === i)) this._select(i === p.selected ? -1 : i);
    else if (p.state.board[i] * p.state.turn > 0 || p.selected >= 0) { p.opts.onIllegal && p.opts.onIllegal(i); if (p.state.board[i] === 0) this._select(-1); }
  }

  _move(x, y) {
    const o = this.overlayPoint(x, y);
    this.onHover && this.onHover(o.x, o.y);
    const p = this.pending, b = this.board;
    if (!b) return;
    if (!p) { b.setHover(-1); return; }
    const i = b.squareAtScreen(x, y);
    let ok = false;
    if (i >= 0) {
      if (p.state.phase === 'place') ok = p.moves.some((m) => m.to === i);
      else ok = p.moves.some((m) => m.t === 'm' && (m.from === i || (m.from === p.selected && m.to === i)));
    }
    b.setHover(ok ? i : -1);
    this.stage.canvas.style.cursor = ok ? 'pointer' : 'default';
  }
}
