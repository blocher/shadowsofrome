// Board positions for the Ludus: the tutorial lessons and the practice puzzles. Pure data and engine calls, so the
// tests can check that every lesson can be completed and every puzzle solved. The words are in story/tutorial-lines.js.
import { createGame, fromDiagram, applyMove, legalMoves, threatened, sqIndex, WHITE, BLACK } from '../engine/engine.js';
import { PRESETS } from '../engine/rules.js';

const D = (rules, lines, turn = WHITE) => () => fromDiagram(rules, lines, turn);
const took = (b, m, a) => a.last.captured.length > 0;

/** Lessons in teaching order. Each step: make() builds the position, pre (optional) lists moves played for the
 *  learner to watch first, accept(before, move, after) says whether the learner's move does what was asked,
 *  focus (optional) names squares to point at. The learner always plays White (the left-hand seat). */
export const LESSONS = [
  { id: 'move', rules: 'legionary', steps: [
    { make: D('legionary', ['......', '......', '......', '......', '..w...', '......']), accept: (b, m) => m.t === 'm', focus: ['c2'] },
    { make: D('legionary', ['......', '..b...', '..w...', '......', '......', '......']), accept: (b, m) => m.t === 'm', focus: ['c4'] },
  ] },
  { id: 'capture', rules: 'legionary', steps: [
    { make: D('legionary', ['......', '......', '.wb...', '......', '...w..', '......']), accept: took, focus: ['d2', 'c4'] },
    { make: D('legionary', ['......', '..w...', '..b...', 'w.....', '......', '......']), accept: took, focus: ['a3', 'c4'] },
  ] },
  { id: 'corner', rules: 'legionary', steps: [
    { make: D('legionary', ['....wb', '......', '......', '......', '.....w', '......']), accept: took, focus: ['f2', 'f6'] },
  ] },
  { id: 'safe', rules: 'legionary', steps: [
    { make: D('legionary', ['......', '......', '.b.b..', '......', '..w...', '......']), accept: (b, m) => m.t === 'm' && m.to === sqIndex(b, 'c4'), focus: ['c2', 'c4'] },
    { make: D('legionary', ['......', '......', '.b.b..', '......', 'w.w...', '....w.']), accept: (b, m, a) => threatened(a, BLACK).size >= 2, focus: ['c2', 'c4'] },
  ] },
  { id: 'fork', rules: 'legionary', steps: [
    { make: D('legionary', ['.....w', '..b...', 'w.....', '..b...', '......', '..w...']), accept: (b, m, a) => threatened(a, BLACK).size >= 2 && !a.last.captured.length, focus: ['a4'] },
  ] },
  { id: 'pairs', rules: 'legionary', steps: [
    { make: D('legionary', ['......', '......', '...b..', '...w..', 'b....w', '.....w']), accept: (b, m, a) => threatened(a, WHITE).size === 0, focus: ['d3'] },
    { make: D('legionary', ['......', '.w....', '.w...b', '..w...', '..b...', '......']), accept: (b, m, a) => threatened(a, WHITE).size === 0 && m.from !== sqIndex(b, 'c3'), focus: ['c3'] },
  ] },
  { id: 'placement', rules: 'piso', steps: [
    { make: () => createGame({ ...PRESETS.piso, cols: 6, rows: 6, men: 6 }), accept: (b, m) => m.t === 'p' },
  ] },
  { id: 'bound', rules: 'seneca', steps: [
    { make: D('seneca', ['......', '......', '.wb...', '...w..', '......', '......']), accept: (b, m, a) => a.last.bound.length > 0, focus: ['d3', 'c4'] },
    { make: D('seneca', ['......', '...w..', '.bw...', '...bw.', '......', '......'], BLACK), pre: [['d3', 'd4']], accept: (b, m, a) => a.last.freed.length > 0, focus: ['e3', 'd4'] },
  ] },
  { id: 'dux', rules: 'stanway', steps: [
    { make: D('stanway', ['B....b', 'w.....', '......', '......', '.w....', 'w....W']), accept: (b, m, a) => !!a.over && a.over.winner === WHITE && a.over.reason === 'dux', focus: ['b2', 'a6'] },
  ] },
  { id: 'endings', rules: 'legionary', steps: [
    { make: D('legionary', ['......', '......', '.wb...', '......', '...w.b', '......']), accept: (b, m, a) => !!a.over && a.over.winner === WHITE, focus: ['d2'] },
  ] },
];

