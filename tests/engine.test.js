import { describe, it, expect } from 'vitest';
import {
  createGame, fromDiagram, legalMoves, applyMove, movesFrom, countPieces, sqIndex, sq, isBound, threatened,
  capturingMoves, notate, serialize, deserialize, WHITE, BLACK,
} from '../src/latrunculi/engine/engine.js';
import { PRESETS, PRESET_ORDER, normalizeRules } from '../src/latrunculi/engine/rules.js';

const mv = (s, a, b) => {
  const from = sqIndex(s, a), to = sqIndex(s, b);
  const m = legalMoves(s).find((x) => x.t === 'm' && x.from === from && x.to === to);
  if (!m) throw new Error(`illegal ${a}-${b}`);
  return applyMove(s, m);
};
const can = (s, a, b) => legalMoves(s).some((x) => x.t === 'm' && x.from === sqIndex(s, a) && x.to === sqIndex(s, b));
const at = (s, name) => s.board[sqIndex(s, name)];

describe('setup', () => {
  it('legionary: two ranks of eight each, white to move', () => {
    const s = createGame('legionary');
    expect(countPieces(s)).toEqual([16, 16]);
    expect(at(s, 'a1')).toBe(1); expect(at(s, 'h2')).toBe(1); expect(at(s, 'a3')).toBe(0);
    expect(at(s, 'a8')).toBe(-1); expect(at(s, 'h7')).toBe(-1);
    expect(s.turn).toBe(WHITE); expect(s.phase).toBe('move');
  });
  it('stanway: twelve men on the back rank, dux at g2 and f7, black first', () => {
    const s = createGame('stanway');
    expect(s.cols).toBe(12); expect(s.rows).toBe(8);
    expect(countPieces(s)).toEqual([13, 13]);
    expect(at(s, 'g2')).toBe(2); expect(at(s, 'f7')).toBe(-2);
    expect(at(s, 'a1')).toBe(1); expect(at(s, 'l8')).toBe(-1);
    expect(s.turn).toBe(BLACK);
  });
  it('placement presets start on an empty board', () => {
    for (const id of ['piso', 'seneca', 'bell']) {
      const s = createGame(id);
      expect(s.phase).toBe('place'); expect(countPieces(s)).toEqual([0, 0]);
      expect(legalMoves(s).length).toBe(s.cols * s.rows);
    }
  });
  it('normalizeRules clamps piece counts to what fits', () => {
    const r = normalizeRules({ ...PRESETS.legionary, cols: 7, rows: 7, men: 30 });
    expect(r.men).toBe(21);
    const d = normalizeRules({ ...PRESETS.stanway, cols: 7, rows: 7, men: 30 });
    expect(d.men).toBe(14);
    expect(createGame(d).board.filter((v) => v !== 0).length).toBe(30);
  });
});

describe('movement', () => {
  it('slides like a rook and cannot pass through pieces', () => {
    const s = createGame('legionary');
    expect(can(s, 'a2', 'a6')).toBe(true);
    expect(can(s, 'a2', 'a7')).toBe(false); // occupied
    expect(can(s, 'a1', 'a3')).toBe(false); // blocked by own piece
    expect(can(s, 'a2', 'b3')).toBe(false); // no diagonals
  });
  it('steps one square in piso', () => {
    const s = fromDiagram('piso', ['.....', '.....', '..w..', '.....', '.....']);
    expect(movesFrom(s, sqIndex(s, 'c3')).map((m) => sq(s, m.to)).sort()).toEqual(['b3', 'c2', 'c4', 'd3']);
  });
  it('hops over own pieces in seneca, in chains', () => {
    const s = fromDiagram('seneca', ['.....', '.....', 'ww.w.', '.....', '.....']);
    const dests = movesFrom(s, sqIndex(s, 'a3')).map((m) => sq(s, m.to)).sort();
    expect(dests).toEqual(['a2', 'a4', 'c3', 'e3']); // a3^c3 over b3, then c3^e3 over d3
    const hop = movesFrom(s, sqIndex(s, 'a3')).find((m) => sq(s, m.to) === 'e3');
    expect(hop.hop).toBe(true);
  });
});

