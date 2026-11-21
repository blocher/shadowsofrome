// The Ludus: lessons (Maximus and Titus teaching Aghiles, as the books have it) and practice puzzles.
import { applyMove, sqIndex, legalMoves } from '../engine/engine.js';
import { PRESETS } from '../engine/rules.js';
import { LESSONS, PUZZLES, preMoves, goalMet } from './lessons.js';
import { GameSession } from './session.js';
import { el, esc } from '../ui/ui.js';

export class Ludus {
  constructor(app) { this.app = app; }

  menu() {
    const app = this.app, T = app.tutorialLines, done = new Set(app.save.lessons || []);
    const lessons = LESSONS.map((l, i) => { const t = T[l.id] || { title: l.id, summary: '' }; return `<button class="item" data-lesson="${l.id}"><span class="n">${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i]}</span><span><b>${esc(t.title)}</b><small>${esc(t.summary || '')}</small></span><span class="tick">${done.has(l.id) ? '✓' : ''}</span></button>`; }).join('');
    const puzzles = PUZZLES.map((p, i) => `<button class="item" data-puzzle="${p.id}"><span class="n">${i + 1}</span><span><b>${esc(p.title)}</b><small>${esc(p.text)} <i>${esc(PRESETS[p.rules].name)} rules.</i></small></span><span class="tick">${done.has('puzzle:' + p.id) ? '✓' : ''}</span></button>`).join('');
    const node = el(`<div class="screen listing shade"><div class="list-box panel"><header><h2>The Ludus</h2><button class="btn ghost small" data-a="back">Back</button></header>
      <p class="lede">A rainy afternoon in Maximus’ room. Aghiles has never seen the game, and his friends mean to teach him. You are Aghiles.</p>
      <div class="sub">Lessons</div><div class="items">${lessons}</div>
      <div class="sub">Problems to solve</div><div class="items">${puzzles}</div></div></div>`);
    node.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      app.sfx.tick();
      if (b.dataset.lesson) this.lesson(b.dataset.lesson); else if (b.dataset.puzzle) this.puzzle(b.dataset.puzzle); else if (b.dataset.a === 'back') app.toTitle();
    });
    app.ui.setScreen(node);
  }

  markDone(key) { const s = new Set(this.app.save.lessons || []); s.add(key); this.app.save.lessons = [...s]; this.app.persist(); }

  /** Speak a list of lines; a click or the space bar cuts the current line short. */
  async speak(lines, epoch) {
    const app = this.app;
    for (const line of lines || []) {
      if (app.epoch !== epoch) return false;
      await app.director.say(line.who, line, { hold: 0.25 });
    }
    return app.epoch === epoch;
  }

  async lesson(id) {
    const app = this.app, lesson = LESSONS.find((l) => l.id === id), T = app.tutorialLines[id] || { title: id, intro: [], steps: [], wrap: [] };
    app.clearTable();
    const epoch = app.epoch;
    app.mode = 'ludus'; app.ui.setScreen(null);
    const seats = [{ char: 'aghiles', kind: 'human' }, { char: 'maximus', kind: 'ai', level: 3 }];
    let state = lesson.steps[0].make();
    await app.setTable({ rules: state.rules, seats, setting: 'cubiculum', glass: ['white', 'blue'] });
    if (app.epoch !== epoch) return;
    const pseudo = { state, rules: { ...state.rules, name: T.title }, seats, cfg: { noHelp: true, goalText: `Lesson: ${T.title}` }, isHuman: (i) => i === 0, log: [], showThreats: false, coach: false };
    const refresh = () => { pseudo.state = state; app.ui.hud.update(pseudo); };
    app.board.sync(state); app.board.clearMarks(); app.board.setLast([]);
    app.ui.showHud(true); refresh();
    const keys = (e) => { if (e.key === ' ' || e.key === 'Enter') app.voice.stop(); };
    window.addEventListener('keydown', keys);
    const finish = () => window.removeEventListener('keydown', keys);
    app.ui.hud.setPrompt('Press space to move a speech on');
    if (!(await this.speak(T.intro, epoch))) return finish();
    for (let k = 0; k < lesson.steps.length; k++) {
      const step = lesson.steps[k], words = (T.steps && T.steps[k]) || {};
      state = step.make();
      if (state.cols !== app.board.cols || state.rows !== app.board.rows) await app.setTable({ rules: state.rules, seats, setting: 'cubiculum', glass: ['white', 'blue'] });
      app.board.sync(state); app.board.clearMarks(); app.board.setLast([]); refresh();
      for (const [before, after] of preMoves(state, step.pre)) { await app.stage.wait(0.5); await app.board.animate(before, after, app.sfx); state = after; refresh(); }
      if (app.epoch !== epoch) return finish();
      const focus = (step.focus || []).map((n) => sqIndex(state, n));
      if (focus.length) app.board.setHint({ from: focus[0], to: -1 });
      app.ui.hud.setPrompt('');
      if (!(await this.speak(words.prompt, epoch))) return finish();
      let tries = 0;
      for (;;) {
        app.ui.hud.setPrompt('Your move, Aghiles');
        app.director.setTurn(0);
        const mv = await app.input.request(state, { onIllegal: () => app.sfx.error() });
        if (!mv || app.epoch !== epoch) return finish();
        const after = applyMove(state, mv);
        app.board.setHint(null);
        await app.board.animate(state, after, app.sfx);
        if (app.epoch !== epoch) return finish();
        if (step.accept(state, mv, after)) {
          app.sfx.fanfare(); app.director.mood(0, 'pleased', 2.5);
          state = after; refresh();
          if (!(await this.speak(words.onRight, epoch))) return finish();
          break;
        }
        tries++;
        app.director.mood(1, 'thinking', 2);
        if (!(await this.speak(words.onWrong, epoch))) return finish();
        app.board.sync(state); app.board.setLast([]);
        if (tries >= 2) { // show the way
          const good = legalMoves(state).find((m) => step.accept(state, m, applyMove(state, m)));
          if (good) app.board.setHint(good.t === 'm' ? { from: good.from, to: good.to, showTo: true } : { from: -1, to: good.to, showTo: true });
        } else if (focus.length) app.board.setHint({ from: focus[0], to: -1 });
      }
      await app.stage.wait(0.4);
    }
    app.ui.hud.setPrompt('');
    if (!(await this.speak(T.wrap, epoch))) return finish();
    finish();
    this.markDone(id);
    const idx = LESSONS.indexOf(lesson), next = LESSONS[idx + 1];
    app.ui.victory({
      title: 'Bene!', who: `Lesson learned: ${T.title}`, why: T.summary || '',
      actions: [
        ...(next ? [{ label: 'Next lesson', primary: true, run: () => this.lesson(next.id) }] : [{ label: 'Try the problems', primary: true, run: () => { app.clearTable(); app.ui.showHud(false); this.menu(); } }]),
        { label: 'Back to the Ludus', run: () => { app.clearTable(); app.ui.showHud(false); this.menu(); } },
      ],
    });
  }

  async puzzle(id) {
    const app = this.app, p = PUZZLES.find((x) => x.id === id);
    let state = p.make();
    const pre = preMoves(state, p.pre); if (pre.length) state = pre[pre.length - 1][1];
    const start = { ...state, history: [state.key], last: null };
    const back = () => { app.clearTable(); app.ui.showHud(false); this.menu(); };
    await app.startGame({
      mode: 'ludus', rules: state.rules, seats: [{ char: 'aghiles', kind: 'human' }, { char: 'titus', kind: 'ai', level: 5 }], setting: 'cubiculum',
      startState: start, quietTalk: true, goalText: `${p.title}: ${p.text}`, glass: ['white', 'blue'],
      goal: { side: 0, within: p.within, test: (s) => goalMet(p.goal, s) },
      onEnd: ({ solved }) => {
        const idx = PUZZLES.indexOf(p), next = PUZZLES[idx + 1];
        if (solved) { this.markDone('puzzle:' + id); app.sfx.fanfare(); app.director.mood(0, 'triumphant', 0); app.director.duxGo('head0', 'cheer'); } else { app.sfx.low(); app.director.mood(0, 'sulking', 0); }
        app.ui.victory({
          title: solved ? 'Solved' : 'Not this time', who: p.title, why: solved ? 'Aghiles nods. He will remember that one.' : `You had ${p.within === 1 ? 'one move' : p.within + ' moves'}. Look for the piece with nowhere to go.`,
          actions: solved
            ? [...(next ? [{ label: 'Next problem', primary: true, run: () => this.puzzle(next.id) }] : []), { label: 'Back to the Ludus', run: back }]
            : [{ label: 'Try again', primary: true, run: () => this.puzzle(id) }, { label: 'Back to the Ludus', run: back }],
        });
      },
    });
    app.ui.toast(p.text, 7000);
  }
}
