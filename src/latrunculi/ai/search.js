// Search for the Latrunculi AI: iterative-deepening negamax alpha-beta (principal variation search) with a
// transposition table, capture quiescence, killer / history ordering, late-move reductions and futility pruning.
// It only talks to the engine API (legalMoves / applyMove / state.over) and reads `state.rules`, so every preset
// and any house rules work. Scores inside the search are "for state.turn"; the sign is flipped only when the turn
// really changes, so extra moves after a capture and double placements are handled exactly.
//
// Public API
//   chooseMove(state, opts) -> { move, score, depth, nodes, ms, pv, lapse }
//       opts = { level: 1..5 (default 3), personality: 'maximus' | 'titus' | 'aghiles' | null, timeMs?, seed?,
//                rattled?: 0..1, history?: number[], depth?: cap override, maxNodes?: node budget,
//                weights?: partial evaluation-weight overrides (tuning) }
//       `score` is in men from the point of view of the side to move (a forced win / loss is ±(1000 - plies)).
//       `move` is null only when there is no legal move. Deterministic for a given `seed` as long as the search is
//       stopped by depth or by `maxNodes` rather than by the clock (levels 1-3 always are in practice).
//       `history` is the list of position keys of the game so far (defaults to state.history); a third occurrence
//       of a position is scored as the engine scores it: by piece count.
//   analyse(state, opts)    -> { score, depth, nodes, ms, lines: [{ move, score, pv }] }
//       Full-strength multi-PV analysis. opts = { multi = 1, timeMs = 1000, depth = 64, maxNodes?, history?,
//       include?: move | move[] (always given an exact score; appended to `lines` if not among the best),
//       weights? }. Scores are from the side to move's point of view, in men, best line first.
//   toMen(internal)         -> convert an internal score (1 man = 1000) to men
//   makeRng(seed)           -> the small seeded PRNG used here (mulberry32), returns () => [0, 1)
import { legalMoves, applyMove, trapsOfMove, countPieces, sameMove, hashOf } from '../engine/engine.js';
import { evaluate, DEFAULT_WEIGHTS, SCAN, scanBoth, captureList, placeScore } from './evaluate.js';
import { resolveSettings } from './levels.js';

const UNIT = 1000;            // one man
const WIN = 1000000;
const MATE = WIN - 5000;      // any score beyond this is a forced result
const INF = WIN * 2;
const MAXPLY = 90;
const QMAX = 8;               // capture quiescence depth
const P_CODE = 0x10000, X_CODE = 0x20000;
const EXACT = 1, LOWER = 2, UPPER = 3;
const CAP = 1000000, TT_SCORE = 1000000000;
const FUT = [0, 900, 1900];   // futility margins by remaining depth
const EMPTY = Object.freeze([]);
const X_MOVE = Object.freeze({ t: 'x' });
const now = typeof performance !== 'undefined' && performance.now ? () => performance.now() : () => Date.now();

const codeOf = (mv) => (mv.t === 'm' ? mv.from * 256 + mv.to : mv.t === 'p' ? P_CODE + mv.to : X_CODE);

export function toMen(v) {
  if (v >= MATE) return 1000 - (WIN - v);
  if (v <= -MATE) return -(1000 - (WIN + v));
  return v / UNIT;
}

export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Transposition tables are reused between calls (cleared each time, so results never depend on earlier calls).
const TABLES = new Map();
function getTable(bits) {
  let t = TABLES.get(bits);
  if (!t) {
    const size = 1 << bits;
    t = {
      mask: size - 1, keys: new Float64Array(size), score: new Int32Array(size), move: new Int32Array(size),
      depth: new Int8Array(size), flag: new Uint8Array(size), qt: new Uint8Array(size),
    };
    TABLES.set(bits, t);
  } else {
    t.keys.fill(0);
  }
  return t;
}
const HISTORY = new Int32Array(2 * 65536);