describe('capture', () => {
  it('traps one enemy between two on a line; the mover does the capturing', () => {
    let s = fromDiagram('legionary', ['.....', '.....', '.wb..', '.....', '...w.']);
    s = mv(s, 'd1', 'd3');
    expect(at(s, 'c3')).toBe(0);
    expect(s.last.captured).toEqual([sqIndex(s, 'c3')]);
    expect(s.captured).toEqual([1, 0]);
  });
  it('moving between two enemies is safe', () => {
    let s = fromDiagram('legionary', ['.....', '.....', '.b.b.', '.....', '..w.w'], WHITE);
    s = mv(s, 'c1', 'c3');
    expect(at(s, 'c3')).toBe(1);
    expect(countPieces(s)).toEqual([2, 2]);
  });
  it('takes several pieces with one move', () => {
    let s = fromDiagram('legionary', ['..w..', '..b..', 'wb.bw', '.....', '..w..']);
    s = mv(s, 'c1', 'c3');
    expect(s.last.captured.length).toBe(3);
    expect(countPieces(s)).toEqual([4, 0]);
    expect(s.over).toEqual({ winner: WHITE, reason: 'pieces' });
  });
  it('edges do not capture', () => {
    let s = fromDiagram('legionary', ['.....', '.....', 'b....', '.....', '.w.wb'], WHITE);
    s = mv(s, 'b1', 'b3');
    expect(at(s, 'a3')).toBe(-1);
  });
  it('takes a piece in a corner with two on its sides', () => {
    let s = fromDiagram('legionary', ['.....', '.....', '.....', 'w....', 'b..w.'], WHITE);
    s = mv(s, 'd1', 'b1');
    expect(at(s, 'a1')).toBe(0);
  });
  it('no corner capture when the rule is off', () => {
    let s = fromDiagram({ ...PRESETS.legionary, cornerCapture: false }, ['....b', '.....', '.....', 'w....', 'b..w.'], WHITE);
    s = mv(s, 'd1', 'b1');
    expect(at(s, 'a1')).toBe(-1);
  });
  it('safeEntry off forbids stepping between two enemies unless it captures', () => {
    const rules = { ...PRESETS.legionary, safeEntry: false };
    const s = fromDiagram(rules, ['.....', '.....', '.b.b.', '.....', '..w.w'], WHITE);
    expect(can(s, 'c1', 'c3')).toBe(false);
    const t = fromDiagram(rules, ['.....', '.....', 'wb.b.', '.....', '..w.w'], WHITE);
    expect(can(t, 'c1', 'c3')).toBe(true);
  });
  it('threatened() and capturingMoves() see one-move captures', () => {
    const s = fromDiagram('legionary', ['.....', '.....', '.wb..', '.....', '...w.']);
    expect([...threatened(s, BLACK)]).toEqual([sqIndex(s, 'c3')]);
    expect(capturingMoves(s).length).toBe(1);
    expect(threatened(s, WHITE).size).toBe(0);
  });
});

describe('placement', () => {
  it('piso alternates one piece at a time, then white moves first', () => {
    let s = createGame({ ...PRESETS.piso, men: 3 });
    const order = [];
    while (s.phase === 'place') { order.push(s.turn); s = applyMove(s, legalMoves(s)[0]); }
    expect(order).toEqual([1, -1, 1, -1, 1, -1]);
    expect(s.turn).toBe(WHITE); expect(countPieces(s)).toEqual([3, 3]);
  });
  it('bell places two per turn and the dux last', () => {
    let s = createGame({ ...PRESETS.bell, men: 4 });
    const order = [], pieces = [];
    while (s.phase === 'place') { order.push(s.turn); s = applyMove(s, legalMoves(s)[0]); pieces.push(s.last.piece); }
    expect(order).toEqual([1, 1, -1, -1, 1, 1, -1, -1, 1, -1]);
    expect(pieces.slice(-2)).toEqual([2, -2]);
    expect(pieces.slice(0, 8).every((p) => Math.abs(p) === 1)).toBe(true);
  });
  it('no captures happen during placement', () => {
    let s = createGame({ ...PRESETS.piso, men: 3 });
    for (const name of ['a1', 'b1', 'c1']) s = applyMove(s, { t: 'p', to: sqIndex(s, name) });
    expect(at(s, 'b1')).toBe(-1);
  });
});

