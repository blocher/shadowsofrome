// Records the spoken lines with ElevenLabs into public/voice/<id>.mp3 and writes public/voice/manifest.json.
//   node scripts/voices.mjs [--force] [--only <prefix,prefix>] [--speaker <id,id>] [--dry]
//   node scripts/voices.mjs --audition      record every candidate voice reading a few real lines (public/voice/audition/)
//   node scripts/voices.mjs --level         even out the loudness of the recordings already made (needs ffmpeg)
// The key is read from ELEVENLABS_API_KEY (environment or the git-ignored .env file) and never written anywhere.
// A line is recorded again only when its text or its speaker's voice has changed.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process';
import { STORY } from '../src/latrunculi/story/script.js';
import { BANTER, BANTER_VS } from '../src/latrunculi/story/banter.js';
import { TUTORIAL } from '../src/latrunculi/story/tutorial-lines.js';
import { CAST, MODEL, AUDITION_LINES } from '../src/latrunculi/story/cast.js';

if (!process.env.ELEVENLABS_API_KEY && fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
}
const KEY = process.env.ELEVENLABS_API_KEY;
const args = process.argv.slice(2), flag = (f) => args.includes('--' + f), val = (f) => { const i = args.indexOf('--' + f); return i >= 0 ? (args[i + 1] || '').split(',').filter(Boolean) : []; };
const OUT = path.resolve('public/voice'), MAN = path.join(OUT, 'manifest.json');

/** Every spoken line in the game: { id, who, text, group }. */
export function allLines() {
  const lines = [];
  const add = (group, list, who) => { for (const l of list || []) lines.push({ id: l.id, who: l.who || who, text: l.text, group }); };
  for (const ch of STORY.chapters) {
    add('story', ch.intro); add('story', ch.closing);
    for (const k of Object.keys(ch.outro || {})) add('story', ch.outro[k]);
  }
  for (const ev of Object.keys(BANTER)) for (const who of Object.keys(BANTER[ev])) add('banter', BANTER[ev][who], who);
  for (const ev of Object.keys(BANTER_VS)) for (const pair of Object.keys(BANTER_VS[ev])) add('banter', BANTER_VS[ev][pair], pair.split('>')[0]);
  for (const id of Object.keys(TUTORIAL)) {
    const t = TUTORIAL[id];
    add('tutorial', t.intro); add('tutorial', t.wrap);
    for (const s of t.steps || []) { add('tutorial', s.prompt); add('tutorial', s.onWrong); add('tutorial', s.onRight); }
  }
  const seen = new Set();
  for (const l of lines) { if (seen.has(l.id)) throw new Error('duplicate line id ' + l.id); seen.add(l.id); if (!CAST[l.who]) throw new Error(`no voice cast for speaker "${l.who}" (line ${l.id})`); }
  return lines;
}

async function tts(voice, text, file) {
  for (let tries = 0; tries < 5; tries++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=mp3_44100_64`, {
      method: 'POST', headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: { use_speaker_boost: true, ...voice.s } }),
    });
    if (r.ok) { fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); return true; }
    if (r.status !== 429 && r.status < 500) { console.error('  failed', path.basename(file), r.status, (await r.text()).slice(0, 240)); return false; }
    await new Promise((q) => setTimeout(q, 2500 * (tries + 1)));
  }
  console.error('  gave up', path.basename(file)); return false;
}
/**
 * Bring a recording to about the same loudness as the others, so nobody has to ride the volume. The synthesiser's
 * level wanders by 20 dB from line to line. Quiet lines stay a little quieter than loud ones; a limiter keeps the
 * peaks in. Does nothing when ffmpeg is missing or the line is already close. Returns the gain applied, in dB.
 */
const TARGET = -21, HAVE_FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0;
function level(file) {
  if (!HAVE_FFMPEG) return 0;
  const out = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
  const mean = parseFloat((out.match(/mean_volume: (-?[\d.]+)/) || [])[1]), max = parseFloat((out.match(/max_volume: (-?[\d.]+)/) || [])[1]);
  if (!isFinite(mean) || !isFinite(max)) return 0;
  let gain = (TARGET - mean) * 0.85;                         // most of the way: a murmur stays a murmur
  gain = Math.max(-10, Math.min(10, gain, -1 - max + 6));     // at most 6 dB into the limiter
  if (Math.abs(gain) < 1) return 0;
  const tmp = file + '.tmp.mp3';
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.891:attack=3:release=60:level=disabled`, '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', tmp]);
  if (r.status !== 0 || !fs.existsSync(tmp) || fs.statSync(tmp).size < 500) { fs.rmSync(tmp, { force: true }); return 0; }
  fs.renameSync(tmp, file);
  return gain;
}
const pool = async (items, n, fn) => { const q = items.slice(); await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); };
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

