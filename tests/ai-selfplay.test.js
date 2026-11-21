import { describe, it, expect } from 'vitest';
import { playMatch as match } from '../src/latrunculi/ai/selfplay.js';
import { PRESETS } from '../src/latrunculi/engine/rules.js';

// Strength must rise with the level. All searches are bounded by depth or nodes with fixed seeds (see ai/selfplay.js),
// so these results are identical on every machine: the margins below are there for future tuning, not for luck.
describe('self-play: legionary (fixed rows, rook moves)', () => {
  it('Centurio (3) beats Tiro (1)', () => {
    const r = match('legionary', { level: 3 }, { level: 1 }, { games: 4, maxPlies: 120, seed: 1 });
    console.log('legionary L3 v L1', JSON.stringify(r));
    expect(r.wins).toBeGreaterThanOrEqual(3);
    expect(r.losses).toBe(0);
    expect(r.pieces).toBeGreaterThan(3);
  });
  it('Imperator (5, on a small node budget) beats Centurio (3): never behind, and ahead by a clear margin', () => {
    // From Centurio upwards nobody leaves a piece to be taken, so most games between the upper levels reach the
    // quiet limit level on pieces and are drawn; the stronger side shows by winning the rest and hardly ever
    // losing. A sample big enough to show that on the full board would take minutes, so this match uses the same
    // rules on a 6 x 6 board with twelve men a side, where a game takes a fifth of the time.
    // Measured over 40 games: +13 =27 -0 here; on the full board with 4000 nodes a move: +10 =9 -1 in 20.
    const small = { ...PRESETS.legionary, cols: 6, rows: 6, men: 12 };
    const r = match(small, { level: 5, maxNodes: 2000 }, { level: 3 }, { games: 16, maxPlies: 100, seed: 1 });
    console.log('legionary 6x6 L5 v L3', JSON.stringify(r));
    expect(r.losses).toBeLessThanOrEqual(1);
    expect(r.wins).toBeGreaterThanOrEqual(r.losses + 3);
    expect(r.points).toBeGreaterThanOrEqual(0.58);
  });
});
