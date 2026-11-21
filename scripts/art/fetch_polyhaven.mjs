#!/usr/bin/env node
// Downloads the CC0 Poly Haven assets used by the 3D scene (skips files that exist).
//   node scripts/art/fetch_polyhaven.mjs
// Asset ids and licence are recorded in docs/art.md.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './gen.mjs';

const UA = { 'User-Agent': 'art-pipeline/1.0' };
const TEXTURES = { marble: 'marble_01', wood: 'dark_wood' };
const MAPS = { Diffuse: 'diffuse', nor_gl: 'normal_gl', arm: 'arm' }; // arm = AO (R), roughness (G), metal (B)
const HDRI = 'wooden_lounge';

async function get(url, file) {
  if (fs.existsSync(file)) return console.log('skip', path.relative(ROOT, file));
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log('ok  ', path.relative(ROOT, file), (fs.statSync(file).size / 1e6).toFixed(2) + ' MB');
}

for (const [dir, id] of Object.entries(TEXTURES)) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`, { headers: UA })).json();
  for (const [map, name] of Object.entries(MAPS)) await get(files[map]['2k'].jpg.url, path.join(ROOT, 'public/art/textures', dir, `${name}.jpg`));
}
const h = await (await fetch(`https://api.polyhaven.com/files/${HDRI}`, { headers: UA })).json();
await get(h.hdri['1k'].hdr.url, path.join(ROOT, 'public/art/env/studio.hdr'));
