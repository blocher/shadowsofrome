#!/usr/bin/env node
// Measures face landmarks on each neutral frame with a Gemini vision model (pointing),
// writes scripts/art/landmarks.json (normalised [x,y]) and a marked-up check image.
// The result is committed so the art can be rebuilt without calling the API again.
//   node scripts/art/landmarks.mjs [checkImage.jpg]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './gen.mjs';

const key = process.env.GEMINI_API_KEY || fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/GEMINI_API_KEY\s*=\s*(.*)/)[1].trim().replace(/^['"]|['"]$/g, '');
const MODEL = 'gemini-3.5-flash';
const file = path.join(ROOT, 'scripts/art/landmarks.json');
const out = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const comps = [];
let n = 0;
for (const who of ['maximus', 'titus', 'aghiles']) {
  const img = await sharp(path.join(ROOT, 'public/art/characters', who, 'neutral.webp')).flatten({ background: '#808080' }).jpeg({ quality: 92 }).toBuffer();
  if (!out[who] || process.argv.includes('--force')) {
    const prompt = 'Point to these five features of the person in the image and return ONLY a JSON object. Keys: "eyeL" (centre of the pupil of the eye that is further LEFT in the image), "eyeR" (centre of the pupil of the eye that is further RIGHT in the image), "mouth" (centre of the lips, where they meet), "headTop" (the highest point of the hair), "chin" (the lowest point of the chin). Each value is [y, x] with both numbers normalised to 0-1000 (y first).';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: img.toString('base64') } }, { text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(j.error).slice(0, 300));
    const pts = JSON.parse(j.candidates[0].content.parts.map((p) => p.text || '').join(''));
    const yx = (v) => (Array.isArray(v) ? v : v.point || v.point_2d || [v.y, v.x]);
    const entries = Array.isArray(pts) ? pts.map((p) => [p.label || p.name || p.key, yx(p)]) : Object.entries(pts).map(([k, v]) => [k, yx(v)]);
    out[who] = Object.fromEntries(entries.map(([k, [y, x]]) => [k, [+(x / 1000).toFixed(4), +(y / 1000).toFixed(4)]]));
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1280">${Object.entries(out[who]).map(([k, [x, y]]) => `<circle cx="${x * 1024}" cy="${y * 1280}" r="5" fill="none" stroke="#00ff00" stroke-width="2"/><line x1="${x * 1024 - 14}" y1="${y * 1280}" x2="${x * 1024 + 14}" y2="${y * 1280}" stroke="#ff00ff" stroke-width="1"/><line x1="${x * 1024}" y1="${y * 1280 - 14}" x2="${x * 1024}" y2="${y * 1280 + 14}" stroke="#ff00ff" stroke-width="1"/><text x="${x * 1024 + 16}" y="${y * 1280 - 6}" font-size="18" fill="#ffff00" font-family="Helvetica">${k}</text>`).join('')}</svg>`;
  const marked = await sharp(await sharp(img).composite([{ input: Buffer.from(svg) }]).png().toBuffer()).extract({ left: 150, top: 60, width: 760, height: 640 }).toBuffer();
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
  comps.push({ input: marked, left: n * 760, top: 0 });
  n++;
  console.log(who, JSON.stringify(out[who]));
}
fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
if (process.argv[2] && !process.argv[2].startsWith('--')) await sharp({ create: { width: 760 * 3, height: 640, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 88 }).toFile(process.argv[2]);
