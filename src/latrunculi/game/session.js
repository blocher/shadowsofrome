// One game from first move to last: seats (human or AI), turns, animation, table talk, hints, coach and undo.
import { createGame, legalMoves, applyMove, threatened, countPieces, notate, sq, capturingMoves, WHITE } from '../engine/engine.js';
import { normalizeRules } from '../engine/rules.js';
import { CHARACTERS } from '../../shared/characters.js';
import { LEVELS } from '../ai/levels.js';
import { explainMove } from '../ai/review.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class GameSession {
  /**
   * cfg: { rules, seats: [{ char, kind: 'human'|'ai', level }, {...}], setting, coach, startState?, goal?, quietTalk?, onEnd? }
   * Seat 0 sits on the left and plays White; seat 1 sits on the right and plays Black.
   * goal (for set problems): { side: 0|1, type: 'capture', within: n }  — the solver must make a capture within n of his moves.
   */
  constructor(app, cfg) {
    this.app = app; this.cfg = cfg;
    this.rules = normalizeRules(cfg.rules);
    this.seats = cfg.seats;
    this.state = cfg.startState || createGame(this.rules);
    this.start = this.state;
    this.log = [];            // [{ state (before), move, text, by }]
    this.ended = false; this.paused = false; this.hintLevel = 0; this.hintKey = null;
    this.coach = !!cfg.coach; this.showThreats = !!cfg.showThreats;
    this.speed = cfg.speed || 1;
    this.lost = [[], []];     // plies at which each seat lost pieces (for Titus' nerves)
    this.flags = {};
    this.solverMoves = 0;
  }

  seatOf(player) { return player === WHITE ? 0 : 1; }
  char(seat) { return this.seats[seat].char; }
  /** Which glass a seat plays with: the table's set if one was given (the story's blue and white), else the boy's own colour. */
  glassOf(seat) { return this.cfg.glass ? this.cfg.glass[seat] : CHARACTERS[this.seats[seat].char].glass; }
  isHuman(seat) { return this.seats[seat].kind === 'human'; }
  get dir() { return this.app.director; }

  async run() {
    const { app } = this;
    app.ui.hud.update(this);
    await this.opening();
    while (!this.ended && !this.state.over) {
      const seat = this.seatOf(this.state.turn);
      this.dir.setTurn(seat);
      app.ui.hud.update(this);
      this.refreshOverlays();
      let move;
      if (this.isHuman(seat)) move = await this.humanMove(seat); else move = await this.aiMove(seat);
      if (this.ended) break;
      if (!move) continue; // undone, or interrupted
      await this.play(move, seat);
      if (this.cfg.goal && this.checkGoal(seat)) break;
    }
    if (!this.ended) await this.finish();
  }

  stop() {
    this.ended = true;
    this.app.input.cancel();
    this.app.ai.cancel();
    this.dir.stopSpeaking();
    this.app.board && this.app.board.clearMarks();
  }

  // ---- talk ----------------------------------------------------------------------------------------------------
  async opening() {
    const [a, b] = [this.char(0), this.char(1)];
    if (this.cfg.quietTalk) return;
    const first = this.seatOf(this.state.turn);
    await this.dir.banter('gameStart', this.char(first), { vs: this.char(1 - first), force: true });
    if (this.ended) return;
    await this.dir.banter('gameStart', this.char(1 - first), { vs: this.char(first), force: true });
    if (this.state.phase === 'place' && !this.ended) this.dir.banter('placement', Math.random() < 0.5 ? a : b, { chance: 0.9, gap: 0 });
  }

  /** React to a move that has just been played. Never blocks the game for long. */
  async react(before, after, seat) {
    const info = after.last, me = this.char(seat), opp = this.char(1 - seat), d = this.dir;
    const taken = info.captured.length + info.removed.length;
    const victimSeat = info.removed.length ? this.seatOf(after.turn) === seat ? 1 - seat : seat : 1 - seat;
    if (info.captured.length) { d.mood(seat, 'pleased', 3); d.mood(1 - seat, 'rattled', 3); this.lost[1 - seat].push(after.ply); }
    if (info.removed.length) { const captor = this.seatOf(after.turn); d.mood(captor, 'pleased', 3); d.mood(1 - captor, 'rattled', 3); this.lost[1 - captor].push(after.ply); }
    if (info.bound.length) d.mood(1 - seat, 'rattled', 2.5);
    if (after.over || this.cfg.quietTalk) return;
    const hung = this.hangs(before, after, seat);
    const forks = after.phase === 'move' ? threatened(after, after.turn === before.turn ? -before.turn : after.turn).size : 0;
    const [w, b] = countPieces(after), total = w + b, lead = (seat === 0 ? w - b : b - w);
    let said = false;
    if (info.captured.length >= 2) said = await d.banter('captureMulti', me, { chance: 1, gap: 1 });
    else if (info.extra) said = await d.banter('extraMove', me, { chance: 0.7, gap: 3 });
    else if (info.captured.length === 1) said = Math.random() < 0.6 ? await d.banter('capture', me, { vs: opp, chance: 0.8, gap: 3 }) : await d.banter('captured', opp, { chance: 0.8, gap: 3 });
    else if (info.bound.length) said = await d.banter('bind', me, { chance: 0.9, gap: 2 });
    else if (info.freed.length) said = await d.banter('freed', me, { chance: 0.9, gap: 2 });
    else if (info.removed.length) said = await d.banter('captured', this.char(victimSeat), { chance: 0.6, gap: 3 });
    else if (hung && Math.random() < 0.5) said = await d.banter('oppBlunder', opp, { chance: 0.75, gap: 6 });
    else if (hung && !this.isHuman(seat)) said = await d.banter('myBlunder', me, { chance: 0.35, gap: 8 });
    else if (forks >= 2 && !taken) said = await d.banter('fork', me, { chance: 0.7, gap: 6 });
    if (said) return;
    if (this.rules.dux === 'immobilise' && this.duxInDanger(after)) { if (await d.banter('duxPieceThreat', Math.random() < 0.5 ? me : opp, { chance: 0.5, gap: 10 })) return; }
    if (total <= 8 && !this.flags.endgame && after.phase === 'move') { this.flags.endgame = true; if (await d.banter('endgame', lead >= 0 ? me : opp, { gap: 2 })) return; }
    if (after.phase === 'move' && after.ply % 9 === 0 && Math.abs(lead) >= 3) {
      const leader = lead > 0 ? me : opp, trailer = lead > 0 ? opp : me;
      if (await d.banter(Math.random() < 0.5 ? 'ahead' : 'behind', Math.random() < 0.5 ? leader : trailer, { chance: 0.5, gap: 12 })) return;
    }
    if (taken && Math.random() < 0.16 && d.dux && d.dux.ready) { this.duxSteals(seat); return; }
    if (performance.now() - d.lastBanter > 42000) d.banter('idle', Math.random() < 0.5 ? me : opp, { chance: 0.6, gap: 30 });
  }

  async duxSteals(seat) {
    const d = this.dir, captor = seat;
    await d.duxGo('tray' + captor, 'steal');
    this.app.sfx.click(0.5);
    const who = ['titus', this.char(0), this.char(1)].filter((c, i) => i > 0 || d.seatOf('titus') >= 0);
    await d.banter('duxSteals', who[Math.floor(Math.random() * who.length)], { force: true });
    await sleep(500);
    await d.duxGo('home', 'eat');
    d.duxPose('eat', 4);
  }

  duxInDanger(s) {
    for (let i = 0; i < s.board.length; i++) {
      const v = s.board[i];
      if (v !== 2 && v !== -2) continue;
      let free = 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = (i % s.cols) + dc, r = ((i / s.cols) | 0) + dr;
        if (c >= 0 && c < s.cols && r >= 0 && r < s.rows && s.board[r * s.cols + c] === 0) free++;
      }
      if (free <= 1) return true;
    }
    return false;
  }

  /** Did the mover leave one of his own pieces where it can be taken, without gaining anything himself? */
  hangs(before, after, seat) {
    if (after.phase !== 'move' || after.last.captured.length || after.last.bound.length || after.over) return false;
    const me = seat === 0 ? 1 : -1;
    const pre = threatened(before, me), post = threatened(after, me);
    const mv = after.last.move;
    for (const i of post) if (!pre.has(i) && !(mv.t === 'm' && pre.has(mv.from) && i === mv.to)) return true;
    return false;
  }

  // ---- moves ---------------------------------------------------------------------------------------------------
  async play(move, seat) {
    const before = this.state, after = applyMove(before, move);
    this.log.push({ state: before, move, by: seat, text: notate(before, move, after.last) });
    this.state = after;
    this.hintLevel = 0; this.app.board.setHint(null); this.app.board.setThreats([]);
    await this.app.board.animate(before, after, this.app.sfx);
    this.app.ui.hud.update(this);
    const talk = this.react(before, after, seat);
    // table talk overlaps the next player's thinking, but an AI waits for the line to finish before moving
    if (!this.isHuman(this.seatOf(after.turn))) await Promise.race([talk, sleep(6500)]);
  }

  async humanMove(seat) {
    const state = this.state, app = this.app;
    const started = performance.now();
    const nag = setInterval(() => {
      if (performance.now() - started > 28000 && !this.isHuman(1 - seat) && !this.flags['nag' + state.ply]) { this.flags['nag' + state.ply] = true; this.dir.banter('longThink', this.char(1 - seat), { chance: 0.8, gap: 10 }); }
    }, 4000);
    app.ui.hud.setPrompt(this.promptFor(state, seat));
    let move = null;
    for (;;) {
      move = await app.input.request(state, { onIllegal: () => app.sfx.error() });
      if (!move || this.ended || this.state !== state) { move = null; break; }
      if (this.coach && move.t === 'm') {
        const after = applyMove(state, move, false);
        if (this.hangs(state, after, seat)) {
          const lost = [...threatened(after, state.turn)].filter((i) => !threatened(state, state.turn).has(i) || i === move.to);
          app.board.setThreats(lost);
          const keep = await app.ui.confirm({
            title: 'A word from your coach',
            text: `That would leave your piece on ${lost.map((i) => sq(after, i)).join(' and ')} where it can be taken, and you gain nothing for it.`,
            yes: 'Play it anyway', no: 'Choose again',
          });
          app.board.setThreats([]);
          if (!keep) { this.refreshOverlays(); continue; }
        }
      }
      break;
    }
    clearInterval(nag);
    app.ui.hud.setPrompt('');
    return move;
  }

  promptFor(state, seat) {
    const name = CHARACTERS[this.char(seat)].name;
    if (state.phase === 'place') {
      const k = seat, dux = state.toPlace[k] === 0;
      return `${name}: place ${dux ? 'your general' : 'a soldier'} on any empty square (${state.toPlace[k] + state.duxToPlace[k]} left)`;
    }
    if (state.chain >= 0) return `${name}: your capture earns another move with the same piece, or end your turn`;
    return `${name} to move`;
  }

  rattled(seat) {
    if (this.char(seat) !== 'titus') return 0;
    const recent = this.lost[seat].filter((p) => this.state.ply - p <= 6).length;
    return Math.min(1, recent * 0.5);
  }

  async aiMove(seat) {
    const state = this.state, s = this.seats[seat], level = LEVELS.find((l) => l.id === s.level) || LEVELS[2];
    this.app.ui.hud.setThinking(seat, true);
    this.dir.mood(seat, 'thinking', 0);
    const minDelay = (state.phase === 'place' ? 450 : 650 + Math.random() * 700) / this.speed;
    const t0 = performance.now();
    let res = null;
    try {
      res = await this.app.ai.choose(state, { level: level.id, personality: s.char, seed: (state.ply * 7919 + (this.cfg.seed || 1)) | 0, rattled: this.rattled(seat), history: state.history });
    } catch (e) { console.error(e); }
    const wait = minDelay - (performance.now() - t0);
    if (wait > 0) await sleep(wait);
    while (this.paused && !this.ended) await sleep(120);
    this.app.ui.hud.setThinking(seat, false);
    this.dir.mood(seat, 'neutral', 0);
    if (this.ended || this.state !== state) return null;
    if (!res || !res.move) { const ms = legalMoves(state); return ms[Math.floor(Math.random() * ms.length)]; }
    return res.move;
  }

  // ---- help ----------------------------------------------------------------------------------------------------
  refreshOverlays() {
    const b = this.app.board; if (!b) return;
    if (!this.showThreats || this.state.phase !== 'move') { b.setThreats([]); return; }
    const seat = this.seatOf(this.state.turn);
    if (this.isHuman(seat)) b.setThreats([...threatened(this.state, this.state.turn)]);
  }
  toggleThreats() { this.showThreats = !this.showThreats; this.refreshOverlays(); return this.showThreats; }
  toggleCoach() { this.coach = !this.coach; return this.coach; }

  /** Three steps of help: a spoken nudge, then the piece, then the move with reasons. */
  async hint() {
    const state = this.state, seat = this.seatOf(state.turn);
    if (!this.isHuman(seat) || state.over) return;
    if (this.hintKey !== state.key) { this.hintKey = state.key; this.hintLevel = 0; this.hintMove = null; }
    this.hintLevel = Math.min(3, this.hintLevel + 1);
    const ui = this.app.ui, d = this.dir;
    if (!this.hintMove) {
      ui.hud.setPrompt('Thinking it over…');
      let res = null;
      try { res = await this.app.ai.analyse(state, { timeMs: 700, multi: 1, history: state.history }); } catch (e) { res = null; }
      if (this.state !== state || this.ended) return;
      this.hintMove = res && res.lines && res.lines[0] ? res.lines[0].move : null;
      ui.hud.setPrompt(this.promptFor(state, seat));
    }
    const mv = this.hintMove;
    if (!mv) return;
    const from = mv.t === 'm' ? mv.from : -1, to = mv.t === 'x' ? -1 : mv.to;
    this.stats = this.stats || { hints: 0 }; this.stats.hints++;
    if (this.hintLevel === 1) {
      const coach = d.bystander() || this.char(1 - seat);
      d.duxGo('square', 'point', from >= 0 ? from : to).then(() => setTimeout(() => d.duxGo('home', 'sit'), 4200));
      const can = capturingMoves(state).length > 0;
      ui.toast(can ? 'Hint: one of your soldiers can take a piece this turn.' : 'Hint: look for a piece that is in danger, or one you could trap next turn.');
      d.banter(Math.random() < 0.35 ? 'duxHelps' : 'hint1', coach, { force: true });
    } else if (this.hintLevel === 2) {
      this.app.board.setHint({ from: from >= 0 ? from : to, to, showTo: false });
      ui.toast(mv.t === 'x' ? 'Hint: end your turn here.' : from >= 0 ? `Hint: the piece on ${sq(state, from)} has the best move.` : `Hint: ${sq(state, to)} is a good square.`);
    } else {
      this.app.board.setHint({ from, to, showTo: true });
      let why = '';
      try { why = explainMove(state, mv); } catch (e) { why = ''; }
      ui.toast(`Best move: ${notate(state, mv)}. ${Array.isArray(why) ? why.join(' ') : why || ''}`, 9000);
    }
  }

  /** Take back to the human player's previous turn. */
  undo() {
    if (!this.log.length || this.state.over && false) return false;
    let i = this.log.length - 1;
    // step back over the opponent's replies until a position where a human was to move
    while (i > 0 && !this.isHuman(this.log[i].by)) i--;
    const entry = this.log[i];
    if (!this.isHuman(entry.by)) return false;
    this.log.length = i;
    this.state = entry.state;
    this.state.over = null;
    this.app.ai.cancel();
    this.app.input.cancel();
    this.app.board.sync(this.state);
    this.app.board.clearMarks(); this.app.board.setLast([]);
    this.app.ui.hud.update(this);
    const other = 1 - entry.by;
    if (!this.isHuman(other)) this.dir.banter('undo', this.char(other), { chance: 0.6, gap: 4 });
    return true;
  }

  // ---- endings -------------------------------------------------------------------------------------------------
  /** Set problems: has the solver done what was asked, or run out of moves? goal: { side, within, test(state) }. */
  checkGoal(seat) {
    const g = this.cfg.goal;
    if (seat !== g.side) { if (this.state.over) { this.goalResult = false; return true; } return false; }
    if (this.state.chain >= 0) return false;
    this.solverMoves++;
    if (g.test(this.state)) { this.goalResult = true; return true; }
    if (this.solverMoves >= g.within || this.state.over) { this.goalResult = false; return true; }
    return false;
  }

  async finish() {
    const app = this.app, d = this.dir, over = this.state.over;
    this.ended = true;
    app.board.clearMarks();
    if (this.cfg.goal) { this.cfg.onEnd && this.cfg.onEnd({ solved: !!this.goalResult, session: this }); return; }
    const winnerSeat = over.winner === 0 ? -1 : this.seatOf(over.winner);
    app.ui.hud.update(this);
    if (winnerSeat >= 0) {
      app.sfx.fanfare();
      d.mood(winnerSeat, 'triumphant', 0); d.mood(1 - winnerSeat, 'sulking', 0);
      d.duxGo('head' + winnerSeat, 'cheer');
      if (!this.cfg.quietTalk) {
        await d.banter('win', this.char(winnerSeat), { vs: this.char(1 - winnerSeat), force: true });
        await d.banter('imperator', this.char(winnerSeat), { force: true });
        await d.banter('lose', this.char(1 - winnerSeat), { vs: this.char(winnerSeat), force: true });
      }
    } else {
      app.sfx.low();
      if (!this.cfg.quietTalk) { await d.banter('draw', this.char(0), { force: true }); await d.banter('draw', this.char(1), { force: true }); }
    }
    this.cfg.onEnd && this.cfg.onEnd({ winnerSeat, over, session: this });
  }

  /** Words for how the game ended. */
  static reasonText(over, rules) {
    return {
      pieces: rules.dux === 'immobilise' ? 'The losing general stands alone.' : 'The losing side is down to its last soldier.',
      dux: 'The general is hemmed in on every side.',
      blocked: 'No legal move was left.',
      limit: `${rules.quietLimit / 2} moves each passed without a capture, so the armies were counted.`,
      repetition: 'The same position came up three times, so the armies were counted.',
    }[over.reason] || '';
  }
}
