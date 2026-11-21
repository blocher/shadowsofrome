// Self-play matches between two AI configurations, for the strength tests and for tuning.
//
// Public API
//   playMatch(rules, a, b, { games = 6, maxPlies = 120, seed = 1 } = {})
//       -> { wins, draws, losses, points (0..1), pieces (average piece lead) }   from a's point of view
//     `rules` is a preset id or a rules object; `a` and `b` are chooseMove option sets ({ level, personality,
//     maxNodes, depth ... }). Colours alternate and every move is seeded, and the clock is switched off (timeMs is
//     set to FOREVER), so only search depth and node budgets bound the search: the result is exactly the same on
//     every machine. A game still running after `maxPlies` is adjudicated on piece count, as the engine itself
//     does at the quiet limit.
//   FOREVER -> a time budget that never runs out
import { createGame, applyMove, countPieces } from '../engine/engine.js';
import { chooseMove } from './search.js';

export const FOREVER = 1e9;

export function playMatch(rules, a, b, { games = 6, maxPlies = 120, seed = 1 } = {}) {
  let wins = 0, draws = 0, losses = 0, lead = 0;
  for (let g = 0; g < games; g++) {
    const aSide = g % 2 === 0 ? 1 : -1;
    let s = createGame(rules);
    for (let ply = 0; ply < maxPlies && !s.over; ply++) {
      const opts = s.turn === aSide ? a : b;
      s = applyMove(s, chooseMove(s, { ...opts, timeMs: FOREVER, seed: (seed + g) * 7919 + ply }).move);
    }
    const [white, black] = countPieces(s);
    const winner = s.over ? s.over.winner : white > black ? 1 : black > white ? -1 : 0;
    if (winner === aSide) wins++; else if (winner === 0) draws++; else losses++;
    lead += aSide === 1 ? white - black : black - white;
  }
  return { wins, draws, losses, points: (wins + draws / 2) / games, pieces: lead / games };
}
