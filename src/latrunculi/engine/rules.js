// Rule presets for Ludus Latrunculorum. Every ruleset is a modern reconstruction; see docs/latrunculi-research.md.
// A ruleset is plain data. The engine (engine.js) reads these fields and nothing else.

/**
 * @typedef {Object} Rules
 * @property {string} id
 * @property {string} name
 * @property {number} cols
 * @property {number} rows
 * @property {number} men            men per side (the dux, if any, is extra)
 * @property {'rows'|'placement'} setup   fixed starting rows, or players place pieces in turn on an empty board
 * @property {number} placePerTurn   pieces placed per turn in a placement setup
 * @property {'step'|'slide'} move   one square, or any distance like a rook
 * @property {'none'|'own'|'any'|'duxEnemy'} jump  hop over one adjacent piece to the empty square beyond
 * @property {boolean} multiJump     hops may be chained in one move
 * @property {'immediate'|'delayed'} capture  delayed: the trapped piece is bound, and removed at the captor's next turn
 * @property {boolean} cornerCapture a piece in a corner is taken by two enemies on its two neighbours
 * @property {boolean} multiCapture  one move may take several pieces
 * @property {boolean} safeEntry     a piece may move between two enemies unharmed
 * @property {boolean} extraMove     a capture earns another move with the same piece
 * @property {'none'|'capturable'|'immobilise'} dux
 * @property {number} loseAt         a side with this many pieces or fewer has lost
 * @property {'lose'|'count'} noMoves  what happens to a player who cannot move
 * @property {number} quietLimit     plies without a capture before the game is decided by count (0 = no limit)
 * @property {1|-1} first            who moves first (1 = white, -1 = black)
 */

/** @type {Record<string, Rules>} */
export const PRESETS = {
  legionary: {
    id: 'legionary', name: 'Legionary',
    blurb: 'The soldiers’ game. Two ranks each, pieces glide like rooks, a trapped piece is taken at once.',
    source: 'Roman Army Museum (Vindolanda Trust) and Museum Quintana',
    evidence: 'The capture between two enemies is ancient. The starting ranks and the rook move are a modern guess, chosen because they play quickly.',
    cols: 8, rows: 8, men: 16, setup: 'rows', placePerTurn: 1, move: 'slide', jump: 'none', multiJump: false,
    capture: 'immediate', cornerCapture: true, multiCapture: true, safeEntry: true, extraMove: false, dux: 'none',
    loseAt: 1, noMoves: 'lose', quietLimit: 60, first: 1,
  },
  piso: {
    id: 'piso', name: 'Piso',
    blurb: 'An empty board. Place your twenty soldiers one by one, then fight one step at a time.',
    source: 'Locus Ludi (Ulrich Schädler and Véronique Dasen), after the Laus Pisonis',
    evidence: 'The poem in praise of Piso speaks of an open board and of white binding black. Twenty pieces and single steps are the scholars’ reconstruction.',
    cols: 8, rows: 8, men: 20, setup: 'placement', placePerTurn: 1, move: 'step', jump: 'none', multiJump: false,
    capture: 'immediate', cornerCapture: true, multiCapture: true, safeEntry: true, extraMove: false, dux: 'none',
    loseAt: 1, noMoves: 'count', quietLimit: 60, first: 1,
  },
  seneca: {
    id: 'seneca', name: 'Seneca',
    blurb: 'A trapped piece is turned over and bound. It is taken on the next turn, unless a friend rescues it first.',
    source: 'Ulrich Schädler (2001) and Locus Ludi',
    evidence: 'Seneca writes of a bound piece that might still get out. This is the reconstruction that uses only what the ancient writers attest.',
    cols: 8, rows: 8, men: 20, setup: 'placement', placePerTurn: 1, move: 'step', jump: 'own', multiJump: true,
    capture: 'delayed', cornerCapture: true, multiCapture: true, safeEntry: true, extraMove: false, dux: 'none',
    loseAt: 1, noMoves: 'count', quietLimit: 60, first: 1,
  },
  bell: {
    id: 'bell', name: 'Bell’s Dux',
    blurb: 'Each army has a general who can leap an enemy. Every capture earns another move.',
    source: 'R. C. Bell, Board and Table Games from Many Civilizations (1960)',
    evidence: 'Bell modelled this on the Egyptian game Seega and admitted that no ancient writer mentions a dux.',
    cols: 8, rows: 7, men: 16, setup: 'placement', placePerTurn: 2, move: 'step', jump: 'duxEnemy', multiJump: false,
    capture: 'immediate', cornerCapture: false, multiCapture: true, safeEntry: true, extraMove: true, dux: 'capturable',
    loseAt: 1, noMoves: 'lose', quietLimit: 60, first: 1,
  },
  stanway: {
    id: 'stanway', name: 'Stanway',
    blurb: 'A long board, twelve soldiers and a general who cannot be taken. Hem in the enemy general to win.',
    source: 'W. J. Kowalski, after the game found in the Doctor’s Grave at Stanway (c. A.D. 50)',
    evidence: 'The Stanway board had thirteen counters a side, one of them different. Whether that game was latrunculi at all is disputed.',
    cols: 12, rows: 8, men: 12, setup: 'rows', placePerTurn: 1, move: 'slide', jump: 'none', multiJump: false,
    capture: 'immediate', cornerCapture: true, multiCapture: true, safeEntry: true, extraMove: false, dux: 'immobilise',
    loseAt: 0, noMoves: 'lose', quietLimit: 80, first: -1,
  },
};

