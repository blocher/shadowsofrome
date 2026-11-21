// backdrop comparison: key each candidate, show hair crop over black and white at 100% of delivery scale ×2
import sharp from 'sharp';
import { matte } from './matte.mjs';
const out = process.argv[2];
const jobs = process.argv.slice(3).map(s => { const [file, key, l, t, sz] = s.split(','); return { file, key, l: +l, t: +t, sz: +sz }; });
const comps = [];
let i = 0;
for (const j of jobs) {
  const t0 = Date.now();
  const m = await matte(j.file, { key: j.key });
  const png = await sharp(m.data, { raw: { width: m.width, height: m.height, channels: 4 } }).extract({ left: j.l, top: j.t, width: j.sz, height: j.sz }).png().toBuffer();
  for (const [k, bgc] of [['#000000', 0], ['#ffffff', 1], ['#7a1f1f', 2]].map(([c, n]) => [n, c])) {
    comps.push({ input: await sharp(png).flatten({ background: bgc }).resize(600, 600).jpeg({ quality: 92 }).toBuffer(), left: k * 600, top: i * 600 });
  }
  console.log(j.file, j.key, 'backdrop', m.backdrop, (Date.now() - t0) + 'ms');
  i++;
}
await sharp({ create: { width: 1800, height: 600 * jobs.length, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 90 }).toFile(out);