class Search {
  constructor(root, cfg) {
    this.root = root;
    this.me = root.turn;
    this.W = cfg.weights || DEFAULT_WEIGHTS;
    this.prune = cfg.prune !== false;
    this.nullOK = cfg.nullMove !== false;
    this.noNull = -1;
    this.watch = cfg.watch || null;
    this.placeWidth = cfg.placeWidth || 12;
    this.maxNodes = cfg.maxNodes > 0 ? cfg.maxNodes : Infinity;
    this.timeMs = cfg.timeMs > 0 ? cfg.timeMs : 1000;
    this.start = now();
    this.deadline = this.start + this.timeMs;
    this.nodes = 0;
    this.stop = false;
    this.canStop = false;
    this.tt = getTable(cfg.ttBits || 16);
    this.path = new Float64Array(MAXPLY + 4);
    this.killers = new Int32Array((MAXPLY + 4) * 2).fill(-1);
    this.history = HISTORY; HISTORY.fill(0);
    this.scores = [];
    this.pvs = new Array(MAXPLY + 4).fill(EMPTY);
    // Earlier positions of the game, for threefold repetition (the root itself is path[0]).
    this.hist = new Map();
    const h = cfg.history || root.history || EMPTY;
    let end = h.length;
    if (end && h[end - 1] === root.key) end--;
    for (let i = 0; i < end; i++) this.hist.set(h[i], (this.hist.get(h[i]) || 0) + 1);
    const R = root.rules;
    this.quietFrom = R.quietLimit > 0 ? Math.max(0, R.quietLimit - 30) : -1;
  }

  tick() {
    this.nodes++;
    if (!this.canStop) return false;
    if (this.stop) return true;
    if (this.nodes >= this.maxNodes || ((this.nodes & 255) === 0 && now() > this.deadline)) this.stop = true;
    return this.stop;
  }

  evalFor(s) { return Math.round(evaluate(s, this.W) * UNIT) * s.turn; }

  terminal(s, ply) {
    const w = s.over.winner;
    return w === 0 ? 0 : w === s.turn ? WIN - ply : -(WIN - ply);
  }

  /** Has this position already occurred twice (game history + search path)? Then this is the third time. */
  repeated(key, ply) {
    let c = this.hist.size ? this.hist.get(key) || 0 : 0;
    const path = this.path;
    for (let i = ply - 1; i >= 0 && c < 2; i--) if (path[i] === key) c++;
    return c >= 2;
  }

  byCount(s, ply) {
    const [w, b] = countPieces(s);
    const winner = w > b ? 1 : b > w ? -1 : 0;
    return winner === 0 ? 0 : winner === s.turn ? WIN - ply : -(WIN - ply);
  }

  qtag(s) { return this.quietFrom >= 0 && s.quiet > this.quietFrom ? s.quiet - this.quietFrom : 0; }

  watched(traps) {
    const w = this.watch;
    for (let i = 0; i < traps.length; i++) if (w[traps[i].at]) return true;
    return false;
  }

