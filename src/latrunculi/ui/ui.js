// The interface: title screen, game setup, the in-game HUD, speech bubbles, menus and dialogs.
import { CHARACTERS, CHARACTER_ORDER, GLASS, SETTINGS, SETTING_ORDER } from '../../shared/characters.js';
import { PRESETS, PRESET_ORDER, HOUSE_OPTIONS, normalizeRules } from '../engine/rules.js';
import { countPieces } from '../engine/engine.js';
import { LEVELS } from '../ai/levels.js';

export const ART = new URL('../art/', document.baseURI).href;
export const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const OPTION_LABELS = {
  cols: ['Squares across each rank', (v) => v], rows: ['Ranks between the players', (v) => v], men: ['Soldiers a side', (v) => v],
  setup: ['The start', (v) => ({ rows: 'Drawn up in ranks', placement: 'Placed in turn on an empty board' }[v])],
  placePerTurn: ['Placed each turn', (v) => (v === 1 ? 'One piece' : 'Two pieces')],
  move: ['A soldier moves', (v) => ({ step: 'One square', slide: 'Any distance in a line' }[v])],
  jump: ['Leaping', (v) => ({ none: 'Not allowed', own: 'Over your own pieces', any: 'Over any piece', duxEnemy: 'The general, over an enemy' }[v])],
  multiJump: ['Chained leaps', (v) => (v ? 'Yes' : 'No')],
  capture: ['A trapped piece', (v) => ({ immediate: 'Is taken at once', delayed: 'Is bound, and taken next turn' }[v])],
  cornerCapture: ['Corner capture', (v) => (v ? 'Yes' : 'No')], multiCapture: ['Several captures in one move', (v) => (v ? 'Yes' : 'Only one')],
  safeEntry: ['Moving between two enemies', (v) => (v ? 'Is safe' : 'Is forbidden')], extraMove: ['A capture earns another move', (v) => (v ? 'Yes' : 'No')],
  dux: ['The general (dux)', (v) => ({ none: 'None', capturable: 'Can be captured', immobilise: 'Must be hemmed in to win' }[v])],
  noMoves: ['A player who cannot move', (v) => ({ lose: 'Loses', count: 'Ends the game; armies are counted' }[v])],
  quietLimit: ['Moves without a capture', (v) => (v ? `${v / 2} each, then count` : 'No limit')],
  first: ['First move', (v) => (v === 1 ? 'Left-hand player' : 'Right-hand player')],
};

export function describeRules(r) {
  const rows = [];
  rows.push(['Board', `${r.cols} by ${r.rows} squares`]);
  rows.push(['Armies', `${r.men} soldiers${r.dux !== 'none' ? ' and a general' : ''} a side`]);
  rows.push(['The start', r.setup === 'rows' ? 'Both armies are drawn up in ranks.' : `The board starts empty. Players take turns placing ${r.placePerTurn === 2 ? 'two pieces' : 'one piece'} on any empty square${r.dux !== 'none' ? ', the general last' : ''}. Nothing is captured until every piece is down.`]);
  rows.push(['Moving', (r.move === 'slide' ? 'A piece moves any distance in a straight line, like a rook, and cannot pass over others.' : 'A piece moves one square, forward, back or sideways.') + ({ none: '', own: ' It may also leap over one of your own pieces to the empty square beyond, and go on leaping.', any: ' It may also leap over any single piece to the empty square beyond.', duxEnemy: ' The general may also leap over an enemy piece next to him.' }[r.jump])]);
  rows.push(['Capturing', `Trap one enemy between two of your pieces in a line${r.cornerCapture ? ', or in a corner with a piece on each side of it' : ''}. Only the player who moves captures${r.safeEntry ? ', so you may step between two enemies safely' : ''}. ${r.capture === 'delayed' ? 'A trapped piece is turned over and bound: it cannot move, and it is taken off when your next turn begins, unless your opponent traps one of its captors first.' : 'The trapped piece is taken off at once.'}${r.extraMove ? ' A capture earns another move with the same piece.' : ''}`]);
  if (r.dux === 'capturable') rows.push(['The general', 'One piece a side is the general. He can be captured like any soldier.']);
  if (r.dux === 'immobilise') rows.push(['The general', 'The general cannot be captured, and he helps to capture. Hem him in on all four sides (edges and his own men count, so long as one enemy is among them) and his army has lost.']);
  const ends = [];
  if (r.dux === 'immobilise') ends.push('the enemy general is hemmed in, or left with no soldiers');
  else ends.push(`a side is down to ${r.loseAt === 0 ? 'no pieces' : 'one piece'}`);
  ends.push(r.noMoves === 'lose' ? 'a player cannot move (and loses)' : 'a player cannot move (the armies are counted)');
  if (r.quietLimit) ends.push(`${r.quietLimit / 2} moves each pass with no capture (the larger army wins)`);
  ends.push('the same position comes up three times (the larger army wins)');
  rows.push(['The end', 'The game ends when ' + ends.join('; or ') + '.']);
  return rows;
}

