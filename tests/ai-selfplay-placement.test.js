import { describe, it, expect } from 'vitest';
import { playMatch as match } from '../src/latrunculi/ai/selfplay.js';
import { PRESETS } from '../src/latrunculi/engine/rules.js';

// The same direction in a placement preset (empty board, single steps). See ai-selfplay.test.js for the method.
describe('self-play: piso (placement, single steps)', () => {
  it('Centurio (3) beats Tiro (1)', () => {
    const r = match('piso', { level: 3 }, { level: 1 }, { games: 6, maxPlies: 160, seed: 1 });
    console.log('piso L3 v L1', JSON.stringify(r));
    expect(r.wins).toBeGreaterThanOrEqual(5);
    expect(r.losses).toBe(0);
    expect(r.pieces).toBeGreaterThan(1.5);
  });
  it('Imperator (5, on a small node budget) comes out ahead of Centurio (3)', () => {
    // As in the legionary test: the same rules on a 6 x 6 board with ten men a side, so that sixteen games fit.
    // Measured over 40 games: +19 =17 -4.
    const small = { ...PRESETS.piso, cols: 6, rows: 6, men: 10 };
    const r = match(small, { level: 5, maxNodes: 2000 }, { level: 3 }, { games: 16, maxPlies: 110, seed: 1 });
    console.log('piso 6x6 L5 v L3', JSON.stringify(r));
    expect(r.wins).toBeGreaterThanOrEqual(r.losses + 2);
    expect(r.points).toBeGreaterThanOrEqual(0.55);
  });
});
