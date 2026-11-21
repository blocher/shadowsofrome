import { describe, it, expect } from 'vitest';
import {
  createGame, fromDiagram, legalMoves, applyMove, sqIndex, sq, sameMove, threatened, countPieces, isBound, notate,
  WHITE, BLACK,
} from '../src/latrunculi/engine/engine.js';
import { PRESETS, PRESET_ORDER } from '../src/latrunculi/engine/rules.js';
import { chooseMove, analyse } from '../src/latrunculi/ai/search.js';
import { evaluate, features, enPrise, DEFAULT_WEIGHTS } from '../src/latrunculi/ai/evaluate.js';
import { LEVELS, PERSONALITIES, resolveSettings } from '../src/latrunculi/ai/levels.js';
import { reviewGame, explainMove } from '../src/latrunculi/ai/review.js';
import { AIClient } from '../src/latrunculi/ai/client.js';

const ALL = [1, 2, 3, 4, 5];
const SEEDS = [1, 2, 3, 4, 5, 6];
const isLegal = (s, mv) => !!mv && legalMoves(s).some((m) => sameMove(m, mv));
const move = (s, a, b) => legalMoves(s).find((m) => m.t === 'm' && m.from === sqIndex(s, a) && m.to === sqIndex(s, b));
const play = (s, a, b) => applyMove(s, move(s, a, b));
const name = (s, mv) => notate(s, mv);

// Nothing asserted here may depend on how fast the machine is. Every search whose RESULT is checked is bounded by
// depth or by a node count and given a time budget that never runs out (FOREVER); levels 1-3 stop at their own
// depth, levels 4-5 at the node budgets below. Only the "in time" tests use the clock, with generous limits.
const FOREVER = 1e9;
const NODES = { 1: 0, 2: 0, 3: 0, 4: 4000, 5: 6000 };
const pick = (s, level, seed = 1, extra = null) => chooseMove(s, { level, seed, timeMs: FOREVER, maxNodes: NODES[level], ...extra });
const study = (s, opts) => analyse(s, { timeMs: FOREVER, ...opts });

/** A position reached by quick seeded play (level 1 or 2 moves). */
function reach(rules, plies, seed = 1, level = 2) {
  let s = createGame(rules);
  for (let i = 0; i < plies && !s.over; i++) s = applyMove(s, pick(s, level, seed * 1000 + i).move);
  return s;
}

describe('levels and personalities', () => {
  it('has five named levels, with stronger settings going up', () => {
    expect(LEVELS.map((l) => l.name)).toEqual(['Tiro', 'Miles', 'Centurio', 'Legatus', 'Imperator']);
    for (const l of LEVELS) {
      for (const k of ['id', 'name', 'latin', 'blurb', 'depth', 'timeMs', 'blunder', 'noise', 'vision']) expect(l[k]).toBeDefined();
    }
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5]);
    expect(LEVELS[0].depth).toBe(1);                       // Tiro sees one ply
    expect(LEVELS[2].depth).toBeGreaterThan(LEVELS[1].depth);
    expect(LEVELS[4].depth).toBeGreaterThan(LEVELS[3].depth);
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].depth).toBeGreaterThanOrEqual(LEVELS[i - 1].depth);
      expect(LEVELS[i].noise).toBeLessThan(LEVELS[i - 1].noise);
      expect(LEVELS[i].blunder).toBeLessThan(LEVELS[i - 1].blunder);
      expect(LEVELS[i].vision).toBeGreaterThanOrEqual(LEVELS[i - 1].vision);
      expect(LEVELS[i].timeMs).toBeGreaterThan(LEVELS[i - 1].timeMs);
    }
  });
  it('has the three personalities, and Titus plays worse when rattled (hardly at all at the top levels)', () => {
    expect(Object.keys(PERSONALITIES).sort()).toEqual(['aghiles', 'maximus', 'titus']);
    const calm = resolveSettings({ level: 2, personality: 'titus', rattled: 0 });
    const shaken = resolveSettings({ level: 2, personality: 'titus', rattled: 1 });
    expect(shaken.noise).toBeGreaterThan(calm.noise + 0.2);
    expect(shaken.blunder).toBeGreaterThan(calm.blunder + 0.1);
    const top = resolveSettings({ level: 5, personality: 'titus', rattled: 1 });
    expect(top.noise).toBeLessThan(0.05);
    expect(top.blunder).toBeLessThan(0.03);
    // other characters keep their heads
    expect(resolveSettings({ level: 2, personality: 'aghiles', rattled: 1 }).noise).toBe(resolveSettings({ level: 2, personality: 'aghiles' }).noise);
    // placement uses a smaller time budget at the top level
    expect(resolveSettings({ level: 5 }, createGame('piso')).timeMs).toBeLessThan(resolveSettings({ level: 5 }, createGame('legionary')).timeMs);
  });
});