/** Play the scripted "watch this first" moves of a lesson step. Returns the list of [before, after] pairs. */
export function preMoves(state, pre = []) {
  const out = [];
  for (const [from, to] of pre) {
    const mv = legalMoves(state).find((m) => m.t === 'm' && m.from === sqIndex(state, from) && m.to === sqIndex(state, to));
    if (!mv) throw new Error(`lesson pre-move ${from}-${to} is illegal`);
    const next = applyMove(state, mv);
    out.push([state, next]); state = next;
  }
  return out;
}

/** Practice puzzles. goal: capture (take or bind a piece) or win, within so many of your own moves. You play White. */
export const PUZZLES = [
  { id: 'twin', title: 'The twin foe', rules: 'legionary', goal: 'capture', within: 1, text: 'Take a piece in one move.',
    make: D('legionary', ['......', '...b..', '..wb..', '......', '......', '.w..w.']) },
  { id: 'cornered', title: 'Cornered', rules: 'legionary', goal: 'capture', within: 1, text: 'One black soldier has backed into a corner. Take him.',
    make: D('legionary', ['b.....', 'w.....', '......', '......', '......', '.w...b']) },
  { id: 'steps', title: 'One step at a time', rules: 'piso', goal: 'capture', within: 1, text: 'Piso’s rules: one square a move. Take a piece.',
    make: D('piso', ['......', '..b...', '.wb.w.', '...w..', '......', '.....b']) },
  { id: 'between', title: 'Between two', rules: 'legionary', goal: 'capture', within: 2, text: 'Take a piece within two moves. Black will defend.',
    make: D('legionary', ['.....w', '..b...', 'w.....', '..b...', '......', '..w...']) },
  { id: 'longroad', title: 'The long road', rules: 'legionary', goal: 'capture', within: 2, text: 'Threaten two at once, then take the one he cannot save.',
    make: D('legionary', ['.......', '.......', '..b.b..', '.......', '.......', '...w...', '.w...w.']) },
  { id: 'rescue', title: 'A friend in need', rules: 'seneca', goal: 'free', within: 1, text: 'Seneca’s rules: your soldier is bound. Free him by trapping one of his captors.',
    make: D('seneca', ['......', '...w..', '.bw...', '...bw.', '......', '......'], BLACK), pre: [['d3', 'd4']] },
  { id: 'general', title: 'Hem him in', rules: 'stanway', goal: 'win', within: 1, text: 'The general cannot be taken. Shut him in.',
    make: D('stanway', ['.wBw.b', '......', '......', '......', '.....W', '..w...']) },
];

/** Has the puzzle's goal been met by the position `after` (reached by White's move)? */
export function goalMet(goal, after) {
  if (goal === 'capture') return after.last.captured.length + after.last.bound.length > 0;
  if (goal === 'free') return after.last.freed.length > 0;
  if (goal === 'win') return !!after.over && after.over.winner === WHITE;
  return false;
}

/** Can White force the goal within n of his own moves? Used by the tests, and to confirm a puzzle is fair. */
export function canForce(state, goal, n) {
  if (state.over) return false;
  if (state.turn !== WHITE) return legalMoves(state).every((m) => canForce(applyMove(state, m, false), goal, n));
  for (const m of legalMoves(state)) {
    const after = applyMove(state, m, false);
    if (goalMet(goal, after)) return true;
    if (n > 1 && !after.over && canForce(after, goal, n - 1)) return true;
  }
  return false;
}
