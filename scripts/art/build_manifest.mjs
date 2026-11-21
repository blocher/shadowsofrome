#!/usr/bin/env node
// Review images and the manifest:
//   public/art/contact_sheet.jpg   everything in one labelled image (<= 2400 px wide)
//   public/art/review_edges.jpg    each boy's neutral cutout over black and over white at 100%
//   public/art/manifest.json       every file with its size in pixels and bytes
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './gen.mjs';
import { FRAMES, DUX_POSES, BACKGROUNDS, STORY } from './prompts.mjs';

const ART = path.join(ROOT, 'public/art');
const W = 2400, PAD = 16, LABEL = 26;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function checker(w, h, a = '#8a8a8a', b = '#767676', n = 20) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><pattern id="c" width="${n * 2}" height="${n * 2}" patternUnits="userSpaceOnUse"><rect width="${n * 2}" height="${n * 2}" fill="${a}"/><rect width="${n}" height="${n}" fill="${b}"/><rect x="${n}" y="${n}" width="${n}" height="${n}" fill="${b}"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`);
}
async function cell(file, w, h, { onChecker = false, fit = 'contain' } = {}) {
  let img = sharp(file).resize(w, h, { fit, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (onChecker) return sharp(checker(w, h)).composite([{ input: await img.png().toBuffer() }]).png().toBuffer();
  return img.flatten({ background: '#1b1b1b' }).png().toBuffer();
}

// sections: { title, cw, ch, items: [{file,label}], opts }
const chars = ['maximus', 'titus', 'aghiles'];
const sections = [
  ...chars.map((c) => ({ title: `characters/${c}  (RGBA 1024x1280, on checker)`, cw: 248, ch: 310, opts: { onChecker: true }, items: FRAMES.map((f) => ({ file: `characters/${c}/${f}.webp`, label: f })) })),
  { title: 'dux  (RGBA 768x768, on checker)', cw: 280, ch: 280, opts: { onChecker: true }, items: DUX_POSES.map((p) => ({ file: `dux/${p}.webp`, label: p })) },
  { title: 'backgrounds  (2560x1440) and their env maps (1024x512)', cw: 380, ch: 214, opts: { fit: 'contain' }, items: BACKGROUNDS.flatMap((b) => [{ file: `backgrounds/${b}.webp`, label: b }, { file: `backgrounds/${b}_env.webp`, label: `${b}_env` }]) },
  { title: 'ui', cw: 380, ch: 290, items: [{ file: 'ui/hero.webp', label: 'hero' }, ...[...chars, 'dux'].map((c) => ({ file: `ui/card_${c}.webp`, label: `card_${c}` })), { file: 'ui/parchment.webp', label: 'parchment' }], extra: { file: 'ui/logo_mark.webp', label: 'logo_mark (RGBA)' } },
  { title: 'story  (1920x1080)', cw: 380, ch: 214, items: STORY.map((s) => ({ file: `story/${s}.webp`, label: s })) },
  { title: 'textures  (board slab is generated; marble_01 tiles and dark_wood are Poly Haven CC0)', cw: 280, ch: 280, opts: { fit: 'cover' }, items: [['marble/slab.webp', 'marble/slab'], ['marble/slab_normal_gl.jpg', 'slab_normal_gl'], ['marble/slab_arm.jpg', 'slab_arm'], ['marble/diffuse.jpg', 'marble/diffuse (PH)'], ['wood/diffuse.jpg', 'wood/diffuse (PH)'], ['wood/normal_gl.jpg', 'wood/normal_gl'], ['wood/arm.jpg', 'wood/arm']].map(([f, l]) => ({ file: `textures/${f}`, label: l })) },
];

const comps = [];
let y = PAD;
const text = [];
for (const s of sections) {
  text.push(`<text x="${PAD}" y="${y + 24}" font-size="24" font-weight="bold" fill="#e8d9b0">${esc(s.title)}</text>`);
  y += 38;
  let x = PAD;
  const items = s.extra ? [...s.items, { ...s.extra, checker: true }] : s.items;
  for (const it of items) {
    if (x + s.cw > W - PAD) { x = PAD; y += s.ch + LABEL + 8; }
    const f = path.join(ART, it.file);
    if (fs.existsSync(f)) comps.push({ input: await cell(f, s.cw, s.ch, it.checker ? { onChecker: true } : s.opts || {}), left: x, top: y });
    else text.push(`<text x="${x + 8}" y="${y + 40}" font-size="18" fill="#ff6060">MISSING</text>`);
    text.push(`<text x="${x + 2}" y="${y + s.ch + 19}" font-size="17" fill="#d0d0d0">${esc(it.label)}</text>`);
    x += s.cw + 12;
  }
  y += s.ch + LABEL + 22;
}
const H = y + PAD;
const labels = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">${text.join('')}</svg>`);
await sharp({ create: { width: W, height: H, channels: 3, background: '#141414' } }).composite([...comps, { input: labels }]).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(ART, 'contact_sheet.jpg'));
console.log('contact_sheet.jpg', W, H);

// review_edges: 100 % cutouts over black (top row) and white (bottom row)
{
  const cw = 1024, chh = 1280, rc = [];
  for (let i = 0; i < chars.length; i++) {
    const f = path.join(ART, 'characters', chars[i], 'neutral.webp');
    rc.push({ input: await sharp(f).flatten({ background: '#000000' }).png().toBuffer(), left: i * cw, top: 0 });
    rc.push({ input: await sharp(f).flatten({ background: '#ffffff' }).png().toBuffer(), left: i * cw, top: chh });
  }
  await sharp({ create: { width: cw * 3, height: chh * 2, channels: 3, background: '#000' } }).composite(rc).jpeg({ quality: 90 }).toFile(path.join(ART, 'review_edges.jpg'));
  console.log('review_edges.jpg', cw * 3, chh * 2);
}

// manifest
{
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name !== 'manifest.json' && !e.name.startsWith('.')) files.push(p); } };
  walk(ART);
  files.sort();
  const out = [];
  let total = 0;
  for (const f of files) {
    const rel = path.relative(ART, f).split(path.sep).join('/');
    const bytes = fs.statSync(f).size;
    total += bytes;
    const entry = { path: rel, bytes };
    if (/\.(webp|jpg|jpeg|png)$/i.test(f)) {
      const m = await sharp(f).metadata();
      Object.assign(entry, { width: m.width, height: m.height, alpha: !!m.hasAlpha });
    } else if (/\.hdr$/i.test(f)) {
      const head = fs.readFileSync(f).subarray(0, 400).toString('latin1');
      const m = head.match(/-Y (\d+) \+X (\d+)/);
      if (m) Object.assign(entry, { width: +m[2], height: +m[1] });
    }
    out.push(entry);
  }
  fs.writeFileSync(path.join(ART, 'manifest.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), base: 'public/art/', totalBytes: total, files: out }, null, 2) + '\n');
  console.log('manifest.json', out.length, 'files', (total / 1e6).toFixed(1) + ' MB');
}