describe('evaluate', () => {
  it('is zero for the symmetric start and counts material in men', () => {
    expect(Math.abs(evaluate(createGame('legionary')))).toBeLessThan(0.3);
    const up = fromDiagram('legionary', ['.bb....', '.......', '.......', '.......', '.......', '.......', '.www...']);
    expect(evaluate(up)).toBeGreaterThan(0.7);
    const down = fromDiagram('legionary', ['.bbb...', '.......', '.......', '.......', '.......', '.......', '.ww....']);
    expect(evaluate(down)).toBeLessThan(-0.7);
    expect(typeof DEFAULT_WEIGHTS.material).toBe('number');
  });
  it('does not think the side that has placed one more piece is a man up', () => {
    let s = createGame('piso');
    s = applyMove(s, { t: 'p', to: sqIndex(s, 'd4') });
    expect(Math.abs(evaluate(s))).toBeLessThan(0.5);
  });
  it('sees pieces that can be trapped in one move, also during placement', () => {
    const s = fromDiagram('legionary', ['.....', '.....', '.wb..', '.....', '...w.']);
    expect(enPrise(s, BLACK)).toEqual([sqIndex(s, 'c3')]);
    expect(enPrise(s, WHITE)).toEqual([]);
    expect(features(s).black.enPrise).toBe(1);
    let p = createGame({ ...PRESETS.piso, men: 4 });
    for (const n of ['c3', 'd3', 'e2']) p = applyMove(p, { t: 'p', to: sqIndex(p, n) }); // w c3, b d3, w e2: e2-e3 would trap d3
    expect(enPrise(p, BLACK)).toEqual([sqIndex(p, 'd3')]);
  });
  it('values a bound piece as nearly lost, less so when it can be rescued', () => {
    const lost = play(fromDiagram('seneca', ['b.....b', '.......', '.wb....', '...w...', '.......', '.......', 'w.....w']), 'd4', 'd5');
    const rescuable = play(fromDiagram('seneca', ['b.....b', '...b...', '.wb....', '...w...', '...b...', '.......', 'w.....w']), 'd4', 'd5');
    expect(isBound(lost, sqIndex(lost, 'c5'))).toBe(true);
    // white: 4 men; black: 3 with one of them bound -> about a man and a bit down
    expect(evaluate(lost)).toBeGreaterThan(1.5);
    // with two more black men one of which can trap a captor, black is close to a man UP
    expect(evaluate(rescuable)).toBeLessThan(0);
  });
  it('fears for a dux with one free square', () => {
    const free = fromDiagram('stanway', ['.......', '..W...B', '.......', '.......', '.b...w.', '....w.w']);
    const tight = fromDiagram('stanway', ['W.....B', 'b......', '.......', '.......', '.b...w.', '....w.w']);
    expect(evaluate(tight)).toBeLessThan(evaluate(free) - 1);
  });
});

