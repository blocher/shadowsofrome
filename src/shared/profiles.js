// Who is playing on this device, and what each of them has done. No accounts and no passwords: just a list of
// names kept in the browser, so a family can share one tablet and each keep their own story progress and record.
// Everything lives in localStorage under one key; each game in this repo gets its own section.
const KEY = 'shadows-of-rome-v2';
const OLD_KEY = 'shadows-of-rome-latrunculi-v1';
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export class Store {
  /** @param game section name, e.g. 'latrunculi'; defaults = default device settings for that game */
  constructor(game, defaults = {}) {
    this.game = game;
    this.data = { v: 2, profiles: [], current: null, settings: {}, games: {} };
    try { const raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw && raw.v === 2) this.data = raw; } catch (e) { /* first visit, or private mode */ }
    this.data.settings = { ...defaults, ...(this.data.settings || {}) };
    this.data.games = this.data.games || {};
    const g = this.data.games[game] = this.data.games[game] || {};
    g.progress = g.progress || {};   // profile id (or 'guest') -> that player's progress
    g.saves = g.saves || [];         // games in progress, newest first
    g.finished = g.finished || [];   // finished games kept for review, newest first
    // carry over what the first version stored before there were players
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
      if (old && !g.migrated) { g.migrated = true; if (old.settings) Object.assign(this.data.settings, old.settings); if (old.save) this.pendingOld = old.save; }
    } catch (e) { /* nothing to carry over */ }
  }

  persist() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* storage full or unavailable */ } }
  get settings() { return this.data.settings; }
  get section() { return this.data.games[this.game]; }

  // ---- players ---------------------------------------------------------------------------------------------------
  get profiles() { return this.data.profiles; }
  get current() { return this.data.profiles.find((p) => p.id === this.data.current) || null; }
  name(id) { const p = this.data.profiles.find((x) => x.id === id); return p ? p.name : null; }
  /** Add a player (or find one of the same name). `select` makes them the current player. */
  add(name, select = true) {
    name = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!name) return null;
    const same = this.data.profiles.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (same) { if (select) this.data.current = same.id; this.persist(); return same; }
    const p = { id: uid(), name, created: Date.now() };
    this.data.profiles.push(p);
    if (select || !this.data.current) this.data.current = p.id;
    if (this.pendingOld) { this.section.progress[p.id] = { ...this.pendingOld }; this.pendingOld = null; }
    else if (this.section.progress.guest && this.data.profiles.length === 1) { this.section.progress[p.id] = this.section.progress.guest; delete this.section.progress.guest; } // a guest's progress becomes the first player's
    this.persist();
    return p;
  }
  rename(id, name) { const p = this.data.profiles.find((x) => x.id === id); name = String(name || '').trim().slice(0, 24); if (p && name) { p.name = name; this.persist(); } }
  remove(id) {
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    delete this.section.progress[id];
    if (this.data.current === id) this.data.current = this.data.profiles[0] ? this.data.profiles[0].id : null;
    this.persist();
  }
  choose(id) { if (id === null || this.data.profiles.some((p) => p.id === id)) { this.data.current = id; this.persist(); } }

  /** The current player's progress in this game (a guest has progress too, shared by all guests). */
  progress(id = this.data.current) {
    const key = id || 'guest', all = this.section.progress;
    if (!all[key]) all[key] = key === 'guest' && this.pendingOld ? { ...this.pendingOld } : {};
    const p = all[key];
    p.story = p.story || { done: [], winners: {} }; p.lessons = p.lessons || []; p.record = p.record || { played: 0, won: 0, lost: 0, drawn: 0 };
    if (p.storyLevel == null) p.storyLevel = 2;
    return p;
  }
  /** Add a finished game to a player's record. result: 'won' | 'lost' | 'drawn'. */
  tally(id, result) { if (!id) return; const r = this.progress(id).record; r.played++; r[result]++; this.persist(); }

  // ---- saved games -----------------------------------------------------------------------------------------------
  get saves() { return this.section.saves; }
  get finished() { return this.section.finished; }
  /** Create or update a game in progress. Returns its id. */
  saveGame(game) {
    const list = this.section.saves, i = list.findIndex((g) => g.id === game.id);
    if (i >= 0) list.splice(i, 1);
    list.unshift({ ...game, updated: Date.now() });
    list.length = Math.min(list.length, 12);
    this.persist();
    return game.id;
  }
  /** A game has ended: it leaves the games in progress and joins the finished ones. */
  finishGame(game) {
    this.section.saves = this.section.saves.filter((g) => g.id !== game.id);
    this.section.finished.unshift({ ...game, updated: Date.now() });
    this.section.finished.length = Math.min(this.section.finished.length, 20);
    this.persist();
  }
  deleteGame(id) {
    this.section.saves = this.section.saves.filter((g) => g.id !== id);
    this.section.finished = this.section.finished.filter((g) => g.id !== id);
    this.persist();
  }
  newId() { return uid(); }
}
