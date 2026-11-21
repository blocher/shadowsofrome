// Ludus Latrunculorum rules engine. Pure functions over plain state objects; no DOM, no randomness.
//
//   createGame(rules)        -> state
//   legalMoves(state)        -> Move[]
//   applyMove(state, move)   -> new state (the old one is untouched); state.last describes what happened
//   state.over               -> null, or { winner: 1 | -1 | 0, reason }
//
// Players: WHITE = 1 (starts at the bottom, rows 0..), BLACK = -1. Board cells: 0 empty, ±1 man, ±2 dux.
// Moves:   { t: 'p', to }            place a piece (placement phase)
//          { t: 'm', from, to, hop } move a piece (hop: true when it leaps over pieces)
//          { t: 'x' }                decline the extra move earned by a capture
import { normalizeRules } from './rules.js';

export const WHITE = 1;
export const BLACK = -1;

// ---------------------------------------------------------------------------------------------------------------
// Board geometry, cached per size.
const GEO = new Map();
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (t ^ (t >>> 14)) >>> 0; };
}
export function geometry(cols, rows) {
  const key = cols * 100 + rows;
  let g = GEO.get(key);
  if (g) return g;
  const n = cols * rows;
  const nb = new Int16Array(n * 4).fill(-1); // east, west, north, south
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = (i / cols) | 0;
    if (c + 1 < cols) nb[i * 4] = i + 1;
    if (c > 0) nb[i * 4 + 1] = i - 1;
    if (r + 1 < rows) nb[i * 4 + 2] = i + cols;
    if (r > 0) nb[i * 4 + 3] = i - cols;
  }
  const corners = [
    [0, 1, cols], [cols - 1, cols - 2, 2 * cols - 1],
    [n - cols, n - cols + 1, n - 2 * cols], [n - 1, n - 2, n - cols - 1],
  ];
  const rnd = mulberry(0x51a7 + key);
  const z1 = new Int32Array(n * 8), z2 = new Int32Array(n * 8), c1 = new Int32Array(n), c2 = new Int32Array(n);
  for (let i = 0; i < n * 8; i++) { z1[i] = rnd() | 0; z2[i] = rnd() | 0; }
  for (let i = 0; i < n; i++) { c1[i] = rnd() | 0; c2[i] = rnd() | 0; }
  g = { n, cols, rows, nb, corners, z1, z2, c1, c2, t1: rnd() | 0, t2: rnd() | 0, p1: rnd() | 0, p2: rnd() | 0 };
  GEO.set(key, g);
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// Construction.
export function createGame(rulesInput) {
  const rules = normalizeRules(rulesInput);
  const { cols, rows } = rules;
  const g = geometry(cols, rows);
  const s = {
    rules, cols, rows,
    board: new Int8Array(g.n),
    capA: new Int16Array(g.n).fill(-1), // for a bound piece: the two squares of its captors
    capB: new Int16Array(g.n).fill(-1),
    turn: rules.first,
    phase: 'move',
    toPlace: [0, 0], duxToPlace: [0, 0], placed: 0,
    chain: -1,            // square of the piece that may move again after a capture
    captured: [0, 0],     // pieces taken BY white, BY black
    quiet: 0,             // plies since the last capture
    ply: 0,
    history: [],          // position keys since the move phase began (for repetition)
    key: 0,
    over: null,
    last: null,
  };
  if (rules.setup === 'placement') {
    s.phase = 'place';
    s.toPlace = [rules.men, rules.men];
    if (rules.dux !== 'none') s.duxToPlace = [1, 1];
  } else {
    let left = rules.men, r = 0;
    while (left > 0) {
      const k = Math.min(cols, left), start = (cols - k) >> 1;
      for (let c = start; c < start + k; c++) {
        s.board[r * cols + c] = WHITE;
        s.board[(rows - 1 - r) * cols + (cols - 1 - c)] = BLACK;
      }
      left -= k; r++;
    }
    if (rules.dux !== 'none') {
      const c = cols >> 1;
      s.board[r * cols + c] = 2 * WHITE;
      s.board[(rows - 1 - r) * cols + (cols - 1 - c)] = 2 * BLACK;
    }
  }
  s.key = hashOf(s);
  s.history = [s.key];
  return s;
}