describe('every level returns a legal move in time', () => {
  // The only tests that use the clock. The budget is the level's own (capped to keep the suite short) and the
  // limit is five times that plus a second, so a slow or busy machine cannot fail them.
  const budget = (level) => Math.min(LEVELS[level - 1].timeMs, 80);
  const check = (s, level, seed = 7) => {
    const timeMs = budget(level);
    const r = chooseMove(s, { level, seed, timeMs });
    expect(isLegal(s, r.move), `level ${level}: ${JSON.stringify(r.move)}`).toBe(true);
    expect(r.ms).toBeLessThan(timeMs * 5 + 1000);
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.depth).toBeGreaterThanOrEqual(1);
    expect(sameMove(r.pv[0], r.move)).toBe(true);
    return r;
  };
  for (const id of PRESET_ORDER) {
    it(`${id}: opening, middle and late positions`, () => {
      const start = createGame(id);
      const positions = [start, reach(id, 9, 3, 1)];
      if (start.phase === 'place') {
        const total = 2 * (start.rules.men + (start.rules.dux === 'none' ? 0 : 1));
        positions.push(reach(id, total - 3, 4, 1));   // the last placements (the dux, in bell)
        positions.push(reach(id, total + 12, 5, 2));  // the move phase
        expect(positions[1].phase).toBe('place');
        expect(positions[3].phase).toBe('move');
      } else {
        positions.push(reach(id, 30, 5, 2));
      }
      for (const s of positions) {
        if (s.over) continue;
        for (const level of ALL) check(s, level);
      }
    });
  }
  it('house rules: big board, hops over anything, no safe entry, delayed capture with a capturable dux', () => {
    const rules = { ...PRESETS.seneca, cols: 10, rows: 9, men: 24, setup: 'rows', move: 'slide', jump: 'any', safeEntry: false, dux: 'capturable', multiCapture: false, quietLimit: 0 };
    for (const s of [createGame(rules), reach(rules, 14, 2, 2)]) for (const level of ALL) check(s, level);
  });
  it('placement with two pieces per turn: the same side moves twice', () => {
    let s = createGame('bell');
    const order = [];
    for (let i = 0; i < 8; i++) {
      order.push(s.turn);
      s = applyMove(s, check(s, 1 + (i % 5), i).move);
    }
    expect(order).toEqual([1, 1, -1, -1, 1, 1, -1, -1]);
  });
  it('during an extra-move chain: moves the same piece again or stops', () => {
    let s = fromDiagram('bell', ['.b....b', '.......', '.wb....', '...w...', '......b', '.w.....', 'w.....b']);
    s = play(s, 'd4', 'd5');
    expect(s.chain).toBe(sqIndex(s, 'd5'));
    expect(s.turn).toBe(WHITE);
    for (const level of ALL) for (const seed of SEEDS) {
      const r = check(s, level, seed);
      expect(r.move.t === 'x' || r.move.from === s.chain).toBe(true);
    }
  });
  it('continues a chain when the second capture is free', () => {
    // After d4-d5 x c5 the same piece can go on to d6 and take c6 (between b6 and d6).
    let s = fromDiagram('bell', ['......b', '.wb....', '.wb....', '...w...', '......b', '.......', 'w.....b']);
    s = play(s, 'd4', 'd5');
    expect(s.chain).toBe(sqIndex(s, 'd5'));
    for (const level of [2, 3, 4, 5]) expect(name(s, pick(s, level).move)).toBe('d5-d6');
  });
  it('with bound pieces on the board', () => {
    let s = fromDiagram('seneca', ['b.....b', '.......', '.wb....', '...w...', '.......', '.......', 'w.....w']);
    s = play(s, 'd4', 'd5'); // binds c5; black to move and cannot rescue it
    expect(isBound(s, sqIndex(s, 'c5'))).toBe(true);
    for (const level of ALL) for (const seed of SEEDS) {
      const r = check(s, level, seed);
      expect(r.move.from).not.toBe(sqIndex(s, 'c5')); // a bound piece cannot move
    }
  });
  it('returns no move when the game is over', () => {
    const s = play(fromDiagram('legionary', ['.....', '.....', '.wb..', '.....', '...w.']), 'd1', 'd3');
    expect(s.over).not.toBe(null);
    expect(pick(s, 3).move).toBe(null);
    expect(study(s, {}).lines).toEqual([]);
  });
});

