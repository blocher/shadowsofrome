// face close-up grid for one character: node scripts/art/_faces.mjs who out.jpg
import sharp from 'sharp';
import fs from 'node:fs';
const [who, out] = process.argv.slice(2);
const lm = JSON.parse(fs.readFileSync('scripts/art/landmarks.json', 'utf8'))[who];
const frames = ['neutral', 'talk', 'blink', 'look', 'thinking', 'pleased', 'rattled', 'triumphant', 'sulking'];
const cx = (lm.eyeL[0] + lm.eyeR[0]) / 2 * 1024, top = lm.headTop[1] * 1280 - 20, size = Math.round((lm.chin[1] - lm.headTop[1]) * 1280 + 110);
const left = Math.max(0, Math.min(1024 - size, Math.round(cx - size / 2 - 20)));
const comps = [];
for (let i = 0; i < frames.length; i++) {
  const buf = await sharp(`public/art/characters/${who}/${frames[i]}.webp`).extract({ left, top: Math.max(0, Math.round(top)), width: size, height: size }).flatten({ background: '#6d6d6d' }).resize(500, 500).jpeg({ quality: 90 }).toBuffer();
  comps.push({ input: buf, left: (i % 3) * 500, top: Math.floor(i / 3) * 500 });
}
await sharp({ create: { width: 1500, height: 1500, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 88 }).toFile(out);