/** Build a state from a diagram, for puzzles and tests. Rows are listed top (far side) first.
 *  Characters: . empty, w / W white man / dux, b / B black man / dux. The board takes its size from the diagram. */
export function fromDiagram(rulesInput, lines, turn = WHITE) {
  const rows = lines.length, cols = lines[0].replace(/\s/g, '').length;
  const s = createGame({ ...normalizeRules(rulesInput), cols, rows });
  s.board.fill(0);
  lines.forEach((line, li) => {
    const row = rows - 1 - li;
    [...line.replace(/\s/g, '')].forEach((ch, c) => {
      s.board[row * cols + c] = ch === 'w' ? 1 : ch === 'W' ? 2 : ch === 'b' ? -1 : ch === 'B' ? -2 : 0;
    });
  });
  s.turn = turn; s.phase = 'move'; s.toPlace = [0, 0]; s.duxToPlace = [0, 0]; s.placed = 0;
  s.key = hashOf(s); s.history = [s.key]; s.over = null;
  return s;
}

function cloneState(s) {
  return {
    ...s,
    board: s.board.slice(), capA: s.capA.slice(), capB: s.capB.slice(),
    toPlace: [s.toPlace[0], s.toPlace[1]], duxToPlace: [s.duxToPlace[0], s.duxToPlace[1]],
    captured: [s.captured[0], s.captured[1]],
    last: null,
  };
}

export function hashOf(s) {
  const g = geometry(s.cols, s.rows), b = s.board;
  let h1 = 0, h2 = 0;
  for (let i = 0; i < g.n; i++) {
    const v = b[i];
    if (v === 0) continue;
    const idx = i * 8 + (v > 0 ? 0 : 2) + (v === 2 || v === -2 ? 1 : 0) + (s.capA[i] >= 0 ? 4 : 0);
    h1 ^= g.z1[idx]; h2 ^= g.z2[idx];
  }
  if (s.turn === BLACK) { h1 ^= g.t1; h2 ^= g.t2; }
  if (s.phase === 'place') { h1 ^= g.p1 + s.toPlace[0] * 31 + s.toPlace[1] * 977 + s.placed; h2 ^= g.p2; }
  if (s.chain >= 0) { h1 ^= g.c1[s.chain]; h2 ^= g.c2[s.chain]; }
  return (h1 >>> 11) * 4294967296 + (h2 >>> 0);
}

// ---------------------------------------------------------------------------------------------------------------
// Queries.
export const isBound = (s, i) => s.capA[i] >= 0;
export const sq = (s, i) => String.fromCharCode(97 + (i % s.cols)) + (((i / s.cols) | 0) + 1);
export const sqIndex = (s, name) => (name.charCodeAt(0) - 97) + (parseInt(name.slice(1), 10) - 1) * s.cols;

export function countPieces(s) {
  let w = 0, b = 0;
  for (let i = 0; i < s.board.length; i++) { const v = s.board[i]; if (v > 0) w++; else if (v < 0) b++; }
  return [w, b];
}

/** Pieces that would be trapped if `mover` had just arrived on `to`. Returns [{ at, a, b }] (victim, its two captors). */
export function findTraps(s, to, mover) {
  const g = geometry(s.cols, s.rows), b = s.board, R = s.rules, out = [];
  const safeDux = R.dux === 'immobilise';
  for (let d = 0; d < 4; d++) {
    const a = g.nb[to * 4 + d];
    if (a < 0) continue;
    const v = b[a];
    if (v * mover >= 0 || s.capA[a] >= 0) continue;
    if (safeDux && (v === 2 || v === -2)) continue;
    const far = g.nb[a * 4 + d];
    if (far < 0) continue;
    if (b[far] * mover > 0 && s.capA[far] < 0) out.push({ at: a, a: to, b: far });
  }
  if (R.cornerCapture) {
    for (const [c, x, y] of g.corners) {
      if (to !== x && to !== y) continue;
      const v = b[c];
      if (v * mover >= 0 || s.capA[c] >= 0) continue;
      if (safeDux && (v === 2 || v === -2)) continue;
      if (b[x] * mover > 0 && b[y] * mover > 0 && s.capA[x] < 0 && s.capA[y] < 0) out.push({ at: c, a: x, b: y });
    }
  }
  return R.multiCapture ? out : out.slice(0, 1);
}