export class UI {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById('ui');
    this.screen = el('<div></div>'); this.hudLayer = el('<div class="hud hidden"></div>'); this.talk = el('<div></div>'); this.modals = el('<div></div>');
    this.root.append(this.hudLayer, this.screen, this.talk, this.modals);
    this.lines = new Map();
    this.hud = new Hud(this);
    window.addEventListener('keydown', (e) => this.key(e));
  }

  name(who) {
    if (CHARACTERS[who]) return CHARACTERS[who].name;
    const sp = this.app.storyData && this.app.storyData.SPEAKERS && this.app.storyData.SPEAKERS[who];
    return sp ? sp.name : who === 'narrator' ? '' : who;
  }
  card(id) { return `${ART}ui/card_${id}.webp`; }

  setScreen(node) { this.screen.replaceChildren(); if (node) this.screen.append(node); }
  showHud(on) { this.hudLayer.classList.toggle('hidden', !on); }

  key(e) {
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'Escape') { if (this.modals.children.length) this.modals.lastElementChild.dispatchEvent(new CustomEvent('dismiss')); else if (this.app.session || this.app.mode) this.menu(); return; }
    if (this.modals.children.length) return;
    const s = this.app.session;
    if (!s || this.hudLayer.classList.contains('hidden')) return;
    const k = e.key.toLowerCase();
    if (k === 'h') s.hint(); else if (k === 'u') s.undo(); else if (k === 't') this.hud.act('threats'); else if (k === 'c') this.hud.act('coach'); else if (k === 'v') this.hud.act('view'); else if (k === 'r') this.rulesCard(s.rules);
  }

  // ---- speech ----------------------------------------------------------------------------------------------------
  showLine(who, text, seat) {
    this.hideLine(who);
    if (this.app.settings.subtitles === false && this.app.voice.has && !this.forceSubtitles) { /* voices only */ }
    const side = seat === 0 ? 'left' : seat === 1 ? 'right' : 'center';
    const name = this.name(who);
    const node = el(`<div class="bubble panel ${side}">${name ? `<b>${esc(name)}</b>` : ''}${esc(text)}</div>`);
    if (this.app.settings.subtitles === false) node.classList.add('hidden');
    for (const [k, n] of this.lines) if (n.classList.contains(side)) { n.remove(); this.lines.delete(k); }
    this.talk.append(node); this.lines.set(who, node);
  }
  hideLine(who) { const n = this.lines.get(who); if (n) { n.remove(); this.lines.delete(who); } }
  clearTalk() { for (const n of this.lines.values()) n.remove(); this.lines.clear(); }

  toast(text, ms = 5200) {
    if (this.toastNode) this.toastNode.remove();
    const n = this.toastNode = el(`<div class="toast panel">${esc(text)}</div>`);
    this.talk.append(n);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { n.remove(); if (this.toastNode === n) this.toastNode = null; }, ms);
  }

  // ---- dialogs ---------------------------------------------------------------------------------------------------
  modal(inner, { dismiss = true } = {}) {
    const m = el('<div class="modal"></div>');
    m.append(inner);
    this.modals.append(m);
    const close = () => m.remove();
    if (dismiss) { m.addEventListener('pointerdown', (e) => { if (e.target === m) m.dispatchEvent(new CustomEvent('dismiss')); }); }
    m.addEventListener('dismiss', () => { if (dismiss) { close(); m.onclose && m.onclose(); } });
    return { node: m, close };
  }
  confirm({ title, text, yes = 'Yes', no = 'No' }) {
    return new Promise((resolve) => {
      const card = el(`<div class="card panel"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="acts"><button class="btn ghost" data-a="no">${esc(no)}</button><button class="btn primary" data-a="yes">${esc(yes)}</button></div></div>`);
      const m = this.modal(card);
      m.node.onclose = () => resolve(false);
      card.addEventListener('click', (e) => { const a = e.target.closest('[data-a]'); if (!a) return; m.close(); resolve(a.dataset.a === 'yes'); });
    });
  }
  rulesCard(rules) {
    const rows = describeRules(rules).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
    const p = PRESETS[rules.id];
    const card = el(`<div class="card wide panel"><h2>${esc(rules.name || 'House rules')}</h2>${p && p.blurb ? `<p><i>${esc(p.blurb)}</i></p>` : ''}<dl>${rows}</dl>${p ? `<div class="ruleinfo"><b>How ancient is this?</b> ${esc(p.evidence)}<br><b>Source:</b> ${esc(p.source)}</div>` : ''}<div class="acts"><button class="btn primary" data-a="ok">Back to the game</button></div></div>`);
    const m = this.modal(card);
    card.querySelector('[data-a]').onclick = () => m.close();
  }
  settingsCard() {
    const s = this.app.settings;
    const card = el(`<div class="card panel"><h2>Settings</h2>
      <div class="field"><span>Voices</span><input type="range" min="0" max="1" step="0.05" data-k="voice" value="${s.voice}"><span></span></div>
      <div class="field"><span>Sound effects</span><input type="range" min="0" max="1" step="0.05" data-k="sfx" value="${s.sfx}"><span></span></div>
      <div class="field"><span>Table talk</span><input type="range" min="0" max="1.5" step="0.25" data-k="chat" value="${s.chat}"><span></span></div>
      <div class="checks" style="margin-top:.8rem">
        <label><input type="checkbox" data-c="subtitles" ${s.subtitles !== false ? 'checked' : ''}> Subtitles</label>
        <label><input type="checkbox" data-c="reduceMotion" ${s.reduceMotion ? 'checked' : ''}> Reduce motion</label>
        <label><input type="checkbox" data-c="lowGraphics" ${s.lowGraphics ? 'checked' : ''}> Lighter graphics</label>
      </div>
      <div class="acts"><button class="btn primary" data-a="ok">Done</button></div></div>`);
    const m = this.modal(card);
    card.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.k) s[t.dataset.k] = +t.value;
      if (t.dataset.c) s[t.dataset.c] = t.checked;
      this.app.applySettings();
    });
    card.querySelector('[data-a]').onclick = () => m.close();
  }
  menu() {
    const app = this.app, inGame = !!(app.session || app.mode);
    if (!inGame) return;
    if (app.session) app.session.paused = true;
    const card = el(`<div class="card panel" style="width:min(420px,100%)"><h2>Paused</h2><div style="display:flex;flex-direction:column;gap:.5rem;margin-top:.6rem">
      <button class="btn primary" data-a="resume">Back to the game</button>
      ${app.session ? '<button class="btn" data-a="rules">The rules</button>' : ''}
      ${app.session && !app.mode ? '<button class="btn" data-a="restart">Start again</button>' : ''}
      <button class="btn" data-a="settings">Settings</button>
      <button class="btn ghost" data-a="quit">Leave the table</button></div></div>`);
    const m = this.modal(card);
    const resume = () => { if (app.session) app.session.paused = false; };
    m.node.onclose = resume;
    card.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'settings') { this.settingsCard(); return; }
      if (act === 'rules') { this.rulesCard(app.session.rules); return; }
      m.close(); resume();
      if (act === 'restart') app.restart();
      if (act === 'quit') app.toTitle();
    });
  }

  // ---- title -----------------------------------------------------------------------------------------------------
  title() {
    const app = this.app, story = app.storyData && app.storyData.STORY, prog = app.save.story || {};
    const started = (prog.done || []).length > 0;
    const node = el(`<div class="screen title"><div class="hero" style="background-image:url('${ART}ui/hero.webp')"></div>
      <div class="title-box">
        <div class="kicker">In the Shadows of Rome</div>
        <h1>Latrunculi</h1>
        <p class="tag">The game of little brigands. Rome, in the year 303.</p>
        <nav>
          <button class="btn primary" data-a="story">${started ? 'Continue the story' : 'Story'} <small>${esc(story ? story.title : 'The Brigands’ Board')}</small></button>
          <button class="btn" data-a="free">Free play <small>any two of the three</small></button>
          <button class="btn" data-a="ludus">Ludus <small>learn the game</small></button>
          <button class="btn ghost" data-a="settings">Settings</button>
        </nav>
        <p class="fine">An unofficial fan game. Maximus, Titus, Aghiles and Dux belong to Sophie de Mullenheim and her publishers. All dialogue here is original.</p>
      </div></div>`);
    node.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      app.sfx.tick();
      ({ story: () => app.openStory(), free: () => this.setup(), ludus: () => app.openLudus(), settings: () => this.settingsCard() })[a.dataset.a]();
    });
    this.setScreen(node);
  }

  // ---- free play setup -------------------------------------------------------------------------------------------
  setup() {
    const app = this.app;
    const cfg = app.save.lastSetup ? structuredClone(app.save.lastSetup) : {
      seats: [{ char: 'maximus', kind: 'human', level: 3 }, { char: 'aghiles', kind: 'ai', level: 3 }],
      preset: 'legionary', house: { ...PRESETS.legionary, id: 'house', name: 'House rules' }, setting: 'cubiculum', coach: false, showThreats: false,
    };
    const node = el('<div class="screen setup shade"><div class="setup-box panel"></div></div>');
    const box = node.firstElementChild;
    const seatHtml = (i) => {
      const s = cfg.seats[i], other = cfg.seats[1 - i].char, c = CHARACTERS[s.char];
      return `<div class="seat"><h3><span>${i === 0 ? 'Left seat' : 'Right seat'}</span><span>${GLASS[c.glass].name} glass</span></h3>
        <div class="picks">${CHARACTER_ORDER.map((id) => `<button class="pick ${s.char === id ? 'sel' : ''} ${other === id ? 'off' : ''}" data-seat="${i}" data-char="${id}" style="background-image:url('${this.card(id)}')" aria-label="${CHARACTERS[id].name}"><i style="background:${GLASS[CHARACTERS[id].glass].css}"></i><span>${CHARACTERS[id].name}</span></button>`).join('')}</div>
        <div class="who"><b>${c.name}.</b> ${esc(c.blurb)} <i>${esc(c.style)}</i></div>
        <div class="row"><div class="seg"><button data-seat="${i}" data-kind="human" class="${s.kind === 'human' ? 'sel' : ''}">You play</button><button data-seat="${i}" data-kind="ai" class="${s.kind === 'ai' ? 'sel' : ''}">AI plays</button></div>
        ${s.kind === 'ai' ? `<select data-seat="${i}" data-level aria-label="AI strength">${LEVELS.map((l) => `<option value="${l.id}" ${l.id === s.level ? 'selected' : ''}>${l.name}: ${esc(l.blurb)}</option>`).join('')}</select>` : ''}</div></div>`;
    };
    const ruleHtml = () => {
      const cur = cfg.preset === 'house' ? normalizeRules(cfg.house) : PRESETS[cfg.preset];
      const cards = PRESET_ORDER.map((id) => { const p = PRESETS[id]; return `<button class="rule ${cfg.preset === id ? 'sel' : ''}" data-preset="${id}"><b>${esc(p.name)}</b><small>${esc(p.blurb)}</small><em>${p.cols}×${p.rows} · ${p.men}${p.dux !== 'none' ? '+1' : ''} a side</em></button>`; }).join('')
        + `<button class="rule ${cfg.preset === 'house' ? 'sel' : ''}" data-preset="house"><b>House rules</b><small>Set every rule yourself.</small><em>your choice</em></button>`;
      const info = cfg.preset === 'house'
        ? `<div class="house">${Object.keys(HOUSE_OPTIONS).map((k) => `<label>${OPTION_LABELS[k][0]}<select data-opt="${k}">${HOUSE_OPTIONS[k].map((v) => `<option value="${v}" ${String(cur[k]) === String(v) ? 'selected' : ''}>${OPTION_LABELS[k][1](v)}</option>`).join('')}</select></label>`).join('')}</div>`
        : `<div class="ruleinfo"><b>${esc(cur.name)}.</b> ${esc(cur.evidence)} <i>Source: ${esc(cur.source)}.</i></div>`;
      return `<div class="rules">${cards}</div>${info}`;
    };
    const draw = () => {
      box.innerHTML = `<header><h2>Set the table</h2><button class="btn ghost small" data-a="back">Back</button></header>
        <div class="grid2">${seatHtml(0)}${seatHtml(1)}</div>
        <div class="sub">Whose rules?</div>${ruleHtml()}
        <div class="sub">Where?</div><div class="places">${SETTING_ORDER.map((id) => `<button class="place ${cfg.setting === id ? 'sel' : ''}" data-place="${id}" style="background-image:url('${ART}backgrounds/${id}.webp')"><span>${esc(SETTINGS[id].name)}</span></button>`).join('')}</div>
        <div class="foot"><div class="checks"><label><input type="checkbox" data-chk="coach" ${cfg.coach ? 'checked' : ''}> Coach warns me before a blunder</label><label><input type="checkbox" data-chk="showThreats" ${cfg.showThreats ? 'checked' : ''}> Show my pieces in danger</label></div>
        <button class="btn primary" data-a="go">Sit down and play</button></div>`;
    };
    draw();
    box.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      app.sfx.tick();
      if (t.dataset.char) { cfg.seats[+t.dataset.seat].char = t.dataset.char; draw(); }
      else if (t.dataset.kind) { cfg.seats[+t.dataset.seat].kind = t.dataset.kind; draw(); }
      else if (t.dataset.preset) { cfg.preset = t.dataset.preset; if (cfg.preset === 'house' && !cfg.house) cfg.house = { ...PRESETS.legionary }; draw(); }
      else if (t.dataset.place) { cfg.setting = t.dataset.place; draw(); }
      else if (t.dataset.a === 'back') this.title();
      else if (t.dataset.a === 'go') {
        app.save.lastSetup = cfg; app.persist();
        const rules = cfg.preset === 'house' ? normalizeRules({ ...cfg.house, id: 'house', name: 'House rules' }) : PRESETS[cfg.preset];
        app.startGame({ rules, seats: structuredClone(cfg.seats), setting: cfg.setting, coach: cfg.coach, showThreats: cfg.showThreats });
      }
    });
    box.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.level !== undefined) cfg.seats[+t.dataset.seat].level = +t.value;
      else if (t.dataset.opt) { const k = t.dataset.opt, raw = t.value; cfg.house[k] = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw; cfg.house = { ...normalizeRules(cfg.house), id: 'house', name: 'House rules' }; draw(); }
      else if (t.dataset.chk) cfg[t.dataset.chk] = t.checked;
    });
    this.setScreen(node);
  }

  // ---- end of game -----------------------------------------------------------------------------------------------
  victory({ title, who, why, actions }) {
    const node = el(`<div class="victory"><div class="laurel">${esc(title)}</div><div class="whoWon">${esc(who)}</div><div class="why">${esc(why || '')}</div><div class="acts">${actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div></div>`);
    node.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (!b) return; this.app.sfx.tick(); const a = actions[+b.dataset.i]; if (!a.keep) node.remove(); a.run(); });
    this.talk.append(node);
    this.victoryNode = node;
    return node;
  }
  clearVictory() { if (this.victoryNode) { this.victoryNode.remove(); this.victoryNode = null; } }
}