describe('tactics', () => {
  it('takes a free capture (Miles and above always, Tiro usually)', () => {
    const s = fromDiagram('legionary', ['..bbb..', '.......', '.......', '..wb...', '.......', '.......', 'w...w.w']);
    for (const level of [2, 3, 4, 5]) for (const seed of SEEDS) {
      expect(name(s, pick(s, level, seed).move)).toBe('e1-e4');
    }
    const tiro = SEEDS.concat([7, 8, 9, 10]).filter((seed) => name(s, pick(s, 1, seed).move) === 'e1-e4').length;
    expect(tiro).toBeGreaterThanOrEqual(6);
  });
  it('level 3 and above do not leave a piece to be taken', () => {
    const attacked = fromDiagram('legionary', ['...b.bb', '.......', '.......', '.bw....', '.......', '.......', '...w.ww']);
    expect(threatened(attacked, WHITE).size).toBe(1);
    const quiet = fromDiagram('legionary', ['...b.b.', '.......', '..b....', '.......', '......b', '..w....', 'w..w.w.']);
    for (const s of [attacked, quiet]) for (const level of [3, 4, 5]) for (const seed of SEEDS) {
      const n = applyMove(s, pick(s, level, seed).move);
      expect(threatened(n, WHITE).size, `level ${level} seed ${seed}`).toBe(0);
    }
  });
  it('Tiro, who looks one move ahead, often overlooks that a piece can be taken', () => {
    const attacked = fromDiagram('legionary', ['...b.bb', '.......', '.......', '.bw....', '.......', '.......', '...w.ww']);
    const seeds = Array.from({ length: 30 }, (_, i) => i + 1);
    const hung = (level) => seeds.filter((seed) => threatened(applyMove(attacked, pick(attacked, level, seed).move), WHITE).size > 0).length;
    const tiro = hung(1), miles = hung(2);
    expect(tiro).toBeGreaterThanOrEqual(6);  // often
    expect(tiro).toBeLessThanOrEqual(24);    // but not always
    expect(miles).toBeLessThan(tiro);        // the soldier guards what is attacked
    expect(miles).toBeLessThanOrEqual(6);
  });
  it('finds a fork: stepping between two enemies wins one of them', () => {
    const s = fromDiagram('legionary', ['.....bb', '.......', '.......', '.......', '.b.b...', '.......', 'w.w.w..']);
    for (const level of [3, 4, 5]) for (const seed of SEEDS) {
      expect(name(s, pick(s, level, seed).move)).toBe('c1-c3');
    }
    const after = play(s, 'c1', 'c3');
    expect(threatened(after, BLACK).size).toBe(2);
    // The engine's analysis agrees and sees the win of a piece: about a man better than any other move.
    const a = study(s, { multi: 2, depth: 5 });
    expect(name(s, a.lines[0].move)).toBe('c1-c3');
    expect(a.lines[0].score - a.lines[1].score).toBeGreaterThan(0.5);
  });
  it('Miles walks into a fork that Centurio avoids', () => {
    // White to move. Black threatens f7-f3, landing between e3 and g3: e3 could then be taken on d3 and g3 on h3.
    const s = fromDiagram('legionary', ['...b.b.b', '........', '........', '........', '........', '....w.w.', '........', 'w.......'], WHITE);
    const forkable = (n) => legalMoves(n).some((m) => m.t === 'm' && threatened(applyMove(n, m), WHITE).size >= 2);
    expect(forkable({ ...s, turn: BLACK })).toBe(true);
    const walks = (level) => SEEDS.filter((seed) => forkable(applyMove(s, pick(s, level, seed).move))).length;
    expect(walks(3)).toBe(0);
    expect(walks(5)).toBe(0);
    expect(walks(2)).toBeGreaterThanOrEqual(2); // measured: 4 of 6
  });
  it('rescues a bound piece in seneca rules by trapping a captor', () => {
    let s = fromDiagram('seneca', ['b.....b', '...b...', '.wb....', '...w...', '...b...', '.......', 'w.....w']);
    s = play(s, 'd4', 'd5'); // white binds c5 between b5 and d5
    expect(isBound(s, sqIndex(s, 'c5'))).toBe(true);
    for (const level of ALL) for (const seed of SEEDS) {
      const r = pick(s, level, seed);
      expect(name(s, r.move)).toBe('d3-d4'); // traps d5 between d4 and d6: c5 is free again
      const n = applyMove(s, r.move);
      expect(isBound(n, sqIndex(n, 'c5'))).toBe(false);
      expect(n.last.freed).toEqual([sqIndex(n, 'c5')]);
    }
  });
  it('immobilises the dux in one in stanway', () => {
    const s = fromDiagram('stanway', ['B....b.', 'w......', '.....W.', '.......', '.w.....', 'w...b.b'], WHITE);
    for (const level of ALL) for (const seed of SEEDS) {
      const r = pick(s, level, seed);
      expect(name(s, r.move)).toBe('b2-b6');
      expect(r.score).toBeGreaterThan(990);
      expect(applyMove(s, r.move).over).toEqual({ winner: WHITE, reason: 'dux' });
    }
  });
  it('avoids being immobilised', () => {
    // White's dux in the corner has one free square (b6) and black threatens b2-b6.
    const s = fromDiagram('stanway', ['W.....B', 'b......', '.......', '.......', '.b...w.', '....w.w'], WHITE);
    const blackWinsAtOnce = (n) => legalMoves(n).some((m) => { const x = applyMove(n, m); return x.over && x.over.winner === BLACK; });
    expect(blackWinsAtOnce({ ...s, turn: BLACK })).toBe(true);
    for (const level of [2, 3, 4, 5]) for (const seed of SEEDS) {
      const n = applyMove(s, pick(s, level, seed).move);
      expect(n.over).toBe(null);
      expect(blackWinsAtOnce(n), `level ${level} seed ${seed}`).toBe(false);
    }
  });
  it('takes the dux where it can be captured, and values it above a man', () => {
    // d4-d5 traps the dux on c5; d4-d3 would only trap a man on c3.
    const s = fromDiagram('bell', ['......b', '.......', '.wB....', '...w...', '.wb....', '.......', 'w.....b']);
    for (const level of [2, 3, 4, 5]) expect(name(s, pick(s, level, 2).move)).toBe('d4-d5');
  });
});

