// Board positions for the three tablet problems of the story (the words are in story/script.js under PROBLEMS).
// The solver always plays White, as the tablets say. tests/lessons.test.js checks that each can be solved as written.
import { fromDiagram, hashOf, sqIndex, WHITE } from '../engine/engine.js';

export const STORY_PROBLEMS = {
  // Two at a stroke: the blue men stand in an X; one white move takes both legs and leaves a V.
  p1: {
    within: 1, goalText: 'White takes two blue men with a single move.',
    make: () => fromDiagram('legionary', [
      '........',
      '.b...b..',
      '..b.b...',
      '...b....',
      '.wb.bw..',
      '.......w',
      'w.......',
      '...w....',
    ]),
    test: (s) => s.last.captured.length >= 2,
  },
  // The bound man: a white soldier lies bound at c4; trap one of his captors and he is free.
  p2: {
    within: 1, goalText: 'White frees the bound man with one move.',
    make: () => {
      const s = fromDiagram('seneca', [
        '........',
        '.w......',
        '.w......',
        '...b.b.b',
        '.bwb.b.b',
        '.w......',
        '........',
        '........',
      ]);
      const c4 = sqIndex(s, 'c4');
      s.capA[c4] = sqIndex(s, 'b4'); s.capB[c4] = sqIndex(s, 'd4');
      s.key = hashOf(s); s.history = [s.key];
      return s;
    },
    test: (s) => s.last.freed.length > 0,
  },
  // The general shut in: take the one free man, and the guard must step away from his general.
  p3: {
    within: 2, goalText: 'White shuts in the blue general in two moves.',
    make: () => fromDiagram('stanway', [
      '....wbBbw...',
      '..w..wbw....',
      '............',
      '......w.....',
      '..b.........',
      '..w.........',
      '............',
      'W...........',
    ]),
    test: (s) => !!s.over && s.over.winner === WHITE && s.over.reason === 'dux',
  },
};