const lines = allLines();
const byId = new Map(lines.map((l) => [l.id, l]));

if (import.meta.url === `file://${process.argv[1]}`) {
  const chars = (ls) => ls.reduce((n, l) => n + l.text.length, 0);
  if (flag('count') || flag('dry') && !flag('audition')) {
    const groups = {}; for (const l of lines) { (groups[l.group] = groups[l.group] || []).push(l); }
    for (const g of Object.keys(groups)) console.log(g.padEnd(9), String(groups[g].length).padStart(4), 'lines', String(chars(groups[g])).padStart(6), 'characters');
    console.log('total'.padEnd(9), String(lines.length).padStart(4), 'lines', String(chars(lines)).padStart(6), 'characters');
    if (flag('count')) process.exit(0);
  }
  if (!KEY) { console.error('Set ELEVENLABS_API_KEY (or put it in .env).'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });

  if (flag('audition')) {
    const dir = path.join(OUT, 'audition'); fs.mkdirSync(dir, { recursive: true });
    const jobs = [], index = {};
    for (const [role, c] of Object.entries(CAST)) {
      let ids = AUDITION_LINES[role] || [];
      if (!ids.length) ids = lines.filter((l) => l.who === role).slice(0, 3).map((l) => l.id);
      index[role] = { chosen: c.voice, lines: ids.map((id) => ({ id, text: byId.get(id).text })), candidates: {} };
      for (const [key, v] of Object.entries(c.candidates)) {
        index[role].candidates[key] = { label: v.label, files: ids.map((id) => `${role}__${key}__${id}.mp3`) };
        for (const id of ids) { const file = path.join(dir, `${role}__${key}__${id}.mp3`); if (flag('force') || !fs.existsSync(file)) jobs.push({ v, text: byId.get(id).text, file }); }
      }
    }
    console.log(`${jobs.length} audition clips to record (${jobs.reduce((n, j) => n + j.text.length, 0)} characters)`);
    if (!flag('dry')) await pool(jobs, 3, (j) => tts(j.v, j.text, j.file));
    fs.writeFileSync(path.join(dir, 'audition.json'), JSON.stringify(index, null, 1));
    process.exit(0);
  }

  if (flag('level')) {
    if (!HAVE_FFMPEG) { console.error('ffmpeg is not installed.'); process.exit(1); }
    let n = 0; for (const l of lines) { const f = path.join(OUT, l.id + '.mp3'); if (fs.existsSync(f) && level(f)) n++; }
    console.log(`levelled ${n} of ${lines.length} recordings`);
    process.exit(0);
  }

  const man = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : {}; man.hash = man.hash || {};
  const only = val('only'), speakers = val('speaker'), force = flag('force');
  const want = (l) => (!only.length || only.some((p) => l.id.startsWith(p))) && (!speakers.length || speakers.includes(l.who));
  const hashOf = (l) => { const c = CAST[l.who], v = c.candidates[c.voice]; return sha([v.id, JSON.stringify(v.s), MODEL, l.text].join('|')); };
  const todo = lines.filter((l) => want(l) && (force || man.hash[l.id] !== hashOf(l) || !fs.existsSync(path.join(OUT, l.id + '.mp3'))));
  console.log(`${todo.length} of ${lines.length} lines to record (${chars(todo)} characters)`);
  if (!flag('dry')) {
    await pool(todo, 3, async (l) => { const c = CAST[l.who]; const f = path.join(OUT, l.id + '.mp3'); if (await tts(c.candidates[c.voice], l.text, f)) { level(f); man.hash[l.id] = hashOf(l); } });
    for (const id of Object.keys(man.hash)) if (!byId.has(id)) { delete man.hash[id]; fs.rmSync(path.join(OUT, id + '.mp3'), { force: true }); }
    man.lines = lines.filter((l) => man.hash[l.id] && fs.existsSync(path.join(OUT, l.id + '.mp3'))).map((l) => l.id);
    fs.writeFileSync(MAN, JSON.stringify(man));
    console.log(`${man.lines.length} of ${lines.length} lines are recorded`);
  }
}