/** What a move would trap, without building a new state. */
export function trapsOfMove(s, mv) {
  if (mv.t !== 'm') return [];
  const b = s.board, piece = b[mv.from];
  b[mv.from] = 0; b[mv.to] = piece;
  const t = findTraps(s, mv.to, piece > 0 ? 1 : -1);
  b[mv.to] = 0; b[mv.from] = piece;
  return t;
}

function betweenEnemies(s, from, to, mover) {
  const g = geometry(s.cols, s.rows), b = s.board;
  for (let d = 0; d < 4; d += 2) {
    const x = g.nb[to * 4 + d], y = g.nb[to * 4 + d + 1];
    if (x < 0 || y < 0 || x === from || y === from) continue;
    if (b[x] * mover < 0 && b[y] * mover < 0 && s.capA[x] < 0 && s.capA[y] < 0) return true;
  }
  return false;
}

function genPiece(s, i, out) {
  const g = geometry(s.cols, s.rows), b = s.board, R = s.rules;
  const piece = b[i], mover = piece > 0 ? 1 : -1;
  const first = out.length;
  const seen = new Set();
  for (let d = 0; d < 4; d++) {
    let t = g.nb[i * 4 + d];
    while (t >= 0 && b[t] === 0) {
      out.push({ t: 'm', from: i, to: t }); seen.add(t);
      if (R.move !== 'slide') break;
      t = g.nb[t * 4 + d];
    }
  }
  const mode = R.jump;
  if (mode !== 'none' && !(mode === 'duxEnemy' && piece !== 2 && piece !== -2)) {
    const visited = new Set([i]), stack = [i];
    while (stack.length) {
      const cur = stack.pop();
      for (let d = 0; d < 4; d++) {
        const mid = g.nb[cur * 4 + d];
        if (mid < 0 || mid === i) continue;
        const land = g.nb[mid * 4 + d];
        if (land < 0 || b[land] !== 0 || visited.has(land)) continue;
        const m = b[mid];
        if (m === 0) continue;
        const own = m * mover > 0, bound = s.capA[mid] >= 0;
        const ok = mode === 'any' ? true : mode === 'duxEnemy' ? !own : (own && !bound) || (!own && bound);
        if (!ok) continue;
        visited.add(land);
        if (!seen.has(land)) { out.push({ t: 'm', from: i, to: land, hop: true }); seen.add(land); }
        if (R.multiJump) stack.push(land);
      }
    }
  }
  if (!R.safeEntry) {
    let w = first;
    for (let k = first; k < out.length; k++) {
      const mv = out[k];
      if (betweenEnemies(s, mv.from, mv.to, mover) && trapsOfMove(s, mv).length === 0) continue;
      out[w++] = mv;
    }
    out.length = w;
  }
}

export function legalMoves(s) {
  const out = [];
  if (s.over) return out;
  const b = s.board;
  if (s.phase === 'place') {
    for (let i = 0; i < b.length; i++) if (b[i] === 0) out.push({ t: 'p', to: i });
    return out;
  }
  if (s.chain >= 0) {
    genPiece(s, s.chain, out);
    out.push({ t: 'x' });
    return out;
  }
  const me = s.turn;
  for (let i = 0; i < b.length; i++) if (b[i] * me > 0 && s.capA[i] < 0) genPiece(s, i, out);
  return out;
}

export function movesFrom(s, i) {
  return legalMoves(s).filter((m) => m.t === 'm' && m.from === i);
}

export function sameMove(a, b) {
  return a.t === b.t && a.to === b.to && a.from === b.from;
}

