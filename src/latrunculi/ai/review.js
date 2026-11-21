// Post-game review and move explanations for the Latrunculi AI.
//
// Public API
//   reviewGame(startState, moves, opts = {}, onProgress) -> Promise<{
//       plies: [{ ply, by, move, scoreBefore, scoreAfter, best, bestScore, loss, tag }],
//       accuracy: { white, black },          // 0..100 per player (null if that player made no move)
//       turningPoints: [{ ply, swing, kind, text }],   // up to three, in the order they happened
//       graph: number[] }>                   // graph[0] = start, graph[i + 1] = after ply i (white's view)
//     Every position is re-searched. All scores are in men from WHITE's point of view, clamped to ±10
//     (a forced win shows as ±10). `ply` is the index into `moves`; `by` is 1 (white) or -1 (black);
//     `best` is the engine's move and `bestScore` its score; `loss` is what the mover gave up against it (>= 0);
//     `tag` is 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'brilliant' (a sacrifice that is best).
//     `swing` is scoreAfter - scoreBefore (signed, white's view); `kind` is 'hung' | 'missed-capture' | 'fork' |
//     'dux' | 'missed-win' | 'lost' | 'positional'; `text` is one plain sentence built from engine facts.
//     opts = { depth = 5, timeMs = 250 (per position), maxNodes?, names?: { 1: 'White', '-1': 'Black' },
//              shouldCancel?: () => boolean, pause?: () => Promise (awaited after every ply; defaults to a
//              macrotask so a worker can post progress and receive a cancel message) }
//     onProgress({ ply, total, done: plies analysed so far, tag }) is called after every ply.
//     `startState` must be the position the game began from (with its engine history); `moves` are engine moves.
//   explainMove(state, move, opts?) -> string[]   one to three short reasons for a move, most important first
//     (what it captures, threatens or protects, which piece was in danger ...), in the second person, for hints.
//   TAG_LIMITS -> the win-chance losses at which a move becomes an inaccuracy / mistake / blunder
import { legalMoves, applyMove, trapsOfMove, threatened, sameMove, sq, geometry } from '../engine/engine.js';
import { analyse } from './search.js';
import { enPrise } from './evaluate.js';

const CLAMP = 10;
export const TAG_LIMITS = { inaccuracy: 0.04, mistake: 0.1, blunder: 0.2 };

const clamp = (x) => (x > CLAMP ? CLAMP : x < -CLAMP ? -CLAMP : x);
/** Rough chance of winning for a score in men (one man up is about 73%). */
const winChance = (men) => 1 / (1 + Math.exp(-men));
const round2 = (x) => Math.round(x * 100) / 100;
const macrotask = () => new Promise((resolve) => setTimeout(resolve, 0));

