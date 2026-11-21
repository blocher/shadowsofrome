// Latrunculi: the app shell. Builds the stage once, then moves between the title, free play, the Ludus and the story.
import { Stage, ART } from './scene/stage.js';
import { BoardView, loadMarble } from './scene/boardview.js';
import { Actor, Dux } from './scene/actors.js';
import { BoardInput } from './game/input.js';
import { Director } from './game/director.js';
import { GameSession } from './game/session.js';
import { AIClient } from './ai/client.js';
import { UI } from './ui/ui.js';
import { ReviewPanel } from './ui/review.js';
import { Ludus } from './game/tutorial.js';
import { StoryMode } from './game/story.js';
import { Voice } from '../shared/voice.js';
import { Sfx } from '../shared/sfx.js';
import { Music } from '../shared/music.js';
import { Store } from '../shared/profiles.js';
import { serialize, deserialize } from './engine/engine.js';
import { normalizeRules } from './engine/rules.js';
import { CHARACTERS } from '../shared/characters.js';
import * as banter from './story/banter.js';
import * as storyData from './story/script.js';
import { TUTORIAL } from './story/tutorial-lines.js';


class App {
  constructor() {
    // device settings, the list of players, and each player's progress and saved games
    this.store = new Store('latrunculi', { voice: 1, sfx: 0.7, music: 0.5, talk: true, subtitles: true, reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, lowGraphics: false });
    this.banter = banter; this.storyData = storyData; this.tutorialLines = TUTORIAL;
    this.session = null; this.mode = null; this.actors = [null, null]; this.board = null;
  }
  get settings() { return this.store.settings; }
  /** The current player's progress (story chapters, lessons, last table, record). */
  get save() { return this.store.progress(); }
  persist() { this.store.persist(); }

  async init() {
    this.stage = new Stage(document.getElementById('stage'));
    this.sfx = new Sfx(); this.voice = new Voice(); this.ai = new AIClient(); this.music = new Music();
    // sound may only begin after a tap or a click
    const wake = () => { if (this.settings.music > 0) this.music.start(); };
    window.addEventListener('pointerdown', wake, { passive: true }); window.addEventListener('keydown', wake);
    this.input = new BoardInput(this.stage);
    this.ui = new UI(this);
    this.director = new Director(this);
    this.dux = new Dux(this.stage);
    this.ludus = new Ludus(this); this.story = new StoryMode(this);
    this.stage.onLayout = () => { for (const a of this.actors) if (a) a.layout(); };
    this.stage.onSlow = () => { // a struggling phone or laptop: drop to the lighter look once, and say so
      if (this.settings.lowGraphics || this.ui.hudLayer.classList.contains('hidden')) return;
      this.settings.lowGraphics = true; this.applySettings();
      this.ui.toast('Switched to lighter graphics to keep things smooth. You can change this in Settings.', 6000);
    };
    this.input.onHover = (x, y) => this.hoverCast(x, y);
    this.input.onActorClick = (x, y) => this.clickCast(x, y);
    this.applySettings();
    this.ui.title();
    await Promise.all([this.stage.loadMaterials(), this.voice.init(), loadMarble().then((im) => { this.marble = im; }), this.dux.load()]);
    await this.stage.setSetting('cubiculum');
    const q = new URLSearchParams(location.search);
    if (q.has('demo')) this.startGame({ rules: q.get('rules') || 'legionary', seats: [{ char: q.get('a') || 'maximus', kind: q.get('human') ? 'human' : 'ai', level: +(q.get('la') || 3) }, { char: q.get('b') || 'aghiles', kind: 'ai', level: +(q.get('lb') || 3) }], setting: q.get('setting') || 'cubiculum' });
  }