describe('repetition and the quiet limit', () => {
  const rules = { ...PRESETS.legionary, quietLimit: 0 };
  it('the side behind on count avoids the third repetition; the engine scores it as lost', () => {
    let s = fromDiagram(rules, ['b....', '.....', '....b', 'w....', 'w.w..']);
    for (const [a, b] of [['c1', 'c2'], ['e3', 'e4'], ['c2', 'c1'], ['e4', 'e3'], ['c1', 'c2'], ['e3', 'e4'], ['c2', 'c1']]) s = play(s, a, b);
    expect(s.over).toBe(null);
    expect(s.turn).toBe(BLACK);
    const repeat = move(s, 'e4', 'e3'); // third occurrence: white wins on count
    expect(applyMove(s, repeat).over).toEqual({ winner: WHITE, reason: 'repetition' });
    for (const level of [2, 3, 4, 5]) {
      expect(sameMove(pick(s, level).move, repeat)).toBe(false);
    }
    const a = study(s, { depth: 3, include: repeat });
    expect(a.lines.find((l) => sameMove(l.move, repeat)).score).toBeLessThan(-900);
    // The same holds when the history is passed explicitly instead of being read from the state.
    const bare = { ...s, history: [] };
    expect(sameMove(pick(bare, 3, 1, { history: s.history }).move, repeat)).toBe(false);
  });
  it('the side ahead on count is happy to run into the quiet limit', () => {
    const s = fromDiagram({ ...PRESETS.legionary, quietLimit: 6 }, ['b....', '.....', '....b', 'w....', 'w.w..']);
    const a = study({ ...s, quiet: 5 }, { depth: 2 });
    expect(a.score).toBeGreaterThan(990); // any quiet move now wins on count
    const behind = study({ ...s, quiet: 5, turn: BLACK }, { depth: 2 });
    expect(behind.score).toBeLessThan(-990);
  });
});

describe('determinism', () => {
  it('the same seed gives the same game; another seed gives another', () => {
    const run = (seed, level, extra = {}) => {
      let s = createGame('legionary');
      const out = [];
      for (let i = 0; i < 10; i++) {
        const r = pick(s, level, seed, extra);
        out.push(name(s, r.move) + ' ' + r.score.toFixed(3) + ' ' + r.nodes);
        s = applyMove(s, r.move);
      }
      return out.join('|');
    };
    for (const level of [1, 2, 3]) {
      expect(run(11, level)).toBe(run(11, level));
      expect(run(11, level)).not.toBe(run(12, level));
    }
    // The top levels are deterministic too when the search is bounded by nodes or depth instead of the clock.
    expect(run(5, 5, { maxNodes: 1500 })).toBe(run(5, 5, { maxNodes: 1500 }));
    expect(run(5, 4, { depth: 3, maxNodes: 0 })).toBe(run(5, 4, { depth: 3, maxNodes: 0 }));
  });
  it('is deterministic in the placement phase with a personality', () => {
    const run = (seed) => {
      let s = createGame('bell');
      const out = [];
      for (let i = 0; i < 12; i++) { const r = pick(s, 3, seed, { personality: 'maximus' }); out.push(name(s, r.move)); s = applyMove(s, r.move); }
      return out.join(' ');
    };
    expect(run(3)).toBe(run(3));
  });
});

