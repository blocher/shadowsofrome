// Story mode: chapters made of spoken scenes around one game each (a match between two of the boys, or a set problem).
import { CHARACTERS, CHARACTER_ORDER } from '../../shared/characters.js';
import { PRESETS } from '../engine/rules.js';
import { LEVELS } from '../ai/levels.js';
import { GameSession } from './session.js';
import { STORY_PROBLEMS } from './problems.js';
import { el, esc } from '../ui/ui.js';

const NUM = ['Prologue', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export class StoryMode {
  constructor(app) { this.app = app; this.story = app.storyData.STORY; }

  progress() { const s = this.app.save.story = this.app.save.story || { done: [], winners: {} }; s.done = s.done || []; s.winners = s.winners || {}; return s; }

  label(i) { const n = this.story.chapters.length; return i === 0 ? 'Prologue' : i === n - 1 ? 'Epilogue' : `Chapter ${NUM[i]}`; }

  menu() {
    this.token = null; // any chapter still running stops here
    const app = this.app, prog = this.progress(), done = new Set(prog.done);
    const firstOpen = this.story.chapters.findIndex((c) => !done.has(c.id));
    const items = this.story.chapters.map((c, i) => {
      const locked = !(done.has(c.id) || i === firstOpen || firstOpen < 0), g = c.game || {};
      const what = g.type === 'match' ? `${CHARACTERS[g.players[0]].name} against ${CHARACTERS[g.players[1]].name}, ${PRESETS[g.preset].name} rules` : g.type === 'problem' ? 'A problem from the tablets' : '';
      return `<button class="item ${locked ? 'locked' : ''}" data-ch="${i}"><span class="n">${i === 0 ? '·' : i === this.story.chapters.length - 1 ? '∞' : NUM[i]}</span><span><b>${esc(c.title)}</b><small>${esc(what)}</small></span><span class="tick">${done.has(c.id) ? '✓' : ''}</span></button>`;
    }).join('');
    const node = el(`<div class="screen listing shade"><div class="list-box panel"><header><h2>${esc(this.story.title)}</h2><button class="btn ghost small" data-a="back">Back</button></header>
      <p class="lede">${esc(this.story.subtitle || '')}</p><div class="items">${items}</div>
      <div class="foot"><div class="checks"><label>Opponents play as <select data-level>${LEVELS.map((l) => `<option value="${l.id}" ${l.id === (app.save.storyLevel || 2) ? 'selected' : ''}>${l.name}</option>`).join('')}</select></label></div>
      ${firstOpen >= 0 ? `<button class="btn primary" data-ch="${firstOpen}">${firstOpen === 0 ? 'Begin' : 'Continue'}</button>` : '<button class="btn primary" data-ch="0">Tell it again</button>'}</div></div></div>`);
    node.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      app.sfx.tick();
      if (b.dataset.ch !== undefined) this.play(+b.dataset.ch); else if (b.dataset.a === 'back') app.toTitle();
    });
    node.addEventListener('change', (e) => { if (e.target.dataset.level !== undefined) { app.save.storyLevel = +e.target.value; app.persist(); } });
    app.ui.setScreen(node);
  }

  /** Speak a scene. Clicking or pressing space moves on; "Skip scene" drops the rest. */
  async scene(lines, alive) {
    const app = this.app;
    if (!lines || !lines.length) return true;
    let skipAll = false;
    const layer = app.cutLayer = el('<div class="cut"><button class="btn ghost small skip">Skip scene</button><div class="next">click or press space to go on</div></div>');
    layer.addEventListener('click', (e) => { if (e.target.closest('.skip')) skipAll = true; app.voice.stop(); });
    const keys = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); app.voice.stop(); } };
    window.addEventListener('keydown', keys);
    app.ui.root.append(layer);
    for (const line of lines) {
      if (skipAll || !alive()) break;
      await app.director.say(line.who, line, { hold: 0.3 });
    }
    window.removeEventListener('keydown', keys);
    layer.remove(); if (app.cutLayer === layer) app.cutLayer = null;
    return alive();
  }

  /** Ask which boy the player takes in a match. Resolves to 0, 1, or -1 (watch). */
  chooseSide(ch, seats) {
    const app = this.app, g = ch.game, p = PRESETS[g.preset];
    return new Promise((resolve) => {
      const card = el(`<div class="card panel matchcard"><h2>${esc(CHARACTERS[seats[0]].name)} against ${esc(CHARACTERS[seats[1]].name)}</h2>
        <p><b>${esc(p.name)} rules.</b> ${esc(p.blurb)}</p>${g.note ? `<p><i>${esc(g.note)}</i></p>` : ''}
        <div class="vs"><button class="pick sel" data-s="0" style="background-image:url('${app.ui.card(seats[0])}')"><span>Play ${esc(CHARACTERS[seats[0]].name)}</span></button><em>or</em><button class="pick sel" data-s="1" style="background-image:url('${app.ui.card(seats[1])}')"><span>Play ${esc(CHARACTERS[seats[1]].name)}</span></button></div>
        <div class="acts" style="justify-content:center"><button class="btn ghost" data-s="rules">Read the rules</button><button class="btn ghost" data-s="-1">Just watch</button></div></div>`);
      const m = app.ui.modal(card, { dismiss: false });
      card.addEventListener('click', (e) => {
        const b = e.target.closest('[data-s]'); if (!b) return;
        if (b.dataset.s === 'rules') { app.ui.rulesCard(p); return; }
        m.close(); resolve(+b.dataset.s);
      });
    });
  }

  async play(index) {
    const app = this.app, ch = this.story.chapters[index], g = ch.game || null, prog = this.progress();
    app.clearTable();
    const token = this.token = {};
    const alive = () => this.token === token && app.mode === 'story';
    app.mode = 'story'; app.ui.setScreen(null); app.ui.showHud(false);
    // who sits at the table
    let chars;
    if (g && g.type === 'match') chars = [g.white || g.players[0], g.players.find((c) => c !== (g.white || g.players[0]))];
    else if (g && g.type === 'problem') { const solver = g.solver || 'maximus'; chars = [solver, g.opponent || CHARACTER_ORDER.find((c) => c !== solver)]; } else chars = ch.cast || ['maximus', 'titus'];
    const problem = g && g.type === 'problem' ? STORY_PROBLEMS[g.problem] : null;
    const startState = problem ? problem.make() : null;
    const rules = startState ? startState.rules : PRESETS[(g && g.preset) || 'legionary'];
    const seats = chars.map((c) => ({ char: c, kind: 'ai', level: app.save.storyLevel || 2 }));
    const glass = ['white', 'blue']; // Cornelius' set
    await app.setTable({ rules, seats, setting: ch.setting || 'cubiculum', glass });
    if (!alive()) return;
    if (startState) app.board.sync(startState); else app.board.sync(new GameSession(app, { rules, seats }).state);
    app.board.clearMarks(); app.board.setLast([]);
    const banner = el(`<div class="cut" style="pointer-events:none"><div class="chapter"><small>${esc(this.label(index))}</small><h2>${esc(ch.title)}</h2></div></div>`);
    app.ui.root.append(banner); app.cutLayer = banner;
    await app.stage.wait(2.4);
    banner.remove(); if (app.cutLayer === banner) app.cutLayer = null;
    if (!alive()) return;
    if (!(await this.scene(ch.intro, alive))) return;

    let outcome = null;
    if (g && g.type === 'match') {
      const side = await this.chooseSide(ch, chars);
      if (!alive()) return;
      seats.forEach((s, i) => { s.kind = i === side ? 'human' : 'ai'; });
      const result = await new Promise((resolve) => {
        app.startGame({ mode: 'story', rules, seats, setting: ch.setting || 'cubiculum', coach: false, glass, onEnd: resolve });
      });
      if (!alive()) return;
      outcome = result.winnerSeat >= 0 ? chars[result.winnerSeat] : 'draw';
      prog.winners[ch.id] = outcome;
      await app.stage.wait(1.2);
    } else if (problem) {
      for (;;) {
        const result = await new Promise((resolve) => {
          app.startGame({
            mode: 'story', rules, seats: [{ char: chars[0], kind: 'human' }, { char: chars[1], kind: 'ai', level: 5 }], setting: ch.setting || 'cubiculum',
            startState: problem.make(), quietTalk: true, goalText: g.goal || problem.goalText, glass,
            goal: { side: 0, within: problem.within, test: problem.test }, onEnd: resolve,
          }).then(() => app.ui.toast(g.goal || problem.goalText || '', 8000));
        });
        if (!alive()) return;
        if (result.solved) { outcome = 'solved'; app.sfx.fanfare(); break; }
        app.sfx.low();
        const again = await app.ui.confirm({ title: 'The tablet keeps its secret', text: 'That was not the answer. Try the problem again, or let the boys work it out without you?', yes: 'Try again', no: 'Let them solve it' });
        if (!alive()) return;
        if (!again) { outcome = 'failed'; break; }
      }
      await app.stage.wait(0.8);
    }
    // the game is over: back to the scene
    if (app.session) { app.session.stop(); app.session = null; }
    app.ui.clearVictory(); app.ui.showHud(false); app.ui.hud.setPrompt('');
    const outro = ch.outro ? ch.outro[outcome] || ch.outro.draw || ch.outro.solved || [] : [];
    if (!(await this.scene(outro, alive))) return;
    if (!(await this.scene(ch.closing, alive))) return;
    if (!prog.done.includes(ch.id)) prog.done.push(ch.id);
    app.persist();
    const next = this.story.chapters[index + 1];
    app.ui.victory({
      title: next ? 'To be continued' : 'Finis', who: next ? `Next: ${next.title}` : this.story.title, why: '',
      actions: [
        ...(next ? [{ label: 'Go on', primary: true, run: () => this.play(index + 1) }] : []),
        { label: 'The chapters', run: () => { app.clearTable(); this.menu(); } },
        { label: 'Leave', run: () => app.toTitle() },
      ],
    });
  }
}