function list(words) {
  if (words.length <= 1) return words.join('');
  return words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1];
}
function pieceAt(s, squares) {
  const names = squares.map((i) => sq(s, i));
  const anyDux = squares.some((i) => s.board[i] === 2 || s.board[i] === -2);
  if (squares.length === 1) return `the ${anyDux ? 'dux' : 'piece'} on ${names[0]}`;
  return `the pieces on ${list(names)}`;
}
function moveText(s, mv) {
  if (mv.t === 'p') return `placing on ${sq(s, mv.to)}`;
  if (mv.t === 'x') return 'ending the turn';
  return `${sq(s, mv.from)} to ${sq(s, mv.to)}`;
}
function findLegal(s, mv) {
  if (!mv) return null;
  return legalMoves(s).find((m) => sameMove(m, mv)) || null;
}
/** Squares of `side`'s pieces that can be trapped by one enemy move (exact in the move phase). */
function danger(s, side) {
  if (s.over) return new Set();
  return s.phase === 'move' ? threatened(s, side) : new Set(enPrise(s, side));
}
function duxFree(s, side) {
  const g = geometry(s.cols, s.rows), b = s.board;
  for (let i = 0; i < b.length; i++) {
    if (b[i] !== 2 * side) continue;
    let free = 0;
    for (let d = 0; d < 4; d++) { const t = g.nb[i * 4 + d]; if (t >= 0 && b[t] === 0) free++; }
    return { at: i, free };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
function explainMistake(s, mv, next, best, played, by, loss, names) {
  const me = names[by], delayed = s.rules.capture === 'delayed';
  const taken = delayed ? 'bound' : 'taken', take = delayed ? 'bind' : 'take';
  if (next.over && next.over.winner === -by) {
    return { kind: 'lost', text: `${me} lost at once by ${mv.t === 'm' ? 'playing ' : ''}${moveText(s, mv)}.` };
  }
  const reply = !next.over && next.turn === -by ? findLegal(next, played.pv[1]) : null;
  if (reply) {
    const after = applyMove(next, reply, false);
    if (after.over && after.over.winner === -by) {
      const dux = after.over.reason === 'dux' ? duxFree(next, by) : null;
      if (dux) return { kind: 'dux', text: `${me} left the dux on ${sq(s, dux.at)} where it could be hemmed in by ${moveText(next, reply)}.` };
      return { kind: 'lost', text: `${me} allowed ${moveText(next, reply)}, which wins the game at once.` };
    }
    const traps = trapsOfMove(next, reply).map((t) => t.at);
    if (traps.length) {
      const by2 = ` by ${moveText(next, reply)}`;
      if (mv.t !== 'x' && traps.length === 1 && traps[0] === mv.to) {
        const how = mv.t === 'p' ? `placed a piece on ${sq(s, mv.to)}` : `moved to ${sq(s, mv.to)}`;
        return { kind: 'hung', text: `${me} ${how}, where it could be ${taken}${by2}.` };
      }
      return { kind: 'hung', text: `${me} left ${pieceAt(next, traps)} where ${traps.length > 1 ? 'they' : 'it'} could be ${taken}${by2}.` };
    }
  }
  const bestTraps = best.move.t === 'm' ? trapsOfMove(s, best.move).map((t) => t.at) : [];
  const playedTraps = mv.t === 'm' ? trapsOfMove(s, mv).length : 0;
  if (bestTraps.length > playedTraps) {
    return { kind: 'missed-capture', text: `${me} missed the chance to ${take} ${pieceAt(s, bestTraps)} with ${moveText(s, best.move)}.` };
  }
  if (best.score >= 900) {
    return { kind: 'missed-win', text: `${me} missed a forced win beginning with ${moveText(s, best.move)}.` };
  }
  if (reply) {
    const after = applyMove(next, reply, false);
    if (!after.over) {
      const hit = [...danger(after, by)];
      if (hit.length >= 2) {
        return { kind: 'fork', text: `${me} allowed ${moveText(next, reply)}, which attacks ${pieceAt(after, hit)} at once.` };
      }
      const dux = s.rules.dux === 'immobilise' ? duxFree(after, by) : null;
      if (dux && dux.free <= 1) {
        return { kind: 'dux', text: `${me} let the dux on ${sq(s, dux.at)} be hemmed in: after ${moveText(next, reply)} it has ${dux.free === 1 ? 'one free square' : 'no free square'} left.` };
      }
    }
  }
  if (sameMove(best.move, mv)) return { kind: 'positional', text: `${me} played ${moveText(s, mv)}, the best move in a difficult position.` };
  return { kind: 'positional', text: `${me} played ${moveText(s, mv)}; ${moveText(s, best.move)} was stronger by about ${loss.toFixed(1)} men.` };
}

export async function reviewGame(startState, moves, opts = {}, onProgress) {
  const depth = opts.depth ?? 5, timeMs = opts.timeMs ?? 250;
  const names = { 1: 'White', [-1]: 'Black', ...(opts.names || null) };
  const pause = opts.pause || macrotask;
  const plies = [], graph = [], notes = [];
  const acc = { 1: [], [-1]: [] };
  let s = startState;
  for (let i = 0; i < moves.length && !s.over; i++) {
    if (opts.shouldCancel && opts.shouldCancel()) { const e = new Error('cancelled'); e.name = 'AbortError'; throw e; }
    const mv = findLegal(s, moves[i]);
    if (!mv) throw new Error(`reviewGame: move ${i} is not legal in the position reached`);
    const by = s.turn;
    const res = analyse(s, { multi: 2, include: mv, depth, timeMs, maxNodes: opts.maxNodes, history: s.history });
    const best = res.lines[0];
    const played = res.lines.find((l) => sameMove(l.move, mv)) || best;
    const second = res.lines.find((l) => l !== best && !sameMove(l.move, best.move)) || null;
    const next = applyMove(s, mv, true);
    const isBest = sameMove(best.move, mv);

    const bestMen = clamp(best.score);
    let playedMen = isBest ? bestMen : Math.min(bestMen, clamp(played.score));
    if (next.over) playedMen = next.over.winner === 0 ? 0 : next.over.winner === by ? CLAMP : -CLAMP;
    const loss = Math.max(0, bestMen - playedMen);
    const drop = Math.max(0, winChance(bestMen) - winChance(playedMen));

    let tag = isBest || loss <= 0.02 ? 'best' : drop < TAG_LIMITS.inaccuracy ? 'good' : drop < TAG_LIMITS.mistake ? 'inaccuracy'
      : drop < TAG_LIMITS.blunder ? 'mistake' : 'blunder';
    if (tag === 'best' && mv.t !== 'x' && !next.over && next.turn === -by && bestMen > -2 && bestMen < CLAMP) {
      // Brilliant: the move offers material (something new can be taken) and the search still prefers it clearly.
      const before = danger(s, by), offered = [...danger(next, by)].filter((x) => x === mv.to || !before.has(x));
      if (offered.length && (!second || bestMen - clamp(second.score) >= 0.4)) tag = 'brilliant';
    }
    if (s.rules.capture !== 'delayed' && tag === 'brilliant' && mv.t === 'm' && trapsOfMove(s, mv).length) tag = 'best'; // a plain trade

    const scoreBefore = round2(bestMen * by), scoreAfter = round2(playedMen * by);
    if (i === 0) graph.push(scoreBefore);
    graph.push(scoreAfter);
    plies.push({ ply: i, by, move: mv, scoreBefore, scoreAfter, best: best.move, bestScore: scoreBefore, loss: round2(loss), tag });
    notes.push({ s, mv, next, best, played, by, loss, drop });
    acc[by].push(Math.max(0, Math.min(100, 103.17 * Math.exp(-4.354 * drop) - 3.17)));
    if (onProgress) onProgress({ ply: i, total: moves.length, done: i + 1, tag });
    await pause();
    s = next;
  }

  const mean = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  const turningPoints = plies
    .map((p, i) => ({ p, n: notes[i] }))
    .filter((x) => x.n.drop >= TAG_LIMITS.inaccuracy && x.p.loss >= 0.3)
    .sort((a, b) => b.p.loss - a.p.loss)
    .slice(0, 3)
    .sort((a, b) => a.p.ply - b.p.ply)
    .map(({ p, n }) => {
      const why = explainMistake(n.s, n.mv, n.next, n.best, n.played, n.by, n.loss, names);
      return { ply: p.ply, swing: round2(p.scoreAfter - p.scoreBefore), kind: why.kind, text: why.text };
    });
  return { plies, accuracy: { white: mean(acc[1]), black: mean(acc[-1]) }, turningPoints, graph };
}

// ---------------------------------------------------------------------------------------------------------------
const WIN_TEXT = {
  dux: 'Wins the game: the enemy dux is hemmed in and cannot move.',
  pieces: 'Wins the game: the enemy has too few pieces left.',
  blocked: 'Wins the game: the enemy has no legal move.',
  limit: 'Ends the game on piece count, in your favour.',
  repetition: 'Ends the game on piece count, in your favour.',
};

export function explainMove(state, move) {
  const s = state, me = s.turn;
  const mv = findLegal(s, move);
  if (!mv) return ['That move is not legal here.'];
  if (mv.t === 'x') return ['Ends the turn: moving the piece again would gain nothing.'];
  const next = applyMove(s, mv, false), info = next.last, out = [];
  const b = s.board;

  if (next.over && next.over.winner === me) out.push(WIN_TEXT[next.over.reason] || 'Wins the game.');
  if (info.captured.length) {
    out.push(`Captures ${pieceAt(s, info.captured)}.` + (info.extra ? ' The capture earns another move with the same piece.' : ''));
  }
  if (info.bound.length) {
    out.push(`Traps ${pieceAt(s, info.bound)}: ${info.bound.length > 1 ? 'they are' : 'it is'} bound and will be taken off next turn unless rescued.`);
  }
  const freed = info.freed.filter((i) => b[i] * me > 0);
  if (freed.length) out.push(`Frees your bound ${freed.length > 1 ? 'pieces' : 'piece'} on ${list(freed.map((i) => sq(s, i)))} by trapping a captor.`);

  if (!next.over) {
    // Your pieces that were in danger and no longer are.
    const before = danger(s, me), after = danger(next, me);
    if (mv.t === 'm' && before.has(mv.from) && !after.has(mv.to)) {
      out.push(`Your ${Math.abs(b[mv.from]) === 2 ? 'dux' : 'piece'} on ${sq(s, mv.from)} could have been taken; this moves it to safety.`);
    }
    const guarded = [...before].filter((i) => i !== mv.from && next.board[i] * me > 0 && !after.has(i));
    if (guarded.length) out.push(`Protects ${pieceAt(s, guarded).replace(/^the/, 'your')}, which could have been taken.`);

    // New threats against the enemy.
    const was = danger(s, -me), now = [...danger(next, -me)].filter((i) => !was.has(i));
    if (now.length >= 2) out.push(`Attacks ${pieceAt(next, now)} at once: only one can be saved.`);
    else if (now.length === 1) out.push(`Threatens to take ${pieceAt(next, now)}.`);

    if (s.rules.dux === 'immobilise') {
      const e0 = duxFree(s, -me), e1 = duxFree(next, -me), m0 = duxFree(s, me), m1 = duxFree(next, me);
      if (e0 && e1 && e1.free < e0.free) out.push(`Hems in the enemy dux: it has ${e1.free === 1 ? 'one free square' : `${e1.free} free squares`} left.`);
      if (m0 && m1 && m0.free <= 1 && m1.free > m0.free) out.push('Gives your dux room to move.');
    }
  }
  if (out.length < 2) {
    const g = geometry(s.cols, s.rows);
    let friends = 0, hadFriends = 0;
    for (let d = 0; d < 4; d++) {
      const t = g.nb[mv.to * 4 + d];
      if (t >= 0 && t !== mv.from && b[t] * me > 0) friends++;
      if (mv.t === 'm') { const u = g.nb[mv.from * 4 + d]; if (u >= 0 && b[u] * me > 0) hadFriends++; }
    }
    if (friends > 0 && (mv.t === 'p' || hadFriends === 0)) out.push('Stands beside a friendly piece, so it cannot be flanked along that line.');
  }
  if (out.length === 0) {
    out.push(mv.t === 'p' ? 'A sound square: the piece cannot be trapped there at once.' : 'A quiet move: it keeps your pieces safe and improves their position.');
  }
  return out.slice(0, 3);
}