// ---------------------------------------------------------------------------------------------------------------
class Hud {
  constructor(ui) {
    this.ui = ui; this.layer = ui.hudLayer;
    this.layer.innerHTML = `
      <div class="cornerbtns l"><button class="btn ghost small" data-a="menu">Menu</button></div>
      <div class="topbar panel"><span class="name" data-f="rules"></span><span class="meta" data-f="meta"></span><button class="btn ghost small" data-a="rules">Rules<kbd>R</kbd></button></div>
      <div class="prompt" data-f="prompt"></div>
      <div class="plate panel left" data-seat="0"></div><div class="plate panel right" data-seat="1"></div>
      <div class="bar panel">
        <button class="btn small" data-a="hint">Hint<kbd>H</kbd></button>
        <button class="btn small" data-a="undo">Take back<kbd>U</kbd></button>
        <button class="btn small" data-a="threats">Danger<kbd>T</kbd></button>
        <button class="btn small" data-a="coach">Coach<kbd>C</kbd></button>
        <button class="btn small" data-a="view">View<kbd>V</kbd></button>
        <button class="btn small primary hidden" data-a="endturn">End turn</button>
        <button class="btn small hidden" data-a="pause">Pause</button>
        <button class="btn small hidden" data-a="speed">Speed ×1</button>
      </div>`;
    this.f = {}; for (const n of this.layer.querySelectorAll('[data-f]')) this.f[n.dataset.f] = n;
    this.plates = [...this.layer.querySelectorAll('.plate')];
    this.btn = {}; for (const n of this.layer.querySelectorAll('[data-a]')) this.btn[n.dataset.a] = n;
    this.layer.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) { ui.app.sfx.tick(); this.act(b.dataset.a); } });
    this.top = false;
  }

  act(a) {
    const app = this.ui.app, s = app.session;
    if (a === 'menu') return this.ui.menu();
    if (!s) return;
    if (a === 'rules') this.ui.rulesCard(s.rules);
    else if (a === 'hint') s.hint();
    else if (a === 'undo') { if (!s.undo()) app.sfx.error(); }
    else if (a === 'threats') this.btn.threats.classList.toggle('on', s.toggleThreats());
    else if (a === 'coach') { const on = s.toggleCoach(); this.btn.coach.classList.toggle('on', on); this.ui.toast(on ? 'Coach on: you will be warned before a move that loses a piece for nothing.' : 'Coach off.', 3000); }
    else if (a === 'view') { this.top = !this.top; app.stage.setView(this.top ? 'top' : 'table'); this.btn.view.classList.toggle('on', this.top); }
    else if (a === 'endturn') app.input.submit({ t: 'x' });
    else if (a === 'pause') { s.paused = !s.paused; this.btn.pause.textContent = s.paused ? 'Resume' : 'Pause'; this.btn.pause.classList.toggle('on', s.paused); }
    else if (a === 'speed') { s.speed = s.speed >= 4 ? 1 : s.speed * 2; app.stage.timeScale = s.speed; this.btn.speed.textContent = `Speed ×${s.speed}`; }
  }

  update(s) {
    const st = s.state, [w, b] = countPieces(st), left = [w, b];
    this.f.rules.textContent = s.rules.name || 'House rules';
    let meta = st.phase === 'place' ? 'placing pieces' : `move ${Math.floor(st.ply / 2) + 1}`;
    if (st.phase === 'move' && s.rules.quietLimit && st.quiet >= s.rules.quietLimit * 0.6 && !st.over) meta += ` · ${Math.ceil((s.rules.quietLimit - st.quiet) / 2)} quiet moves until the count`;
    if (s.cfg.goal) meta = s.cfg.goalText || meta;
    this.f.meta.textContent = meta;
    const turnSeat = st.over ? -1 : st.turn > 0 ? 0 : 1;
    s.seats.forEach((seat, i) => {
      const c = CHARACTERS[seat.char], g = GLASS[s.glassOf ? s.glassOf(i) : c.glass], lvl = LEVELS.find((l) => l.id === seat.level);
      const role = seat.kind === 'human' ? c.epithet : `${lvl ? lvl.name : 'AI'} · AI`;
      const toPlace = st.phase === 'place' ? st.toPlace[i] + st.duxToPlace[i] : 0;
      this.plates[i].classList.toggle('turn', i === turnSeat);
      this.plates[i].innerHTML = `<h3><span class="dot" style="background:${g.css}"></span>${esc(c.name)}<span class="think" data-think>is thinking…</span></h3><div class="role">${esc(role)}</div>
        <div class="tally"><span>on the board <b>${left[i]}</b></span><span>taken <b>${st.captured[i]}</b></span>${toPlace ? `<span>to place <b>${toPlace}</b></span>` : ''}</div>`;
    });
    const anyHuman = s.seats.some((x) => x.kind === 'human');
    for (const k of ['hint', 'undo', 'threats', 'coach']) this.btn[k].classList.toggle('hidden', !anyHuman || !!s.cfg.noHelp);
    this.btn.pause.classList.toggle('hidden', anyHuman); this.btn.speed.classList.toggle('hidden', anyHuman);
    this.btn.endturn.classList.toggle('hidden', !(st.chain >= 0 && !st.over && s.isHuman(turnSeat)));
    this.btn.threats.classList.toggle('on', !!s.showThreats); this.btn.coach.classList.toggle('on', !!s.coach);
    this.btn.undo.disabled = !s.log.some((e) => s.isHuman(e.by));
  }
  setPrompt(text) { this.f.prompt.textContent = text || ''; }
  setThinking(seat, on) { const n = this.plates[seat].querySelector('[data-think]'); if (n) n.classList.toggle('on', on); }
}
