import { describe, it, expect } from 'vitest';
import { legalMoves, applyMove, WHITE } from '../src/latrunculi/engine/engine.js';
import { LESSONS, PUZZLES, preMoves, canForce } from '../src/latrunculi/game/lessons.js';

const ready = (item) => { let s = item.make(); const pre = preMoves(s, item.pre); if (pre.length) s = pre[pre.length - 1][1]; return s; };

describe('tutorial lessons', () => {
  for (const lesson of LESSONS) lesson.steps.forEach((step, i) => {
    it(`${lesson.id} step ${i + 1} can be done, and can be got wrong`, () => {
      const s = ready(step);
      expect(s.turn).toBe(WHITE); expect(s.over).toBe(null);
      const results = legalMoves(s).map((m) => !!step.accept(s, m, applyMove(s, m)));
      expect(results.some((r) => r)).toBe(true);
      if (!['move', 'placement'].includes(lesson.id)) expect(results.some((r) => !r)).toBe(true);
    });
  });
});

describe('puzzles', () => {
  for (const p of PUZZLES) {
    it(`${p.id}: solvable in ${p.within}, and not sooner`, () => {
      const s = ready(p);
      expect(s.turn).toBe(WHITE); expect(s.over).toBe(null);
      expect(canForce(s, p.goal, p.within)).toBe(true);
      if (p.within > 1) expect(canForce(s, p.goal, p.within - 1)).toBe(false);
    });
  }
});

import { STORY_PROBLEMS } from '../src/latrunculi/game/problems.js';
import { STORY, PROBLEMS } from '../src/latrunculi/story/script.js';

function force(state, test, n) {
  if (state.over && !test(state)) return false;
  if (state.turn !== WHITE) { const ms = legalMoves(state); return ms.length > 0 && ms.every((m) => force(applyMove(state, m, false), test, n)); }
  for (const m of legalMoves(state)) {
    const after = applyMove(state, m, false);
    if (after.last && test(after)) return true;
    if (n > 1 && !after.over && force(after, test, n - 1)) return true;
  }
  return false;
}

describe('story problems', () => {
  it('every problem named in the story has a position', () => {
    for (const ch of STORY.chapters) if (ch.game && ch.game.type === 'problem') { expect(PROBLEMS[ch.game.problem]).toBeTruthy(); expect(STORY_PROBLEMS[ch.game.problem]).toBeTruthy(); }
  });
  for (const [id, p] of Object.entries(STORY_PROBLEMS)) {
    it(`${id}: solvable in ${p.within}, and not sooner`, () => {
      const s = p.make();
      expect(s.turn).toBe(WHITE);
      expect(force(s, p.test, p.within)).toBe(true);
      if (p.within > 1) expect(force(s, p.test, p.within - 1)).toBe(false);
    });
  }
  it('p1 has exactly one double capture, and it leaves the V', () => {
    const s = STORY_PROBLEMS.p1.make();
    const doubles = legalMoves(s).filter((m) => applyMove(s, m).last.captured.length >= 2);
    expect(doubles.length).toBe(1);
    const after = applyMove(s, doubles[0]);
    const blue = []; after.board.forEach((v, i) => { if (v < 0) blue.push(String.fromCharCode(97 + (i % 8)) + (((i / 8) | 0) + 1)); });
    expect(blue.sort()).toEqual(['b7', 'c6', 'd5', 'e6', 'f7']);
  });
  it('p3: after the capture the guard has only one move', () => {
    let s = STORY_PROBLEMS.p3.make();
    const key = legalMoves(s).find((m) => m.from === 2 + 6 * 12 && m.to === 2 + 4 * 12); // c7 to c5
    expect(key).toBeTruthy();
    s = applyMove(s, key);
    expect(legalMoves(s).length).toBe(1);
  });
});