  applySettings() {
    const s = this.settings;
    this.voice.volume = s.voice; this.sfx.volume = s.sfx;
    this.music.setVolume(s.music); if (s.music > 0 && this.music.ctx) this.music.start();
    if (this.director) this.director.quiet = s.talk === false;
    if (this.stage) {
      this.stage.reduceMotion = s.reduceMotion;
      this.stage.renderer.setPixelRatio(s.lowGraphics ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      this.stage.bloom.enabled = !s.lowGraphics;
      this.stage.renderer.shadowMap.enabled = !s.lowGraphics;
      this.stage.dust.visible = !s.lowGraphics;
      if (this.board) this.board.setLight(!!s.lowGraphics);
      this.stage.resize();
    }
    this.persist();
  }

  // ---- the table ---------------------------------------------------------------------------------------------------
  /** Lay the table for a game: backdrop, board of the right size, glass colours, and who sits where. */
  async setTable({ rules, seats, setting, glass: set }) {
    const st = this.stage;
    const glass = set || [CHARACTERS[seats[0].char].glass, CHARACTERS[seats[1].char].glass];
    const key = `${rules.cols}x${rules.rows}:${glass.join()}`;
    if (this.boardKey !== key) {
      if (this.board) this.board.dispose();
      st.setBoardSize(rules.cols, rules.rows);
      this.board = new BoardView(st, rules.cols, rules.rows, glass, this.marble);
      this.board.setLight(!!this.settings.lowGraphics);
      this.boardKey = key;
      this.input.setBoard(this.board);
    }
    const jobs = [st.setSetting(setting || 'cubiculum')];
    this.music.setScene(setting || 'cubiculum');
    seats.forEach((seat, i) => {
      const cur = this.actors[i];
      if (cur && cur.id === seat.char) return;
      if (cur) cur.dispose();
      const a = this.actors[i] = new Actor(st, seat.char, i === 0 ? -1 : 1);
      jobs.push(a.load());
    });
    await Promise.all(jobs);
    this.director.setCast(this.actors[0], this.actors[1], this.dux);
    this.director.anchors(this.board);
    for (const a of this.actors) if (a) { a.layout(); a.setMood('neutral'); }
    this.dux.setPose('sit');
  }

  clearTable() {
    if (this.session) { this.session.stop(); this.session = null; }
    this.epoch = (this.epoch || 0) + 1; // running lessons and story scenes notice this and stop
    this.input.cancel(); this.director.stopSpeaking(); this.director.quiet = this.settings.talk === false;
    if (this.cutLayer) { this.cutLayer.remove(); this.cutLayer = null; }
    this.ui.clearTalk(); this.ui.clearVictory(); this.ui.hud.setPrompt('');
    if (this.review) { this.review.close(true); this.review = null; }
    this.stage.timeScale = 1; this.stage.setView('table');
  }

  hoverCast(x, y) {
    let over = false;
    for (const a of this.actors) {
      if (!a || !a.ready) continue;
      const hit = a.contains(x, y) && !this.ui.hudLayer.classList.contains('hidden');
      if (hit && !a.hover) { a.hover = true; if (a.mood === 'neutral') a.setMood('look', 1.6); }
      if (!hit) a.hover = false;
      over = over || hit;
    }
    if (this.dux.contains(x, y)) over = true;
    if (over) this.stage.canvas.style.cursor = 'pointer';
  }
  clickCast(x, y) {
    if (this.ui.hudLayer.classList.contains('hidden') || !this.session) return false;
    if (this.dux.contains(x, y)) { this.dux.setPose(['chatter', 'cheer', 'scared', 'eat'][Math.floor(Math.random() * 4)], 2.2); this.sfx.tick(); return true; }
    for (const a of this.actors) {
      if (a && a.contains(x, y)) { if (!this.session.cfg.quietTalk) this.director.banter('idle', a.id, { gap: 1.5 }); return true; }
    }
    return false;
  }

  // ---- free play -------------------------------------------------------------------------------------------------
  /** Name the people at the table: each human seat keeps the id and the name of the player sitting there. */
  seat(seats) {
    return seats.map((x) => {
      const out = { ...x };
      if (out.kind !== 'human') { delete out.player; delete out.playerName; return out; }
      if (out.player === undefined) out.player = this.store.current ? this.store.current.id : null;
      out.playerName = this.store.name(out.player) || out.playerName || null;
      return out;
    });
  }

  async startGame(cfg) {
    this.clearTable();
    this.mode = cfg.mode || null;
    cfg = { ...cfg, rules: normalizeRules(cfg.rules), seats: this.seat(cfg.seats) };
    // free games with a person at the table are saved as they go, so they can be picked up later
    if (!cfg.mode && !cfg.goal && !cfg.saveId && cfg.seats.some((x) => x.kind === 'human')) cfg.saveId = this.store.newId();
    this.lastCfg = cfg;
    this.ui.setScreen(null);
    const session = this.session = new GameSession(this, { ...cfg, onEnd: cfg.onEnd || ((r) => this.freePlayOver(r)) });
    await this.setTable({ rules: session.rules, seats: cfg.seats, setting: cfg.setting, glass: cfg.glass });
    if (this.session !== session) return;
    this.board.sync(session.state); this.board.clearMarks(); this.board.setLast([]);
    this.ui.showHud(true);
    session.run();
    return session;
  }
  restart() { if (this.lastCfg) this.startGame({ ...this.lastCfg, startState: undefined, resume: undefined, saveId: undefined }); }

  /** What is kept of a game so it can be resumed or reviewed: the table, the starting position and the moves. */
  snapshot(session) {
    const c = session.cfg;
    return {
      id: c.saveId, rules: session.rules, seats: session.seats, setting: c.setting, glass: c.glass || null, coach: session.coach, showThreats: session.showThreats,
      start: serialize(session.start), moves: session.log.map((e) => e.move), ply: session.state.ply, over: session.state.over || null,
    };
  }
  /** Called by the session after every move and take-back. */
  autosave(session) { if (session.cfg.saveId && !session.state.over) this.store.saveGame(this.snapshot(session)); }
  /** Called by the session when a game (not a set problem) ends: records and the finished-games shelf. */
  gameFinished(session, winnerSeat) {
    session.seats.forEach((x, i) => { if (x.kind === 'human' && x.player) this.store.tally(x.player, winnerSeat < 0 ? 'drawn' : winnerSeat === i ? 'won' : 'lost'); });
    if (session.cfg.saveId) this.store.finishGame(this.snapshot(session));
  }
  tableOf(save) { return { rules: save.rules, seats: save.seats, setting: save.setting, glass: save.glass || undefined, coach: save.coach, showThreats: save.showThreats }; }
  /** Sit back down at a saved game. */
  resumeGame(save) { return this.startGame({ ...this.tableOf(save), startState: deserialize(save.start), resume: save.moves, saveId: save.id }); }
  /** Open a finished game in the review. */
  async reviewSaved(save, onClose) {
    this.clearTable();
    this.ui.setScreen(null);
    const cfg = { ...this.tableOf(save), seats: this.seat(save.seats), startState: deserialize(save.start), resume: save.moves };
    const session = new GameSession(this, cfg);
    await this.setTable({ rules: session.rules, seats: cfg.seats, setting: cfg.setting, glass: cfg.glass });
    this.board.sync(session.state);
    this.mode = 'review';
    this.openReview(session, onClose);
  }

  freePlayOver({ winnerSeat, over, session }) {
    const boy = winnerSeat >= 0 ? CHARACTERS[session.char(winnerSeat)].name : '', person = winnerSeat >= 0 ? session.playerName(winnerSeat) : null;
    this.ui.victory({
      title: winnerSeat >= 0 ? 'Imperator' : 'Honours even',
      who: winnerSeat >= 0 ? (person ? `${person} wins the day, as ${boy}` : `${boy} wins the day`) : 'Neither army could break the other',
      why: GameSession.reasonText(over, session.rules),
      actions: [
        { label: 'Review the game', primary: true, run: () => this.openReview(session) },
        { label: 'Play again', run: () => this.restart() },
        { label: 'Swap seats', run: () => this.startGame({ ...this.lastCfg, seats: [this.lastCfg.seats[1], this.lastCfg.seats[0]], startState: undefined, resume: undefined, saveId: undefined }) },
        { label: 'Leave the table', run: () => this.toTitle() },
      ],
    });
  }

  openReview(session, onClose) {
    this.ui.clearVictory(); this.ui.clearTalk();
    this.session = null;
    this.review = new ReviewPanel(this, session, onClose || (() => { this.review = null; this.toTitle(); }));
    this.review.open();
  }

  toTitle() {
    this.clearTable();
    this.mode = null;
    this.ui.showHud(false);
    this.ui.title();
  }

  openLudus() { this.clearTable(); this.ui.showHud(false); this.ludus.menu(); }
  openStory() { this.clearTable(); this.ui.showHud(false); this.story.menu(); }
}

const app = new App();
window.app = app;
app.init();