describe('seneca: bound pieces', () => {
  it('a trapped piece is bound, cannot move, and is removed at the captor’s next turn', () => {
    let s = fromDiagram('seneca', ['......', '......', '.wb...', '...w..', '.....b', '......']);
    s = mv(s, 'd3', 'd4');
    const c4 = sqIndex(s, 'c4');
    expect(isBound(s, c4)).toBe(true);
    expect(s.last.bound).toEqual([c4]);
    expect(movesFrom(s, c4).length).toBe(0);
    s = mv(s, 'f2', 'f1'); // black does not rescue
    expect(at(s, 'c4')).toBe(0);
    expect(s.last.removed).toEqual([c4]);
    expect(s.captured).toEqual([1, 0]);
  });
  it('trapping a captor frees the bound piece', () => {
    let s = fromDiagram('seneca', ['......', '...b..', '.wb...', '...w..', '...b..', '......']);
    s = mv(s, 'd3', 'd4'); // binds c4 (captors b4 and d4); d4 now stands between d5 and ... d3 is empty
    expect(isBound(s, sqIndex(s, 'c4'))).toBe(true);
    s = mv(s, 'd2', 'd3'); // black traps d4 between d5 and d3
    expect(isBound(s, sqIndex(s, 'd4'))).toBe(true);
    expect(isBound(s, sqIndex(s, 'c4'))).toBe(false);
    expect(s.last.freed).toEqual([sqIndex(s, 'c4')]);
    expect(at(s, 'c4')).toBe(-1);
  });
  it('a bound piece does not count as a captor', () => {
    let s = fromDiagram('seneca', ['......', '...b..', '.wb...', '...w..', '...b..', 'w.....']);
    s = mv(s, 'd3', 'd4'); s = mv(s, 'd2', 'd3'); // white d4 is bound
    s = mv(s, 'a1', 'a2');
    expect(at(s, 'd4')).toBe(0); // removed at black's turn start... (black moved, so white piece is taken when black is to move again)
  });
});

describe('bell: dux and extra move', () => {
  it('a capture earns another move with the same piece, which may be declined', () => {
    let s = fromDiagram('bell', ['.......', '.......', '.wb....', '...w...', '......b', '.......', '......b']);
    s = mv(s, 'd4', 'd5');
    expect(s.last.captured.length).toBe(1);
    expect(s.turn).toBe(WHITE); expect(s.chain).toBe(sqIndex(s, 'd5'));
    expect(legalMoves(s).some((m) => m.t === 'x')).toBe(true);
    expect(legalMoves(s).every((m) => m.t === 'x' || m.from === sqIndex(s, 'd5'))).toBe(true);
    s = applyMove(s, { t: 'x' });
    expect(s.turn).toBe(BLACK); expect(s.chain).toBe(-1);
  });
  it('only the dux leaps, and only over an enemy', () => {
    const s = fromDiagram('bell', ['.......', '.......', '.......', '.Wb.w..', '.w.....', '.......', '....b.b']);
    expect(can(s, 'b4', 'd4')).toBe(true);  // dux over enemy c4
    expect(can(s, 'b4', 'b2')).toBe(false); // not over own man
    expect(can(s, 'e4', 'e2')).toBe(false);
  });
  it('the dux can be captured', () => {
    let s = fromDiagram('bell', ['.......', '.......', '.wB....', '...w...', '......b', '.......', '......b']);
    s = mv(s, 'd4', 'd5');
    expect(at(s, 'c5')).toBe(0);
  });
});

