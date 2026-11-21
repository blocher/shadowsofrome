// Difficulty levels and character personalities for the Latrunculi AI.
//
// Public API
//   LEVELS            -> five entries { id, name, latin, english, blurb, depth, timeMs, blunder, noise, vision, ... }
//                        id 1..5: Tiro, Miles, Centurio, Legatus, Imperator.
//                          depth    search depth cap in turns (a capture's extra move does not use up depth)
//                          timeMs   time budget per move (the placement phase uses `placeTime` of it)
//                          blunder  chance per move of picking among the top `top` candidates, weighted by score
//                          noise    standard deviation (in men) of the noise added to each candidate's score
//                          vision   chance, per own piece, of noticing that the opponent's reply can take it
//                          weights  multipliers applied to the evaluation weights (what the level does not "see")
//   PERSONALITIES     -> { maximus, titus, aghiles }: { id, name, style, mul, add, low, rattle, endgame, ... }
//   resolveSettings(opts, state) -> the effective search settings for chooseMove:
//                        { level, depth, timeMs, noise, blunder, vision, top, temp, weights, prune, ttBits, placeWidth }
//                        opts = { level: 1..5, personality: 'maximus' | 'titus' | 'aghiles' | null, rattled: 0..1, timeMs? }
import { DEFAULT_WEIGHTS, mixWeights } from './evaluate.js';

export const LEVELS = [
  {
    id: 1, name: 'Tiro', latin: 'Tiro', english: 'Recruit',
    blurb: 'A raw recruit. Looks one move ahead and often fails to notice that a piece can be taken.',
    depth: 1, timeMs: 150, blunder: 0.2, noise: 0.22, vision: 0.4,
    top: 4, temp: 1.1, placeTime: 1, ttBits: 12, prune: false, placeWidth: 8,
    weights: { hanging: 0, forked: 0.5, pressure: 0.5, double: 0.5 },
  },
  {
    id: 2, name: 'Miles', latin: 'Miles', english: 'Soldier',
    blurb: 'A common soldier. Takes what is offered and guards what is attacked, but walks into forks.',
    depth: 2, timeMs: 250, blunder: 0.12, noise: 0.18, vision: 0.9,
    top: 4, temp: 0.9, placeTime: 1, ttBits: 14, prune: false, placeWidth: 8,
    weights: { forked: 0, threat: 0.4, hanging: 0.5, double: 0.3 },
  },
  {
    id: 3, name: 'Centurio', latin: 'Centurio', english: 'Centurion',
    blurb: 'A solid club player. Plans two or three moves ahead and seldom leaves a piece hanging.',
    depth: 3, timeMs: 500, blunder: 0.05, noise: 0.12, vision: 1, shallow: 0.3,
    top: 3, temp: 0.6, placeTime: 1, ttBits: 16, prune: true, placeWidth: 10,
    weights: null,
  },
  {
    id: 4, name: 'Legatus', latin: 'Legatus', english: 'Legate',
    blurb: 'A legion commander. Strong and patient; rarely makes a mistake.',
    depth: 4, timeMs: 700, blunder: 0.01, noise: 0.06, vision: 1,
    top: 2, temp: 0.4, placeTime: 0.6, ttBits: 18, prune: true, placeWidth: 12,
    weights: null,
  },
  {
    id: 5, name: 'Imperator', latin: 'Imperator', english: 'Commander-in-chief',
    blurb: 'The winner’s title. Searches as deep as the clock allows.',
    depth: 64, timeMs: 1500, blunder: 0, noise: 0, vision: 1,
    top: 1, temp: 0.3, placeTime: 0.45, ttBits: 18, prune: true, placeWidth: 14,
    weights: null,
  },
];

export const PERSONALITIES = {
  maximus: {
    id: 'maximus', name: 'Maximus',
    style: 'Sharp tactician: hunts forks and attacks, gives up material for tempo, overextends at low levels.',
    mul: { pressure: 2.4, double: 2.2, hanging: 1.5, threat: 1.2, forked: 1.1, pair: 0.6, block: 0.5, exposed: 0.6, isolated: 0.5, advance: 2, centre: 1.6, material: 0.96 },
    add: { tension: 0.05 },
    // Levels 1-2: single pieces run ahead of the line.
    low: { maxLevel: 2, mul: { exposed: 0, isolated: 0, advance: 2, pair: 0.5 } },
    rattle: null, endgame: null,
  },
  titus: {
    id: 'titus', name: 'Titus',
    style: 'Experienced and cautious: keeps his pieces paired, avoids even trades, and plays worse when rattled.',
    mul: { pair: 1.5, block: 1.5, exposed: 1.2, isolated: 1.2, sandwich: 1.3, threat: 1.2, forked: 1.15, corner: 1.3 },
    add: { keepPieces: 0.02 },
    low: null,
    // `rattled` (0..1, set by the game after he loses pieces) is multiplied by these per-level amounts.
    rattle: { noise: [0.5, 0.45, 0.35, 0.06, 0.03], blunder: [0.3, 0.25, 0.18, 0.03, 0.015], vision: [0.25, 0.3, 0, 0, 0] },
    endgame: null,
  },
  aghiles: {
    id: 'aghiles', name: 'Aghiles',
    style: 'Patient hunter: a solid phalanx, squeezes the opponent’s mobility, waits, and is at his best in the endgame.',
    mul: { pair: 1.3, block: 1.4, mobility: 2.2, stuck: 1.6, advance: 0.5, quiet: 1.4, simplify: 2 },
    add: null,
    low: null, rattle: null,
    // With few pieces left he calculates a little further and more steadily (levels below Imperator).
    endgame: { pieces: 14, depth: 1, noise: 0.5, blunder: 0.5 },
  },
};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Combine level, personality and mood into concrete search settings. */
export function resolveSettings(opts = {}, state = null) {
  const id = Math.max(1, Math.min(5, Math.round(opts.level ?? 3)));
  const L = LEVELS[id - 1];
  const P = opts.personality ? PERSONALITIES[opts.personality] ?? null : null;
  let weights = L.weights ? mixWeights(DEFAULT_WEIGHTS, L.weights) : { ...DEFAULT_WEIGHTS };
  let { depth, noise, blunder, vision } = L;
  if (P) {
    weights = mixWeights(weights, P.mul, P.add);
    if (P.low && id <= P.low.maxLevel) weights = mixWeights(weights, P.low.mul, P.low.add);
    const r = clamp01(opts.rattled ?? 0);
    if (P.rattle && r > 0) {
      noise += r * P.rattle.noise[id - 1];
      blunder += r * P.rattle.blunder[id - 1];
      vision -= r * P.rattle.vision[id - 1];
    }
    if (P.endgame && state && state.phase === 'move') {
      let pieces = 0;
      for (let i = 0; i < state.board.length; i++) if (state.board[i] !== 0) pieces++;
      if (pieces <= P.endgame.pieces) {
        if (id < 5) depth += P.endgame.depth;
        noise *= P.endgame.noise; blunder *= P.endgame.blunder;
      }
    }
  }
  const placing = state ? state.phase === 'place' : false;
  const timeMs = opts.timeMs ?? Math.round(L.timeMs * (placing ? L.placeTime : 1));
  return {
    level: id, personality: P ? P.id : null, depth, timeMs, noise, blunder: clamp01(blunder), vision: clamp01(vision),
    top: L.top, temp: L.temp, weights, prune: L.prune, ttBits: L.ttBits, placeWidth: L.placeWidth, shallow: L.shallow || 0,
  };
}