  search(s, depth, alpha, beta, ply) {
    if (s.over) return this.terminal(s, ply);
    this.path[ply] = s.key;
    const placing = s.phase === 'place';
    if (!placing && s.quiet >= 4 && this.repeated(s.key, ply)) return this.byCount(s, ply);
    if (depth <= 0 || ply >= MAXPLY) return this.quiesce(s, alpha, beta, ply, 0);
    if (this.tick()) return 0;

    const me = s.turn, pvNode = beta - alpha > 1;
    const tt = this.tt, key = s.key, qt = this.qtag(s);
    const idx = ((key >>> 0) ^ Math.imul(qt + 1, 0x9e3779b1)) & tt.mask;
    let ttMove = -1;
    if (tt.keys[idx] === key && tt.qt[idx] === qt) {
      ttMove = tt.move[idx];
      if (!pvNode && tt.depth[idx] >= depth) {
        let v = tt.score[idx];
        if (v >= MATE) v -= ply; else if (v <= -MATE) v += ply;
        const f = tt.flag[idx];
        if (f === EXACT || (f === LOWER && v >= beta) || (f === UPPER && v <= alpha)) return v;
      }
    }

    const moves = legalMoves(s);
    const nm = moves.length;
    if (nm === 0) return this.evalFor(s);

    // Futility: near the horizon, quiet moves cannot lift a hopeless position (or sink a winning one).
    let futile = false, stat = 0, scanned = false;
    const R = s.rules;
    const duxGame = R.dux === 'immobilise';
    if (this.prune && !pvNode && !placing && s.chain < 0 && depth <= 2
      && alpha > -MATE && beta < MATE && !(R.quietLimit > 0 && s.quiet + depth + 1 >= R.quietLimit)) {
      stat = this.evalFor(s);
      scanned = true; // evaluate leaves the scan of this position in SCAN
      const mineEp = me > 0 ? SCAN.epW : SCAN.epB;
      if (!duxGame && mineEp === 0 && stat - 1300 * depth >= beta) return stat - 1300 * depth;
      futile = stat + FUT[depth] <= alpha;
    }
    // Null move: if passing would still beat beta, the position is good enough (not where zugzwang, bound
    // pieces or a hemmed-in dux make a pass meaningless).
    if (this.prune && this.nullOK && !pvNode && !placing && depth >= 3 && s.chain < 0 && !duxGame && R.capture === 'immediate'
      && beta < MATE && beta > -MATE && nm >= 8 && this.noNull !== ply) {
      if (!scanned) { stat = this.evalFor(s); scanned = true; }
      if (stat >= beta) {
        const ns = { ...s, turn: -me, quiet: s.quiet + 1, ply: s.ply + 1, last: null };
        ns.key = hashOf(ns);
        this.noNull = ply + 1;
        const v = -this.search(ns, depth - 3, -beta, -beta + 1, ply + 1);
        this.noNull = -1;
        if (this.stop) return 0;
        if (v >= beta) return beta;
        scanned = false; // SCAN was overwritten
      }
    }
    // Where a hemmed-in dux decides the game, moves of a dux or next to one are never "quiet".
    let near = null;
    if (futile && duxGame) {
      near = this.near || (this.near = new Uint8Array(s.board.length));
      near.fill(0);
      const b = s.board, cols = s.cols;
      for (let i = 0; i < b.length; i++) {
        if (b[i] !== 2 && b[i] !== -2) continue;
        near[i] = 1;
        const c = i % cols;
        if (c > 0) near[i - 1] = 1;
        if (c < cols - 1) near[i + 1] = 1;
        if (i >= cols) near[i - cols] = 1;
        if (i + cols < b.length) near[i + cols] = 1;
      }
    }

    let sc = this.scores[ply];
    if (!sc || sc.length < nm) sc = this.scores[ply] = new Int32Array(Math.max(256, nm * 2));
    let width = nm;
    if (!scanned) scanBoth(s);
    if (placing) {
      for (let i = 0; i < nm; i++) {
        const to = moves[i].to;
        sc[i] = Math.round(placeScore(s, to) * 16) + (P_CODE + to === ttMove ? TT_SCORE : 0);
      }
      if (this.placeWidth < width) width = this.placeWidth;
    } else {
      const tgMine = me > 0 ? SCAN.tgW : SCAN.tgB, tgOpp = me > 0 ? SCAN.tgB : SCAN.tgW, ep = SCAN.ep;
      const k1 = this.killers[ply * 2], k2 = this.killers[ply * 2 + 1], hb = me > 0 ? 0 : 65536, hist = this.history;
      for (let i = 0; i < nm; i++) {
        const mv = moves[i];
        if (mv.t !== 'm') { sc[i] = ttMove === X_CODE ? TT_SCORE : 500000; continue; }
        const code = mv.from * 256 + mv.to;
        let v;
        if (code === ttMove) v = TT_SCORE;
        else if (tgMine[mv.to] > 0) v = CAP + tgMine[mv.to] * 4096 + (hist[hb + code] >> 4);
        else if (code === k1) v = 900000;
        else if (code === k2) v = 800000;
        else {
          v = hist[hb + code];
          if (tgOpp[mv.to] > 0) v += 60000;   // stands on the square where one of my pieces would be trapped
          if (ep[mv.from]) v += 50000;        // moves a piece that is in danger
        }
        sc[i] = v;
      }
    }

    const a0 = alpha;
    let best = -INF, bestCode = -1, searched = 0, skipped = false;
    const filter = this.watch !== null && ply === 1 && me !== this.me;
    for (let i = 0; i < width; i++) {
      let bi = i, bv = sc[i];
      for (let j = i + 1; j < nm; j++) if (sc[j] > bv) { bv = sc[j]; bi = j; }
      if (bi !== i) { const tm = moves[i]; moves[i] = moves[bi]; moves[bi] = tm; sc[bi] = sc[i]; sc[i] = bv; }
      const mv = moves[i], isCap = bv >= CAP;
      if (futile && searched > 0 && !isCap && mv.t === 'm' && !(near !== null && (near[mv.from] || near[mv.to]))) { skipped = true; continue; }
      if (filter && mv.t === 'm') {
        const tr = trapsOfMove(s, mv);
        if (tr.length && !this.watched(tr)) continue; // the careless player does not see this capture coming
      }
      const child = applyMove(s, mv, false);
      const same = child.turn === me;
      const nd = s.chain >= 0 ? depth : depth - 1;
      let v;
      if (pvNode) this.pvs[ply + 1] = EMPTY;
      if (searched === 0) {
        v = same ? this.search(child, nd, alpha, beta, ply + 1) : -this.search(child, nd, -beta, -alpha, ply + 1);
      } else {
        let r = 0;
        if (this.prune && depth >= 3 && searched >= 4 && !isCap && !placing && s.chain < 0) r = searched >= 16 ? 2 : 1;
        v = same ? this.search(child, nd - r, alpha, alpha + 1, ply + 1) : -this.search(child, nd - r, -alpha - 1, -alpha, ply + 1);
        if (v > alpha && r > 0) {
          v = same ? this.search(child, nd, alpha, alpha + 1, ply + 1) : -this.search(child, nd, -alpha - 1, -alpha, ply + 1);
        }
        if (v > alpha && v < beta) {
          if (pvNode) this.pvs[ply + 1] = EMPTY;
          v = same ? this.search(child, nd, alpha, beta, ply + 1) : -this.search(child, nd, -beta, -alpha, ply + 1);
        }
      }
      if (this.stop) return 0;
      searched++;
      if (v > best) {
        best = v; bestCode = codeOf(mv);
        if (v > alpha) {
          alpha = v;
          if (pvNode) this.pvs[ply] = [mv, ...this.pvs[ply + 1]];
          if (v >= beta) {
            if (!isCap && mv.t === 'm') {
              const k = ply * 2;
              if (this.killers[k] !== bestCode) { this.killers[k + 1] = this.killers[k]; this.killers[k] = bestCode; }
              const h = (me > 0 ? 0 : 65536) + bestCode;
              const nv = this.history[h] + depth * depth * 16;
              this.history[h] = nv > 40000 ? 40000 : nv;
            }
            break;
          }
        }
      }
    }
    if (searched === 0) return this.evalFor(s);
    if (skipped && best < stat + FUT[depth]) best = Math.min(a0, stat + FUT[depth]);

    const flag = best >= beta ? LOWER : best > a0 ? EXACT : UPPER;
    if (!(tt.keys[idx] === key && tt.qt[idx] === qt && tt.depth[idx] > depth && flag !== EXACT)) {
      let v = best;
      if (v >= MATE) v += ply; else if (v <= -MATE) v -= ply;
      tt.keys[idx] = key; tt.qt[idx] = qt; tt.score[idx] = v; tt.depth[idx] = depth; tt.flag[idx] = flag;
      tt.move[idx] = bestCode;
    }
    return best;
  }

