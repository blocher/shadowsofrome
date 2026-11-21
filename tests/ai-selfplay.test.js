import { describe, it, expect } from 'vitest';
import { playMatch as match } from '../src/latrunculi/ai/selfplay.js';
import { PRESETS } from '../src/latrunculi/engine/rules.js';

// Strength must rise with the level. All searches are bounded by depth or nodes with fixed seeds (see ai/selfplay.js),
// so these results are identical on every machine: the margins below are there for future tuning, not for luck.
describe('self-play: legionary (fixed rows, rook moves)', () => {
  it('Centurio (3) beats Tiro (1) in every game', () => {
    const r = match('legionary', { level: 3 }, { level: 1 }, { games: 6, maxPlies: 120, seed: 1 });
    console.log('legionary L3 v L1', JSON.stringify(r));
    expect(r.wins).toBeGreaterThanOrEqual(5);
    expect(r.losses).toBe(0);
    expect(r.pieces).toBeGreaterThan(3);
  });
  it('Imperator (5, on a small node budget) beats Centurio (3) by a clear margin', () => {
    // Top against middle is draw-heavy on the full board (most games reach the quiet limit level on pieces), and a
    // sample big enough to show the margin there would take minutes. The same rules on a 6 x 6 board with twelve
    // men a side play five times faster, so twelve games fit.
    const small = { ...PRESETS.legionary, cols: 6, rows: 6, men: 12 };
    const r = match(small, { level: 5, maxNodes: 2000 }, { level: 3 }, { games: 12, maxPlies: 100, seed: 1 });
    console.log('legionary 6x6 L5 v L3', JSON.stringify(r));
    expect(r.wins).toBeGreaterThanOrEqual(r.losses + 3);
    expect(r.losses).toBeLessThanOrEqual(1);
    expect(r.points).toBeGreaterThanOrEqual(0.6);
  });
});
