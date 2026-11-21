// Static evaluation for the Latrunculi AI. Driven only by the engine state and `state.rules` (never by preset ids).
//
// Public API
//   evaluate(state, weights = DEFAULT_WEIGHTS) -> number
//       Score in MEN from WHITE's point of view (+ = good for white). A finished game returns winner * 1000
//       (the search itself scores terminal positions as ±(1000 - ply)).
//   DEFAULT_WEIGHTS                -> the weight of every term (see the comments on each field)
//   mixWeights(base, mul, add)     -> a new weights object: base[k] * mul[k] + add[k]
//   features(state)                -> { white: {...}, black: {...} } raw counts (pairs, blocks, exposed, enPrise ...)
//                                     for tests, tuning and commentary
//   enPrise(state, side)           -> number[] squares of `side`'s pieces the other side could trap with ONE move
//                                     (works in the placement phase too: "if movement began now")
//
// Lower-level helpers shared with search.js (they use module-level scratch buffers: read the results before the
// next call):
//   scanBoth(state)                -> SCAN; fills SCAN.tgW / tgB (squares where an arriving white / black piece
//                                     traps something, with the number trapped), SCAN.ep (pieces that are en prise)
//   scanSide(state, side, false)   -> number of target squares for `side`; they are listed in SCAN.listW / listB
//   captureList(state, scanned)    -> [{ move, traps }] verified capturing moves for the side to move
//   placeScore(state, sq)          -> cheap heuristic score of placing on `sq` (call scanBoth(state) first)
import { geometry, legalMoves, trapsOfMove } from '../engine/engine.js';

export const DEFAULT_WEIGHTS = {
  material: 1,       // one man
  dux: 2,            // a capturable dux, in men (an uncapturable dux is not counted as material)
  bound: 0.95,       // delayed capture: share of a bound piece's value already written off
  boundRescue: 0.4,  // ... when its owner is to move and can trap one of the captors
  threat: 0.4,       // side to move has a piece that can be trapped in one move (it can still react)
  forked: 0.9,       // ... each further piece that can be trapped (only one can be saved)
  hanging: 0.3,      // the side NOT to move has a piece en prise (the search's capture quiescence does the rest)
  hangingMore: 0.2,  // ... each further one
  pressure: 0.05,    // fork potential: enemy pieces that are half-flanked (one more arrival traps them)
  double: 0.15,      // fork potential: squares where one arrival would trap two or more
  pair: 0.04,        // two friendly pieces side by side
  block: 0.05,       // a 2x2 block of friendly pieces
  exposed: 0.02,     // per piece, per line on which it can be flanked (no friend or wall on either side)
  sandwich: 0.1,     // per piece, per line on which it already stands between two enemies (one retreat-and-return traps it)
  surrounded: 0.1,   // per enemy neighbour beyond (friendly neighbours + 1): a piece alone among enemies
  isolated: 0.03,    // a piece with no orthogonal friend
  corner: 0.15,      // a piece standing in a corner when rules.cornerCapture (unless friends hold both squares beside it)
  mobility: 0.02,    // per free neighbouring square of a piece that can move
  stuck: 0.4,        // per missing move below four, when a blocked player loses
  advance: 0.02,     // per rank advanced (fixed-rows setups only)
  centre: 0.01,      // per step closer to the centre
  duxFree: 1,        // scales the uncapturable dux's free-neighbour table (steep at 1 and 0)
  duxDanger: 1,      // dux with one free square that an enemy can reach
  quiet: 1.2,        // progress to the quiet limit: the side ahead on count wants it, the side behind does not
  fade: 0.9,         // share of the positional score that has evaporated when the quiet limit is reached
  simplify: 0.3,     // the side ahead on count prefers fewer pieces on the board
  placeThreat: 0.5,  // placement phase: a piece that could be trapped at once when movement begins
  placePair: 1,      // placement phase: extra multiplier share for pairs (pairs count 1 + placePair times)
  keepPieces: 0,     // style: dislike of even trades (per piece on the board, for side `pov`, when level)
  tension: 0,        // style: liking for sharp positions (per half-flanked piece of EITHER side, for side `pov`)
  pov: 0,            // whose taste `keepPieces` and `tension` express (1 white, -1 black, 0 off); set by the search
};