describe('personalities change the style of play', () => {
  const weightsOf = (personality, level = 4) => resolveSettings({ level, personality }).weights;
  it('through their evaluation weights', () => {
    const plain = weightsOf(null), maximus = weightsOf('maximus'), titus = weightsOf('titus'), aghiles = weightsOf('aghiles');
    // Titus: pairs and protection. Maximus: forks, attack and advance, at the cost of cover.
    expect(titus.pair).toBeGreaterThan(plain.pair * 1.2);
    expect(titus.exposed).toBeGreaterThan(plain.exposed * 1.2);
    expect(titus.keepPieces).toBeGreaterThan(0);
    expect(maximus.pair).toBeLessThan(plain.pair * 0.8);
    expect(maximus.pressure).toBeGreaterThan(plain.pressure * 1.5);
    expect(maximus.double).toBeGreaterThan(plain.double * 1.5);
    expect(maximus.advance).toBeGreaterThan(plain.advance * 1.5);
    expect(maximus.material).toBeLessThan(plain.material);
    // Aghiles: phalanx and mobility, and he wants the count to decide.
    expect(aghiles.mobility).toBeGreaterThan(plain.mobility * 1.5);
    expect(aghiles.block).toBeGreaterThan(plain.block * 1.2);
    expect(aghiles.quiet).toBeGreaterThan(plain.quiet);
    // At low levels Maximus overextends: he stops caring that a piece stands alone.
    expect(weightsOf('maximus', 1).isolated).toBe(0);
    expect(weightsOf('maximus', 4).isolated).toBeGreaterThan(0);
  });
  it('through how they judge the same two positions', () => {
    // The same material: white keeps a block at home, or has two men up the board pressing black's line.
    const solid = fromDiagram('legionary', ['.bbbb..', '.bbbb..', '.......', '.......', '.......', '..wwww.', '..wwww.']);
    const forward = fromDiagram('legionary', ['.bbbb..', '.bbbb..', '..w..w.', '.......', '.......', '..ww.w.', '..ww.w.']);
    const lean = (personality) => {
      const w = { ...weightsOf(personality), pov: WHITE };
      return evaluate(forward, w) - evaluate(solid, w); // how much better the forward set-up looks
    };
    const maximus = lean('maximus'), titus = lean('titus'), plain = lean(null);
    expect(maximus).toBeGreaterThan(plain + 0.15);
    expect(plain).toBeGreaterThan(titus + 0.1);
    expect(maximus).toBeGreaterThan(0);
    expect(titus).toBeLessThan(0);
  });
  it('through the games they play (no noise, fixed depth: exactly reproducible)', () => {
    const style = (personality) => {
      let pairs = 0, advance = 0, exposed = 0, n = 0;
      for (const mine of [WHITE, BLACK]) {
        let s = createGame('legionary');
        for (let ply = 0; ply < 40 && !s.over; ply++) {
          const me = s.turn === mine;
          s = applyMove(s, chooseMove(s, { level: 5, depth: 2, timeMs: FOREVER, seed: 1, personality: me ? personality : null }).move);
          if (me && !s.over) {
            const f = features(s)[mine === WHITE ? 'white' : 'black'];
            pairs += f.pairs / f.count; advance += f.advance / f.count; exposed += f.exposed / f.count; n++;
          }
        }
      }
      return { pairs: pairs / n, advance: advance / n, exposed: exposed / n };
    };
    const maximus = style('maximus'), titus = style('titus');
    // Measured: pairs per piece 1.04 v 1.24, ranks advanced per piece 1.61 v 0.91, open lines per piece 0.16 v 0.07.
    expect(titus.pairs).toBeGreaterThan(maximus.pairs + 0.08);
    expect(maximus.advance).toBeGreaterThan(titus.advance + 0.3);
    expect(maximus.exposed).toBeGreaterThan(titus.exposed + 0.04);
  });
});

describe('analyse', () => {
  it('returns the best lines in order, with principal variations of legal moves', () => {
    const s = reach('legionary', 16, 9, 2);
    const a = study(s, { multi: 3, depth: 3 });
    expect(a.lines.length).toBe(3);
    expect(a.depth).toBe(3);
    expect(a.score).toBe(a.lines[0].score);
    expect(a.lines[0].score).toBeGreaterThanOrEqual(a.lines[1].score);
    expect(a.lines[1].score).toBeGreaterThanOrEqual(a.lines[2].score);
    for (const line of a.lines) {
      let t = s;
      expect(sameMove(line.pv[0], line.move)).toBe(true);
      for (const mv of line.pv) { expect(isLegal(t, mv)).toBe(true); t = applyMove(t, mv); }
    }
  });
  it('scores a move it is asked to include', () => {
    const s = fromDiagram('legionary', ['..bbb..', '.......', '.......', '..wb...', '.......', '.......', 'w...w.w']);
    const dull = move(s, 'a1', 'a2');
    const a = study(s, { multi: 1, depth: 3, include: dull });
    expect(name(s, a.lines[0].move)).toBe('e1-e4');
    const line = a.lines.find((l) => sameMove(l.move, dull));
    expect(line).toBeDefined();
    expect(a.lines[0].score - line.score).toBeGreaterThan(0.5);
  });
});