export const PRESET_ORDER = ['legionary', 'piso', 'seneca', 'bell', 'stanway'];

/** Options a player may change in "house rules", with the values each may take. */
export const HOUSE_OPTIONS = {
  cols: [7, 8, 9, 10, 11, 12],
  rows: [7, 8, 9, 10, 11, 12],
  men: [12, 14, 16, 18, 20, 24, 30],
  setup: ['rows', 'placement'],
  placePerTurn: [1, 2],
  move: ['step', 'slide'],
  jump: ['none', 'own', 'any', 'duxEnemy'],
  multiJump: [false, true],
  capture: ['immediate', 'delayed'],
  cornerCapture: [false, true],
  multiCapture: [false, true],
  safeEntry: [false, true],
  extraMove: [false, true],
  dux: ['none', 'capturable', 'immobilise'],
  noMoves: ['lose', 'count'],
  quietLimit: [0, 40, 60, 80, 100],
  first: [1, -1],
};

/** Fill in defaults and clamp impossible combinations. Always returns a fresh object. */
export function normalizeRules(input) {
  const base = typeof input === 'string' ? PRESETS[input] : input;
  if (!base) throw new Error(`Unknown rules: ${input}`);
  const r = { ...PRESETS.legionary, ...base };
  r.cols = Math.max(5, Math.min(14, r.cols | 0));
  r.rows = Math.max(5, Math.min(14, r.rows | 0));
  const duxExtra = r.dux === 'none' ? 0 : 1;
  // Never more pieces than fit in each player's half of the board (rows setup) or 45% of the board (placement).
  // (With a dux, one rank in front of the men is kept for him.)
  const cap = r.setup === 'rows'
    ? (Math.floor((r.rows - 1) / 2) - duxExtra) * r.cols
    : Math.floor(r.cols * r.rows * 0.45) - duxExtra;
  r.men = Math.max(2, Math.min(cap, r.men | 0));
  if (r.dux === 'none' && r.jump === 'duxEnemy') r.jump = 'none';
  if (r.dux === 'immobilise') r.loseAt = 0; else if (!(r.loseAt >= 0)) r.loseAt = 1;
  r.first = r.first === -1 ? -1 : 1;
  return r;
}
