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
import { CHARACTERS } from '../shared/characters.js';
import * as banter from './story/banter.js';
import * as storyData from './story/script.js';
import { TUTORIAL } from './story/tutorial-lines.js';

const SAVE_KEY = 'shadows-of-rome-latrunculi-v1';

class App {
  constructor() {
    this.settings = { voice: 1, sfx: 0.7, chat: 1, subtitles: true, reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, lowGraphics: false };
    this.save = { story: { done: [], winners: {} }, lessons: [], lastSetup: null, storyLevel: 2 };
    try { const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (raw) { Object.assign(this.settings, raw.settings || {}); Object.assign(this.save, raw.save || {}); } } catch (e) { /* first visit */ }
    this.banter = banter; this.storyData = storyData; this.tutorialLines = TUTORIAL;
    this.session = null; this.mode = null; this.actors = [null, null]; this.board = null;
  }
  persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ settings: this.settings, save: this.save })); } catch (e) { /* private mode */ } }

  async init() {
    this.stage = new Stage(document.getElementById('stage'));
    this.sfx = new Sfx(); this.voice = new Voice(); this.ai = new AIClient();
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
    if (this.director) this.director.chattiness = s.chat;
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
    this.input.cancel(); this.director.stopSpeaking(); this.director.quiet = false;
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
  async startGame(cfg) {
    this.clearTable();
    this.mode = cfg.mode || null;
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
  restart() { if (this.lastCfg) this.startGame({ ...this.lastCfg, startState: undefined }); }

  freePlayOver({ winnerSeat, over, session }) {
    const name = winnerSeat >= 0 ? CHARACTERS[session.char(winnerSeat)].name : '';
    this.ui.victory({
      title: winnerSeat >= 0 ? 'Imperator' : 'Honours even',
      who: winnerSeat >= 0 ? `${name} wins the day` : 'Neither army could break the other',
      why: GameSession.reasonText(over, session.rules),
      actions: [
        { label: 'Review the game', primary: true, run: () => this.openReview(session) },
        { label: 'Play again', run: () => this.restart() },
        { label: 'Swap seats', run: () => this.startGame({ ...this.lastCfg, seats: [this.lastCfg.seats[1], this.lastCfg.seats[0]], startState: undefined }) },
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