  /** Capture quiescence: stand pat, or keep capturing (binding) until the position is quiet. */
  quiesce(s, alpha, beta, ply, qd) {
    if (s.over) return this.terminal(s, ply);
    if (this.tick()) return 0;
    this.path[ply] = s.key;
    if (s.phase === 'place') return this.evalFor(s);
    const me = s.turn;
    let best;
    if (s.chain >= 0) {
      // Extra move after a capture: "standing pat" means ending the turn.
      const c = applyMove(s, X_MOVE, false);
      best = c.turn === me ? this.quiesce(c, alpha, beta, ply + 1, qd + 1) : -this.quiesce(c, -beta, -alpha, ply + 1, qd + 1);
      if (this.stop) return 0;
    } else {
      best = this.evalFor(s);
    }
    if (best >= beta || qd >= QMAX || ply >= MAXPLY) return best;
    if (best > alpha) alpha = best;
    const caps = captureList(s, s.chain < 0);
    if (caps.length === 0) return best;
    if (caps.length > 1) caps.sort((a, b) => b.traps.length - a.traps.length);
    const filter = this.watch !== null && ply === 1 && me !== this.me;
    for (let i = 0; i < caps.length; i++) {
      if (filter && !this.watched(caps[i].traps)) continue;
      const child = applyMove(s, caps[i].move, false);
      const v = child.turn === me ? this.quiesce(child, alpha, beta, ply + 1, qd + 1) : -this.quiesce(child, -beta, -alpha, ply + 1, qd + 1);
      if (this.stop) return 0;
      if (v > best) {
        best = v;
        if (v > alpha) { alpha = v; if (v >= beta) break; }
      }
    }
    return best;
  }