export function mixWeights(base, mul, add) {
  const out = { ...base };
  if (mul) for (const k in mul) if (k in out) out[k] *= mul[k];
  if (add) for (const k in add) if (k in out) out[k] += add[k];
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Scratch (boards are at most 14 x 14).
const MAXN = 14 * 14;
export const SCAN = {
  tgW: new Int8Array(MAXN),   // tgW[sq] = pieces trapped if a WHITE piece arrives on sq
  tgB: new Int8Array(MAXN),
  ep: new Uint8Array(MAXN),   // ep[sq] = 1: the piece on sq can be trapped by one enemy move
  listW: new Int16Array(MAXN), // target squares for white (ntW of them)
  listB: new Int16Array(MAXN), // target squares for black (ntB of them)
  epW: 0, epB: 0,             // white / black pieces en prise
  prW: 0, prB: 0,             // white / black pieces under pressure (half-flanked)
  dbW: 0, dbB: 0,             // double-capture squares available to white / black
  ntW: 0, ntB: 0,             // number of target squares
};
const DUX_TABLE = [-3, -1.1, -0.3, -0.05, 0];

/** Can a piece of side `A` (other than the one on `excl`) move to the empty square `a` in one move? */
function canReach(s, g, a, A, excl) {
  const b = s.board, nb = g.nb, cap = s.capA, R = s.rules, slide = R.move === 'slide', base = a * 4;
  for (let d = 0; d < 4; d++) {
    let t = nb[base + d];
    if (slide) while (t >= 0 && b[t] === 0) t = nb[t * 4 + d];
    if (t >= 0 && b[t] * A > 0 && cap[t] < 0 && t !== excl) return true;
  }
  const mode = R.jump;
  if (mode !== 'none') {
    for (let d = 0; d < 4; d++) {
      const mid = nb[base + d];
      if (mid < 0) continue;
      const m = b[mid];
      if (m === 0) continue;
      const o = nb[mid * 4 + d];
      if (o < 0 || o === excl) continue;
      const p = b[o];
      if (p * A <= 0 || cap[o] >= 0) continue;
      const own = m * A > 0, bnd = cap[mid] >= 0;
      const ok = mode === 'any' ? true : mode === 'duxEnemy' ? (!own && (p === 2 || p === -2)) : (own && !bnd) || (!own && bnd);
      if (ok) return true;
    }
  }
  return false;
}

/**
 * Find the squares where a piece of side `A` would trap something by arriving. Fills the matching SCAN.tg array
 * and SCAN.listW / listB; with `reach` it also marks victims that can really be trapped next move in SCAN.ep.
 * Returns the number of target squares. The caller clears the buffers (scanBoth does).
 */
function scanAttacker(s, g, A, reach) {
  const b = s.board, cap = s.capA, nb = g.nb, n = g.n, R = s.rules;
  const tg = A > 0 ? SCAN.tgW : SCAN.tgB, list = A > 0 ? SCAN.listW : SCAN.listB, ep = SCAN.ep;
  const safeDux = R.dux === 'immobilise';
  let nt = 0, epN = 0, latent = 0;
  for (let v = 0; v < n; v++) {
    const pv = b[v];
    if (pv * A >= 0 || cap[v] >= 0) continue;
    if (safeDux && (pv === 2 || pv === -2)) continue;
    const base = v * 4;
    let pr = 0, hit = false;
    for (let d = 0; d < 4; d++) {
      const a = nb[base + d];
      if (a < 0 || b[a] !== 0) continue;
      const far = nb[base + (d ^ 1)];
      if (far < 0 || b[far] * A <= 0 || cap[far] >= 0) continue;
      if (tg[a]++ === 0) list[nt++] = a;
      pr++;
      if (reach && !hit && canReach(s, g, a, A, far)) hit = true;
    }
    if (pr) { latent++; if (hit) { ep[v] = 1; epN++; } }
  }
  if (R.cornerCapture) {
    for (const [c, x, y] of g.corners) {
      const pv = b[c];
      if (pv * A >= 0 || cap[c] >= 0) continue;
      if (safeDux && (pv === 2 || pv === -2)) continue;
      let pr = 0, hit = false;
      if (b[x] * A > 0 && cap[x] < 0 && b[y] === 0) {
        if (tg[y]++ === 0) list[nt++] = y;
        pr++;
        if (reach && canReach(s, g, y, A, x)) hit = true;
      } else if (b[y] * A > 0 && cap[y] < 0 && b[x] === 0) {
        if (tg[x]++ === 0) list[nt++] = x;
        pr++;
        if (reach && canReach(s, g, x, A, y)) hit = true;
      }
      if (pr) { latent++; if (hit && !ep[c]) { ep[c] = 1; epN++; } }
    }
  }
  let dbl = 0;
  for (let i = 0; i < nt; i++) if (tg[list[i]] > 1) dbl++;
  if (A > 0) { SCAN.epB = epN; SCAN.prB = latent; SCAN.dbW = dbl; SCAN.ntW = nt; } else { SCAN.epW = epN; SCAN.prW = latent; SCAN.dbB = dbl; SCAN.ntB = nt; }
  return nt;
}

/** Scan both sides (with reachability). Results are in SCAN. */
export function scanBoth(s) {
  const g = geometry(s.cols, s.rows), n = g.n;
  SCAN.tgW.fill(0, 0, n); SCAN.tgB.fill(0, 0, n); SCAN.ep.fill(0, 0, n);
  scanAttacker(s, g, 1, true);
  scanAttacker(s, g, -1, true);
  return SCAN;
}

/** Scan one side only. Returns the number of target squares (listed in SCAN.listW / listB, counts in SCAN.tgW / tgB). */
export function scanSide(s, side, reach = false) {
  const g = geometry(s.cols, s.rows), n = g.n;
  (side > 0 ? SCAN.tgW : SCAN.tgB).fill(0, 0, n);
  if (reach) SCAN.ep.fill(0, 0, n);
  return scanAttacker(s, g, side, reach);
}

/**
 * Verified capturing (or, with delayed capture, binding) moves for the side to move: [{ move, traps }].
 * Pass scanned = true when SCAN already describes this state (straight after evaluate / scanBoth).
 */
export function captureList(s, scanned = false) {
  const out = [];
  if (s.over || s.phase !== 'move') return out;
  const me = s.turn, R = s.rules;
  const nt = scanned ? (me > 0 ? SCAN.ntW : SCAN.ntB) : scanSide(s, me, false);
  if (nt === 0) return out;
  const tg = me > 0 ? SCAN.tgW : SCAN.tgB, list = me > 0 ? SCAN.listW : SCAN.listB;
  if (R.jump !== 'none' || s.chain >= 0) {
    const moves = legalMoves(s);
    const mine = [];
    for (const mv of moves) if (mv.t === 'm' && tg[mv.to] > 0) mine.push(mv);
    for (const mv of mine) {
      const traps = trapsOfMove(s, mv);
      if (traps.length) out.push({ move: mv, traps });
    }
    return out;
  }
  // No hops: a capturing move is a plain step or slide onto a target square (always legal, even without safeEntry).
  const g = geometry(s.cols, s.rows), nb = g.nb, b = s.board, cap = s.capA, slide = R.move === 'slide';
  const cands = [];
  for (let i = 0; i < nt; i++) {
    const a = list[i];
    for (let d = 0; d < 4; d++) {
      let t = nb[a * 4 + d];
      if (slide) while (t >= 0 && b[t] === 0) t = nb[t * 4 + d];
      if (t >= 0 && b[t] * me > 0 && cap[t] < 0) cands.push({ t: 'm', from: t, to: a });
    }
  }
  for (const mv of cands) {
    const traps = trapsOfMove(s, mv);
    if (traps.length) out.push({ move: mv, traps });
  }
  return out;
}

/** Squares of `side`'s pieces that the other side could trap with one move (also during placement). */
export function enPrise(s, side) {
  scanBoth(s);
  const out = [], b = s.board;
  for (let i = 0; i < b.length; i++) if (SCAN.ep[i] && b[i] * side > 0) out.push(i);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Placement heuristic (move ordering and candidate pruning in the placement phase).

/** Cheap score of placing a piece of the side to move on the empty square `sq`. Call scanBoth(state) first. */
export function placeScore(s, sq) {
  const g = geometry(s.cols, s.rows), nb = g.nb, b = s.board, me = s.turn, cols = s.cols, rows = s.rows;
  const tgMine = me > 0 ? SCAN.tgW : SCAN.tgB, tgOpp = me > 0 ? SCAN.tgB : SCAN.tgW;
  let sc = 30 * tgOpp[sq] - 8 * tgMine[sq];
  let own = 0;
  const base = sq * 4;
  for (let d = 0; d < 4; d++) {
    const t = nb[base + d];
    if (t < 0) continue;
    const v = b[t] * me;
    if (v > 0) { own++; continue; }
    if (v < 0) {
      const far = nb[base + (d ^ 1)];
      if (far >= 0 && b[far] === 0) sc -= canReach(s, g, far, -me, -1) ? 30 : 10; // I could be flanked on this line
      else if (far >= 0 && b[far] * me < 0) sc -= 7;                              // between two enemies already
      const beyond = nb[t * 4 + d];
      if (beyond >= 0 && b[beyond] === 0 && s.capA[t] < 0) sc += canReach(s, g, beyond, me, sq) ? 18 : 8; // I flank it
    } else {
      // empty neighbour: an enemy arriving there needs a partner on my other side
      const far = nb[base + (d ^ 1)];
      if (far >= 0 && b[far] * me < 0) sc -= 2;
    }
  }
  sc += own === 0 ? 0 : own === 1 ? 12 : 18;
  const c = sq % cols, r = (sq / cols) | 0;
  // diagonal friends make blocks possible later
  for (let dc = -1; dc <= 1; dc += 2) for (let dr = -1; dr <= 1; dr += 2) {
    const cc = c + dc, rr = r + dr;
    if (cc >= 0 && cc < cols && rr >= 0 && rr < rows && b[rr * cols + cc] * me > 0) sc += 3;
  }
  const edgeC = c === 0 || c === cols - 1, edgeR = r === 0 || r === rows - 1;
  if (edgeC && edgeR) sc += own === 2 ? 8 : s.rules.cornerCapture ? -25 : -6; // a corner between two friends is safe
  else if (edgeC || edgeR) sc += 2; // an edge piece can only be flanked along the edge
  sc += (cols + rows - 2 - Math.abs(2 * c - (cols - 1)) - Math.abs(2 * r - (rows - 1))) * 0.5;
  return sc;
}

// ---------------------------------------------------------------------------------------------------------------
// The evaluation.
const F = { // feature scratch, also returned (copied) by features()
  matW: 0, matB: 0, cntW: 0, cntB: 0, pairsW: 0, pairsB: 0, blocksW: 0, blocksB: 0, expW: 0, expB: 0, isoW: 0, isoB: 0,
  mobW: 0, mobB: 0, advW: 0, advB: 0, cenW: 0, cenB: 0, cornW: 0, cornB: 0, duxW: 0, duxB: 0, boundW: 0, boundB: 0,
  sandW: 0, sandB: 0,
};
const OFF = 5;

function gather(s, W) {
  const R = s.rules, cols = s.cols, rows = s.rows, g = geometry(cols, rows);
  const nb = g.nb, b = s.board, cap = s.capA, capB = s.capB, n = g.n, ep = SCAN.ep;
  const safeDux = R.dux === 'immobilise', cornerRule = R.cornerCapture;
  const cx = cols - 1, cy = rows - 1, half = cx + cy, advCap = (rows >> 1) + 1;
  const SURR = W.sandwich > 0 ? W.surrounded / W.sandwich : 0; // folded into the sandwich total
  let matW = 0, matB = 0, cntW = 0, cntB = 0, pairsW = 0, pairsB = 0, blocksW = 0, blocksB = 0, expW = 0, expB = 0;
  let isoW = 0, isoB = 0, mobW = 0, mobB = 0, advW = 0, advB = 0, cenW = 0, cenB = 0, cornW = 0, cornB = 0;
  let duxW = 0, duxB = 0, boundW = 0, boundB = 0, sandW = 0, sandB = 0;
  for (let i = 0; i < n; i++) {
    const v = b[i];
    if (v === 0) continue;
    const white = v > 0, side = white ? 1 : -1, isDux = v === 2 || v === -2;
    const base = i * 4, e = nb[base], w = nb[base + 1], no = nb[base + 2], so = nb[base + 3];
    const ve = e < 0 ? OFF : b[e] * side, vw = w < 0 ? OFF : b[w] * side;
    const vn = no < 0 ? OFF : b[no] * side, vs = so < 0 ? OFF : b[so] * side;
    const fe = ve === 1 || ve === 2, fw = vw === 1 || vw === 2, fn = vn === 1 || vn === 2, fs = vs === 1 || vs === 2;
    let val = isDux ? (safeDux ? 0 : W.dux) : 1;
    if (cap[i] >= 0) {
      // Bound: lost when the turn passes, unless the owner (to move) traps one of the captors now.
      const rescue = s.turn === side && (ep[cap[i]] === 1 || ep[capB[i]] === 1);
      const lost = (isDux && safeDux ? 0 : (isDux ? W.dux : 1)) * (rescue ? W.boundRescue : W.bound);
      val -= lost;
      if (white) boundW++; else boundB++;
    }
    let pairs = 0, blocks = 0, expo = 0, mob = 0, sand = 0;
    if (fe) pairs++;
    if (fn) pairs++;
    if (fe && fn && b[no + 1] * side > 0) blocks++;
    if (!(isDux && safeDux)) {
      if (ve <= 0 && vw <= 0) { expo++; if (ve < 0 && vw < 0) sand++; }
      if (vn <= 0 && vs <= 0) { expo++; if (vn < 0 && vs < 0) sand++; }
    }
    const iso = !(fe || fw || fn || fs);
    if (cap[i] < 0) { if (ve === 0) mob++; if (vw === 0) mob++; if (vn === 0) mob++; if (vs === 0) mob++; }
    const c = i % cols, r = (i / cols) | 0;
    const cen = half - Math.abs(2 * c - cx) - Math.abs(2 * r - cy);
    const prog = white ? r : rows - 1 - r;
    const adv = prog < advCap ? prog : advCap;
    // A corner piece is only at risk while a square beside it is not held by a friend (walls count as OFF).
    const corn = cornerRule && (c === 0 || c === cx) && (r === 0 || r === cy) && !((fe || ve === OFF) && (fw || vw === OFF) && (fn || vn === OFF) && (fs || vs === OFF)) ? 1 : 0;
    const foes = (ve < 0 ? 1 : 0) + (vw < 0 ? 1 : 0) + (vn < 0 ? 1 : 0) + (vs < 0 ? 1 : 0);
    const pals = (fe ? 1 : 0) + (fw ? 1 : 0) + (fn ? 1 : 0) + (fs ? 1 : 0);
    const surr = !(isDux && safeDux) && foes - pals > 1 ? foes - pals - 1 : 0;
    let dux = 0;
    if (isDux && safeDux) {
      let free = 0, enemy = 0, freeSq = -1;
      if (ve === 0) { free++; freeSq = e; } else if (ve < 0) enemy++;
      if (vw === 0) { free++; freeSq = w; } else if (vw < 0) enemy++;
      if (vn === 0) { free++; freeSq = no; } else if (vn < 0) enemy++;
      if (vs === 0) { free++; freeSq = so; } else if (vs < 0) enemy++;
      dux = W.duxFree * (free === 0 && enemy === 0 ? -0.6 : DUX_TABLE[free]);
      if (free === 1 && canReach(s, g, freeSq, -side, -1)) dux -= W.duxDanger * (s.turn === side ? 1 : 4);
      else if (free === 2 && enemy > 0) dux -= W.duxDanger * 0.15 * enemy;
    }
    if (white) {
      cntW++; matW += val; pairsW += pairs; blocksW += blocks; expW += expo; if (iso) isoW++; mobW += mob;
      advW += adv; cenW += cen; cornW += corn; duxW += dux; sandW += sand + surr * SURR;
    } else {
      cntB++; matB += val; pairsB += pairs; blocksB += blocks; expB += expo; if (iso) isoB++; mobB += mob;
      advB += adv; cenB += cen; cornB += corn; duxB += dux; sandB += sand + surr * SURR;
    }
  }
  F.matW = matW; F.matB = matB; F.cntW = cntW; F.cntB = cntB; F.pairsW = pairsW; F.pairsB = pairsB;
  F.blocksW = blocksW; F.blocksB = blocksB; F.expW = expW; F.expB = expB; F.isoW = isoW; F.isoB = isoB;
  F.mobW = mobW; F.mobB = mobB; F.advW = advW; F.advB = advB; F.cenW = cenW; F.cenB = cenB;
  F.cornW = cornW; F.cornB = cornB; F.duxW = duxW; F.duxB = duxB; F.boundW = boundW; F.boundB = boundB;
  F.sandW = sandW; F.sandB = sandB;
  if (s.phase === 'place') {
    // Pieces still in hand count as material, or whoever has placed one more would look a man up.
    const dv = safeDux ? 0 : W.dux;
    F.matW += s.toPlace[0] + s.duxToPlace[0] * dv;
    F.matB += s.toPlace[1] + s.duxToPlace[1] * dv;
  }
}

export function evaluate(s, W = DEFAULT_WEIGHTS) {
  if (s.over) return s.over.winner * 1000;
  const R = s.rules, placing = s.phase === 'place';
  scanBoth(s);
  gather(s, W);
  // Material first, then everything positional (which fades as the quiet limit nears: only the count will matter).
  const mat = W.material * (F.matW - F.matB);
  let sc = W.pair * (placing ? 1 + W.placePair : 1) * (F.pairsW - F.pairsB);
  sc += W.block * (F.blocksW - F.blocksB);
  sc -= W.exposed * (F.expW - F.expB);
  sc -= W.sandwich * (placing ? 2 : 1) * (F.sandW - F.sandB);
  sc -= W.isolated * (F.isoW - F.isoB);
  sc += W.mobility * (F.mobW - F.mobB);
  if (R.setup === 'rows') sc += W.advance * (F.advW - F.advB);
  sc += W.centre * 0.5 * (F.cenW - F.cenB);
  sc -= W.corner * (F.cornW - F.cornB);
  // fork potential
  sc += W.pressure * (SCAN.prB - SCAN.prW) + W.double * (SCAN.dbW - SCAN.dbB);
  if (placing) {
    // Nothing is taken during placement; what matters is who is en prise when movement begins (rules.first moves).
    const first = R.first;
    const penW = SCAN.epW * W.placeThreat * (first === 1 ? 0.6 : 1);
    const penB = SCAN.epB * W.placeThreat * (first === -1 ? 0.6 : 1);
    return mat + sc + penB - penW + F.duxW - F.duxB;
  }
  const diff = F.cntW - F.cntB;
  if (diff === 0 && W.pov !== 0 && W.keepPieces !== 0) sc += W.pov * W.keepPieces * (F.cntW + F.cntB);
  if (W.pov !== 0 && W.tension !== 0) sc += W.pov * W.tension * (SCAN.prW + SCAN.prB);
  let p2 = 0;
  if (R.quietLimit > 0) { const p = s.quiet / R.quietLimit; p2 = p * p; sc *= 1 - W.fade * p2; }

  // Tactical and decisive terms do not fade.
  sc += mat + F.duxW - F.duxB;
  if (R.noMoves === 'lose') {
    if (F.mobW < 4) sc -= W.stuck * (4 - F.mobW);
    if (F.mobB < 4) sc += W.stuck * (4 - F.mobB);
  }
  // pieces that can be trapped in one move
  const t = s.turn;
  const mine = t > 0 ? SCAN.epW : SCAN.epB, theirs = t > 0 ? SCAN.epB : SCAN.epW;
  let ts = 0;
  if (mine > 0) ts -= W.threat + W.forked * (mine - 1);
  if (theirs > 0) ts += W.hanging + W.hangingMore * (theirs - 1);
  sc += t * ts;
  if (diff !== 0) {
    const sign = diff > 0 ? 1 : -1;
    sc += sign * W.quiet * p2;
    const start = 2 * (R.men + (R.dux === 'none' ? 0 : 1));
    sc += sign * W.simplify * (1 - (F.cntW + F.cntB) / start);
  }
  return sc;
}

/** Raw feature counts per side (for tests, tuning, commentary). */
export function features(s) {
  scanBoth(s);
  gather(s, DEFAULT_WEIGHTS);
  const side = (k) => ({
    material: F['mat' + k], count: F['cnt' + k], pairs: F['pairs' + k], blocks: F['blocks' + k], exposed: F['exp' + k],
    isolated: F['iso' + k], sandwiched: F['sand' + k], mobility: F['mob' + k], advance: F['adv' + k], centre: F['cen' + k], corners: F['corn' + k],
    bound: F['bound' + k], enPrise: SCAN['ep' + k], pressured: SCAN['pr' + k], doubles: SCAN['db' + k],
  });
  return { white: side('W'), black: side('B') };
}