// ---------------------------------------------------------------------------------------------------------------
// Applying a move.
function duxImmobilised(s, side) {
  const g = geometry(s.cols, s.rows), b = s.board;
  for (let i = 0; i < b.length; i++) {
    if (b[i] !== 2 * side) continue;
    let enemy = false;
    for (let d = 0; d < 4; d++) {
      const t = g.nb[i * 4 + d];
      if (t < 0) continue;
      if (b[t] === 0) return false;
      if (b[t] * side < 0) enemy = true;
    }
    return enemy;
  }
  return false;
}

function byCount(s, reason) {
  const [w, b] = countPieces(s);
  return { winner: w > b ? WHITE : b > w ? BLACK : 0, reason };
}

function judge(s, mover, track) {
  const R = s.rules;
  if (s.phase !== 'move') return null;
  if (R.dux === 'immobilise') {
    if (duxImmobilised(s, -mover)) return { winner: mover, reason: 'dux' };
    if (duxImmobilised(s, mover)) return { winner: -mover, reason: 'dux' };
  }
  const [w, b] = countPieces(s);
  const floor = R.loseAt + (R.dux === 'immobilise' ? 1 : 0);
  if (w <= floor || b <= floor) {
    if (w <= floor && b <= floor) return { winner: mover, reason: 'pieces' };
    return { winner: w <= floor ? BLACK : WHITE, reason: 'pieces' };
  }
  if (R.quietLimit && s.quiet >= R.quietLimit) return byCount(s, 'limit');
  if (track) {
    let seen = 0;
    for (let i = s.history.length - 1; i >= 0; i--) if (s.history[i] === s.key && ++seen >= 3) return byCount(s, 'repetition');
  }
  if (s.chain < 0 && legalMoves(s).length === 0) {
    return R.noMoves === 'lose' ? { winner: -s.turn, reason: 'blocked' } : byCount(s, 'blocked');
  }
  return null;
}

/**
 * Apply a legal move. `track` keeps the repetition history (the AI turns it off while searching).
 * The result's `last` field lists what happened, for animation and commentary:
 *   { move, by, piece, captured: [squares], bound: [squares], freed: [squares], removed: [squares], extra: bool }
 */
export function applyMove(s, mv, track = true) {
  const n = cloneState(s), R = s.rules, me = s.turn, k = me === WHITE ? 0 : 1;
  const info = { move: mv, by: me, piece: 0, captured: [], bound: [], freed: [], removed: [], extra: false };
  n.ply = s.ply + 1;
  let next = -me;

  if (mv.t === 'p') {
    let piece;
    if (n.toPlace[k] > 0) { piece = me; n.toPlace[k]--; } else { piece = 2 * me; n.duxToPlace[k]--; }
    n.board[mv.to] = piece; info.piece = piece; n.placed++;
    const mine = n.toPlace[k] + n.duxToPlace[k];
    if (n.placed < R.placePerTurn && mine > 0) next = me; else n.placed = 0;
    if (n.toPlace[0] + n.toPlace[1] + n.duxToPlace[0] + n.duxToPlace[1] === 0) {
      n.phase = 'move'; n.placed = 0; next = R.first; n.quiet = 0;
    } else if (next !== me && n.toPlace[1 - k] + n.duxToPlace[1 - k] === 0) {
      next = me; // the other side has nothing left to place
    }
  } else if (mv.t === 'x') {
    n.chain = -1; n.quiet++;
  } else {
    const piece = n.board[mv.from];
    n.board[mv.from] = 0; n.board[mv.to] = piece; info.piece = piece;
    n.chain = -1;
    const traps = findTraps(n, mv.to, me);
    if (R.capture === 'immediate') {
      for (const t of traps) { n.board[t.at] = 0; info.captured.push(t.at); }
      n.captured[k] += traps.length;
    } else {
      for (const t of traps) { n.capA[t.at] = t.a; n.capB[t.at] = t.b; info.bound.push(t.at); }
      // A bound piece is free again as soon as either captor is gone or is itself bound.
      for (let changed = true; changed;) {
        changed = false;
        for (let i = 0; i < n.board.length; i++) {
          const a = n.capA[i];
          if (a < 0) continue;
          const b = n.capB[i], owner = n.board[i] > 0 ? 1 : -1;
          if (n.board[a] * owner < 0 && n.capA[a] < 0 && n.board[b] * owner < 0 && n.capA[b] < 0) continue;
          n.capA[i] = -1; n.capB[i] = -1; changed = true;
          const at = info.bound.indexOf(i);
          if (at >= 0) info.bound.splice(at, 1); else info.freed.push(i);
        }
      }
    }
    n.quiet = info.captured.length ? 0 : s.quiet + 1;
    if (R.extraMove && info.captured.length) {
      n.chain = mv.to; n.turn = me;
      const more = [];
      genPiece(n, mv.to, more);
      if (more.length) { next = me; info.extra = true; } else n.chain = -1;
    }
  }

  n.turn = next;
  // Delayed capture: pieces still bound when their captor's turn comes round are taken off.
  if (R.capture === 'delayed' && next !== me && n.phase === 'move') {
    const nk = next === WHITE ? 0 : 1;
    for (let i = 0; i < n.board.length; i++) {
      if (n.capA[i] >= 0 && n.board[i] * next < 0) {
        n.board[i] = 0; n.capA[i] = -1; n.capB[i] = -1;
        info.removed.push(i); n.captured[nk]++; n.quiet = 0;
      }
    }
  }
  n.key = hashOf(n);
  n.history = track && n.phase === 'move' ? s.history.concat(n.key) : s.history;
  n.last = info;
  n.over = judge(n, me, track);
  return n;
}