describe('review', () => {
  // White hangs a piece on move one (c1-c4 can be taken by d7-d4... here: b4 + d4), black takes it.
  const start = () => fromDiagram('legionary', ['...b.bb', '.......', '.......', '.b.....', '.......', '.......', '..ww.ww']);
  const game = (s) => {
    const moves = [];
    for (const [a, b] of [['c1', 'c4'], ['d7', 'd4'], ['g1', 'g2'], ['f7', 'f6']]) { const m = move(s, a, b); moves.push(m); s = applyMove(s, m); }
    return moves;
  };
  it('tags an obvious blunder as a blunder and explains it from the board', async () => {
    const s = start(), moves = game(s);
    const seen = [];
    const r = await reviewGame(s, moves, { depth: 3, timeMs: FOREVER }, (p) => seen.push(p.done));
    expect(r.plies.length).toBe(4);
    expect(seen).toEqual([1, 2, 3, 4]);
    const first = r.plies[0];
    expect(first.by).toBe(WHITE);
    expect(first.tag).toBe('blunder');
    expect(first.loss).toBeGreaterThan(0.8);
    expect(first.scoreAfter).toBeLessThan(first.scoreBefore - 0.8);
    expect(sameMove(first.best, first.move)).toBe(false);
    expect(r.plies[1].tag).toBe('best'); // black takes the piece
    expect(r.plies[1].loss).toBe(0);
    expect(r.graph.length).toBe(5);
    expect(r.graph[1]).toBe(first.scoreAfter);
    expect(r.accuracy.white).toBeLessThan(r.accuracy.black);
    expect(r.accuracy.black).toBeGreaterThan(80);
    expect(r.turningPoints.length).toBeGreaterThanOrEqual(1);
    expect(r.turningPoints.length).toBeLessThanOrEqual(3);
    const tp = r.turningPoints[0];
    expect(tp.ply).toBe(0);
    expect(tp.swing).toBeLessThan(-0.8);
    expect(tp.kind).toBe('hung');
    expect(tp.text).toBe('White moved to c4, where it could be taken by d7 to d4.');
  });
  it('uses the players’ names and reports a missed capture', async () => {
    const s = fromDiagram('legionary', ['..bbb..', '.......', '.......', '..wb...', '.......', '.......', 'w...w.w']);
    const moves = [move(s, 'a1', 'a2')];
    const r = await reviewGame(s, moves, { depth: 3, timeMs: FOREVER, names: { 1: 'Maximus', [-1]: 'Titus' } });
    expect(['mistake', 'blunder']).toContain(r.plies[0].tag);
    expect(r.turningPoints[0].kind).toBe('missed-capture');
    expect(r.turningPoints[0].text).toBe('Maximus missed the chance to take the piece on d4 with e1 to e4.');
  });
  it('can be cancelled between plies', async () => {
    const s = start(), moves = game(s);
    let n = 0;
    await expect(reviewGame(s, moves, { depth: 2, timeMs: FOREVER, shouldCancel: () => ++n > 2 })).rejects.toThrow('cancelled');
  });
  it('explainMove gives plain reasons for a move', () => {
    const cap = fromDiagram('legionary', ['..bbb..', '.......', '.......', '..wb...', '.......', '.......', 'w...w.w']);
    expect(explainMove(cap, move(cap, 'e1', 'e4'))[0]).toBe('Captures the piece on d4.');
    const fork = fromDiagram('legionary', ['.....bb', '.......', '.......', '.......', '.b.b...', '.......', 'w.w.w..']);
    expect(explainMove(fork, move(fork, 'c1', 'c3'))).toContain('Attacks the pieces on b3 and d3 at once: only one can be saved.');
    const danger = fromDiagram('legionary', ['...b.bb', '.......', '.......', '.bw....', '.......', '.......', '...w.ww']);
    expect(explainMove(danger, move(danger, 'c4', 'c1'))[0]).toBe('Your piece on c4 could have been taken; this moves it to safety.');
    expect(explainMove(danger, move(danger, 'd1', 'd4'))[0]).toBe('Protects your piece on c4, which could have been taken.');
    let bound = fromDiagram('seneca', ['b.....b', '...b...', '.wb....', '...w...', '...b...', '.......', 'w.....w']);
    const bind = explainMove(bound, move(bound, 'd4', 'd5'));
    expect(bind[0]).toMatch(/^Traps the piece on c5: it is bound/);
    bound = play(bound, 'd4', 'd5');
    const rescue = explainMove(bound, move(bound, 'd3', 'd4'));
    expect(rescue.join(' ')).toContain('Frees your bound piece on c5');
    const dux = fromDiagram('stanway', ['B....b.', 'w......', '.....W.', '.......', '.w.....', 'w...b.b'], WHITE);
    expect(explainMove(dux, move(dux, 'b2', 'b6'))[0]).toBe('Wins the game: the enemy dux is hemmed in and cannot move.');
    const quiet = createGame('legionary');
    const reasons = explainMove(quiet, legalMoves(quiet)[0]);
    expect(reasons.length).toBeGreaterThanOrEqual(1);
    for (const r of reasons) expect(typeof r).toBe('string');
    const placing = createGame('piso');
    expect(explainMove(placing, { t: 'p', to: sqIndex(placing, 'd4') }).length).toBeGreaterThanOrEqual(1);
  });
});