  /**
   * One iteration at the root. Returns false when it was interrupted. Each root move may carry a `bias` (the
   * level's evaluation noise, drawn once per decision): the iteration maximises score + bias, so only the moves
   * that could actually be chosen need an exact score and alpha-beta stays efficient.
   */
  rootIter(depth, rms, multi) {
    const me = this.me, root = this.root;
    this.path[0] = root.key;
    const top = []; // the best biased scores so far, descending
    const ext = root.chain >= 0 ? 1 : 0;
    for (let i = 0; i < rms.length; i++) {
      const rm = rms[i], child = rm.child, same = child.turn === me, nd = depth - 1 + ext;
      const alpha = rm.must || top.length < multi ? -INF : top[multi - 1] - rm.bias;
      this.pvs[1] = EMPTY;
      let v;
      if (alpha === -INF) {
        v = same ? this.search(child, nd, -INF, INF, 1) : -this.search(child, nd, -INF, INF, 1);
      } else {
        v = same ? this.search(child, nd, alpha, alpha + 1, 1) : -this.search(child, nd, -alpha - 1, -alpha, 1);
        if (v > alpha && !this.stop) {
          this.pvs[1] = EMPTY;
          v = same ? this.search(child, nd, alpha, INF, 1) : -this.search(child, nd, -INF, -alpha, 1);
        }
      }
      if (this.stop) return false;
      rm.nScore = v; rm.nExact = v > alpha;
      if (rm.nExact) {
        rm.nPv = [rm.move, ...this.pvs[1]];
        const bv = v + rm.bias;
        let k = top.length;
        while (k > 0 && top[k - 1] < bv) k--;
        top.splice(k, 0, bv);
      }
    }
    return true;
  }

  /**
   * Iterative deepening. Returns { moves: [{ move, score, exact, pv }] sorted best first, depth, nodes, ms }.
   *   multi   how many best moves need exact scores
   *   must    moves that always get an exact score
   *   bias    optional (move) => number added to that root move's score when ranking (level noise)
   */
  run({ maxDepth = 64, multi = 1, must = null, quickSingle = false, bias = null }) {
    const root = this.root;
    const legal = legalMoves(root);
    if (legal.length === 0) return { moves: [], depth: 0, nodes: 0, ms: 0 };
    let rms = legal.map((move) => ({ move, child: null, score: -INF, exact: false, pv: [move], must: false, pre: 0, bias: 0, nScore: 0, nExact: false, nPv: null }));
    if (must) for (const rm of rms) if (must.some((m) => sameMove(m, rm.move))) rm.must = true;
    scanBoth(root);
    if (root.phase === 'place') {
      for (const rm of rms) rm.pre = placeScore(root, rm.move.to);
      rms.sort((a, b) => b.pre - a.pre);
      const keep = this.placeWidth + 4;
      if (rms.length > keep) rms = rms.filter((rm, i) => i < keep || rm.must);
    } else {
      const tg = root.turn > 0 ? SCAN.tgW : SCAN.tgB;
      for (const rm of rms) rm.pre = rm.move.t === 'm' ? tg[rm.move.to] : 0.5;
      rms.sort((a, b) => b.pre - a.pre);
    }
    for (const rm of rms) { rm.child = applyMove(root, rm.move, false); if (bias) rm.bias = bias(rm.move); }

    let done = 0;
    const cap = Math.max(1, Math.min(maxDepth, MAXPLY - 10));
    for (let d = 1; d <= cap; d++) {
      this.canStop = d > 1;
      if (!this.rootIter(d, rms, multi)) break;
      for (const rm of rms) { rm.score = rm.nScore; rm.exact = rm.nExact; if (rm.nExact) rm.pv = rm.nPv; }
      rms.sort((a, b) => (a.exact === b.exact ? b.score + b.bias - a.score - a.bias : a.exact ? -1 : 1));
      done = d;
      if (quickSingle && rms.length === 1) break;
      const best = rms[0].score;
      if (best >= MATE && WIN - best <= d) break;          // a forced win, already the shortest this depth can show
      if (best <= -MATE && WIN + best <= d) break;
      if (now() - this.start > this.timeMs * 0.55) break;  // the next iteration would not finish
      if (this.nodes > this.maxNodes * 0.6) break;
    }
    return { moves: rms, depth: done, nodes: this.nodes, ms: now() - this.start };
  }
}