describe('stanway: the dux', () => {
  it('the dux cannot be captured but helps to capture', () => {
    let s = fromDiagram('stanway', ['.....b', '......', '.wB...', '......', '...w.b', 'W.....'], WHITE);
    s = mv(s, 'd2', 'd4');
    expect(at(s, 'c4')).toBe(-2);
    s = fromDiagram('stanway', ['.....B', '......', '.Wb...', '......', '...w.b', 'w.....'], WHITE);
    s = mv(s, 'd2', 'd4');
    expect(at(s, 'c4')).toBe(0);
  });
  it('hemming in the enemy dux wins', () => {
    let s = fromDiagram('stanway', ['B....b', 'w.....', '.....W', '......', '.w....', 'w.....'], WHITE);
    s = mv(s, 'b2', 'b6');
    expect(s.over).toEqual({ winner: WHITE, reason: 'dux' });
  });
  it('a dux hemmed in only by his own men is not lost', () => {
    let s = fromDiagram('stanway', ['Bb...b', 'b.....', '.....W', '......', '.w....', 'w.....'], WHITE);
    s = mv(s, 'b2', 'b3');
    expect(s.over).toBe(null);
  });
  it('a lone dux loses', () => {
    let s = fromDiagram('stanway', ['B.....', '......', '.wb...', '......', '...w.W', '......'], WHITE);
    s = mv(s, 'd2', 'd4');
    expect(s.over).toEqual({ winner: WHITE, reason: 'pieces' });
  });
});

describe('endings', () => {
  it('quiet limit decides by piece count', () => {
    let s = fromDiagram({ ...PRESETS.legionary, quietLimit: 4 }, ['b....', '.....', '....b', 'w....', 'w.w..']);
    const seq = [['c1', 'c2'], ['e3', 'e4'], ['c2', 'c1'], ['e4', 'e5']];
    for (const [a, b] of seq) s = mv(s, a, b);
    expect(s.over).toEqual({ winner: WHITE, reason: 'limit' });
  });
  it('third repetition ends the game by count', () => {
    let s = fromDiagram({ ...PRESETS.legionary, quietLimit: 0 }, ['b....', '.....', '....b', 'w....', 'w.w..']);
    const loop = [['c1', 'c2'], ['e3', 'e4'], ['c2', 'c1'], ['e4', 'e3']];
    for (let i = 0; i < 2 && !s.over; i++) for (const [a, b] of loop) { if (!s.over) s = mv(s, a, b); }
    expect(s.over).toEqual({ winner: WHITE, reason: 'repetition' });
  });
  it('a blocked player loses under legionary rules', () => {
    let s = fromDiagram('legionary', ['.....', '.....', 'w....', 'bw...', 'bbw.w'], WHITE);
    s = mv(s, 'e1', 'd1');
    // black: a1,b1,a2 hemmed in by a3,b2,c1 -> no legal moves
    expect(legalMoves({ ...s, over: null }).length).toBe(0);
    expect(s.over).toEqual({ winner: WHITE, reason: 'blocked' });
  });
});

describe('whole games', () => {
  function rng(seed) { let a = seed; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); }
  for (const id of PRESET_ORDER) {
    it(`${id}: random playouts stay consistent and finish`, () => {
      const r = rng(id.length * 7919);
      for (let game = 0; game < 25; game++) {
        let s = createGame(id), plies = 0;
        while (!s.over && plies < 3000) {
          const moves = legalMoves(s);
          expect(moves.length).toBeGreaterThan(0);
          const m = moves[Math.floor(r() * moves.length)];
          const before = countPieces(s);
          const n = applyMove(s, m);
          const after = countPieces(n);
          const lost = before[0] + before[1] - after[0] - after[1];
          if (m.t === 'p') expect(lost).toBe(-1);
          else expect(lost).toBe(n.last.captured.length + n.last.removed.length);
          expect(n.captured[0] + n.captured[1]).toBe(s.captured[0] + s.captured[1] + n.last.captured.length + n.last.removed.length);
          expect(typeof notate(s, m, n.last)).toBe('string');
          s = n; plies++;
        }
        expect(s.over).not.toBe(null);
        const round = deserialize(JSON.parse(JSON.stringify(serialize(s))));
        expect(Array.from(round.board)).toEqual(Array.from(s.board));
        expect(round.key).toBe(s.key);
      }
    });
  }
});