describe('AIClient (in-thread fallback, as no Worker exists here)', () => {
  it('chooses, analyses and reviews through Promises', async () => {
    const ai = new AIClient();
    expect(ai.mode).toBe('thread');
    const s = fromDiagram('legionary', ['..bbb..', '.......', '.......', '..wb...', '.......', '.......', 'w...w.w']);
    const opts = { level: 3, seed: 1, timeMs: FOREVER };
    const r = await ai.choose(s, opts);
    expect(name(s, r.move)).toBe('e1-e4');
    expect(r).toEqual({ ...chooseMove(s, opts), ms: r.ms }); // same answer as a direct call
    const a = await ai.analyse(s, { multi: 2, depth: 2, timeMs: FOREVER });
    expect(a.lines.length).toBe(2);
    const moves = [move(s, 'a1', 'a2')];
    const progress = [];
    const review = await ai.review(s, moves, { depth: 2, timeMs: FOREVER }, (p) => progress.push(p.done));
    expect(review.plies.length).toBe(1);
    expect(progress).toEqual([1]);
    ai.dispose();
    await expect(ai.choose(s, { level: 1 })).rejects.toThrow('disposed');
  });
  it('keeps the game history across the worker boundary', async () => {
    const rules = { ...PRESETS.legionary, quietLimit: 0 };
    let s = fromDiagram(rules, ['b....', '.....', '....b', 'w....', 'w.w..']);
    for (const [a, b] of [['c1', 'c2'], ['e3', 'e4'], ['c2', 'c1'], ['e4', 'e3'], ['c1', 'c2'], ['e3', 'e4'], ['c2', 'c1']]) s = play(s, a, b);
    const ai = new AIClient();
    const r = await ai.choose(s, { level: 4, seed: 1, timeMs: FOREVER, maxNodes: 4000 });
    expect(name(s, r.move)).not.toBe('e4-e3'); // the third repetition would lose on count
    ai.dispose();
  });
  it('cancel rejects what is pending and the client stays usable', async () => {
    const ai = new AIClient();
    const s = createGame('legionary');
    const pending = ai.choose(s, { level: 2, seed: 1, timeMs: FOREVER });
    ai.cancel();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    const r = await ai.choose(s, { level: 2, seed: 1, timeMs: FOREVER });
    expect(isLegal(s, r.move)).toBe(true);
    ai.dispose();
  });
  it('reports errors from the engine as rejections', async () => {
    const ai = new AIClient();
    const s = createGame('legionary');
    await expect(ai.review(s, [{ t: 'm', from: 0, to: 63 }], { depth: 1, timeMs: FOREVER })).rejects.toThrow('not legal');
    ai.dispose();
  });
});

describe('square names used in the tests', () => {
  it('match the engine', () => {
    const s = createGame('legionary');
    expect(sq(s, sqIndex(s, 'e4'))).toBe('e4');
    expect(countPieces(s)).toEqual([16, 16]);
  });
});