// ---------------------------------------------------------------------------------------------------------------
function gauss(rng) {
  let u = rng();
  if (u < 1e-12) u = 1e-12;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function seedFor(state, seed) {
  // No seed given: games should differ, so fall back to Math.random. With a seed everything is reproducible.
  const base = seed === undefined || seed === null ? Math.floor(Math.random() * 4294967296) : Number(seed) >>> 0;
  return (base ^ (state.key >>> 0) ^ Math.imul(state.ply + 1, 0x9e3779b1)) >>> 0;
}

export function chooseMove(state, opts = {}) {
  const t0 = now();
  const none = { move: null, score: 0, depth: 0, nodes: 0, ms: 0, pv: [], lapse: false };
  if (state.over) return none;
  const set = resolveSettings(opts, state);
  const rng = makeRng(seedFor(state, opts.seed));
  const weights = { ...set.weights, ...(opts.weights || null), pov: state.turn };
  // What the careless player fails to watch this turn: each square is "seen" with probability `vision`.
  let watch = null;
  if (set.vision < 1) {
    watch = new Uint8Array(state.board.length);
    for (let i = 0; i < watch.length; i++) watch[i] = rng() < set.vision ? 1 : 0;
  }
  // A lapse (decided up front): pick among the top few candidates, weighted by how good they look.
  const lapse = set.blunder > 0 && rng() < set.blunder;
  // Some levels do not always think as far as they can.
  let depth = opts.depth ?? set.depth;
  if (set.shallow > 0 && opts.depth === undefined && rng() < set.shallow && depth > 1) depth--;
  // Evaluation noise: one draw per candidate move, fixed for the whole decision (plus a tiny tie-break jitter).
  const sigma = set.noise * UNIT;
  const bias = () => Math.round(gauss(rng) * sigma + (rng() - 0.5) * 20);
  const search = new Search(state, {
    weights, prune: set.prune, watch, placeWidth: set.placeWidth, ttBits: set.ttBits,
    timeMs: set.timeMs, maxNodes: opts.maxNodes, history: opts.history,
  });
  const res = search.run({ maxDepth: depth, multi: lapse ? set.top : 1, quickSingle: true, bias });
  if (res.moves.length === 0) return none;

  const cands = res.moves.filter((m) => m.exact);
  let pick = cands[0], lapsed = false;
  // A forced win is always played, and a forced loss never chosen while something else is on offer.
  const win = cands.reduce((a, c) => (c.score > a.score ? c : a), cands[0]);
  if (win.score >= MATE) pick = win;
  else if (lapse && cands.length > 1) {
    const few = cands.slice(0, set.top).filter((c) => c.score > -MATE);
    if (few.length > 1) {
      const hi = few.reduce((a, c) => Math.max(a, c.score), -INF);
      const w = few.map((c) => Math.exp((c.score - hi) / (set.temp * UNIT)));
      let r = rng() * w.reduce((a, c) => a + c, 0);
      let chosen = few[few.length - 1];
      for (let i = 0; i < few.length; i++) { r -= w[i]; if (r <= 0) { chosen = few[i]; break; } }
      lapsed = chosen !== pick;
      pick = chosen;
    }
  }
  return { move: pick.move, score: toMen(pick.score), depth: res.depth, nodes: res.nodes, ms: now() - t0, pv: pick.pv, lapse: lapsed };
}

export function analyse(state, opts = {}) {
  const t0 = now();
  if (state.over) {
    const w = state.over.winner;
    return { score: w === 0 ? 0 : w === state.turn ? 1000 : -1000, depth: 0, nodes: 0, ms: 0, lines: [] };
  }
  const multi = Math.max(1, opts.multi | 0 || 1);
  const must = opts.include ? (Array.isArray(opts.include) ? opts.include : [opts.include]) : null;
  const search = new Search(state, {
    weights: opts.weights || DEFAULT_WEIGHTS, prune: true, placeWidth: opts.placeWidth || 14, ttBits: opts.ttBits || 18,
    timeMs: opts.timeMs ?? 1000, maxNodes: opts.maxNodes, history: opts.history, nullMove: opts.nullMove,
  });
  const res = search.run({ maxDepth: opts.depth ?? 64, multi, must });
  const exact = res.moves.filter((m) => m.exact);
  const lines = exact.slice(0, multi);
  if (must) for (const m of exact) if (m.must && !lines.includes(m)) lines.push(m);
  return {
    score: lines.length ? toMen(lines[0].score) : 0, depth: res.depth, nodes: res.nodes, ms: now() - t0,
    lines: lines.map((m) => ({ move: m.move, score: toMen(m.score), pv: m.pv })),
  };
}