// ---------------------------------------------------------------------------------------------------------------
// Helpers for hints, overlays and commentary.

/** Squares of `side`'s pieces that the other side could trap with a single move right now. */
export function threatened(s, side) {
  const out = new Set();
  if (s.phase !== 'move' || s.over) return out;
  const probe = s.turn === -side && s.chain < 0 ? s : { ...s, turn: -side, chain: -1 };
  for (const mv of legalMoves(probe)) {
    if (mv.t !== 'm') continue;
    for (const t of trapsOfMove(probe, mv)) out.add(t.at);
  }
  return out;
}

/** Moves for the side to move that trap at least one piece, with what they trap. */
export function capturingMoves(s) {
  const out = [];
  for (const mv of legalMoves(s)) {
    if (mv.t !== 'm') continue;
    const t = trapsOfMove(s, mv);
    if (t.length) out.push({ move: mv, traps: t });
  }
  return out;
}

/** Human-readable notation: "c1-c5 x d5", "@e4", "pass". */
export function notate(s, mv, info) {
  if (mv.t === 'x') return 'pass';
  if (mv.t === 'p') return '@' + sq(s, mv.to);
  let text = sq(s, mv.from) + (mv.hop ? '^' : '-') + sq(s, mv.to);
  if (info) {
    if (info.captured.length) text += ' x ' + info.captured.map((i) => sq(s, i)).join(',');
    if (info.bound.length) text += ' ~ ' + info.bound.map((i) => sq(s, i)).join(',');
  }
  return text;
}

/** Plain JSON snapshot (for saving games) and back. */
export function serialize(s) {
  return {
    rules: s.rules, board: Array.from(s.board), capA: Array.from(s.capA), capB: Array.from(s.capB), turn: s.turn,
    phase: s.phase, toPlace: s.toPlace, duxToPlace: s.duxToPlace, placed: s.placed, chain: s.chain,
    captured: s.captured, quiet: s.quiet, ply: s.ply, history: s.history, over: s.over,
  };
}
export function deserialize(o) {
  const s = createGame(o.rules);
  s.board = Int8Array.from(o.board); s.capA = Int16Array.from(o.capA); s.capB = Int16Array.from(o.capB);
  Object.assign(s, {
    turn: o.turn, phase: o.phase, toPlace: [...o.toPlace], duxToPlace: [...o.duxToPlace], placed: o.placed,
    chain: o.chain, captured: [...o.captured], quiet: o.quiet, ply: o.ply, history: [...o.history], over: o.over,
  });
  s.key = hashOf(s);
  return s;
}
