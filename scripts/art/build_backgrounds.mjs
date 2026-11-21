#!/usr/bin/env node
// Backgrounds: public/art/backgrounds/<id>.webp (2560x1440) and <id>_env.webp (1024x512, blurred,
// horizontally seamless "equirect-ish" reflection map made by mirroring the plate).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, RAW } from './gen.mjs';

const SRC = { cubiculum: 'bg_cubiculum', colosseum: 'bg_colosseum', atrium: 'bg_atrium_monkey' };
const out = path.join(ROOT, 'public/art/backgrounds');
fs.mkdirSync(out, { recursive: true });
for (const [id, raw] of Object.entries(SRC)) {
  const src = path.join(RAW, raw + '.jpg');
  await sharp(src).resize(2560, 1440, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality: 90, effort: 5 }).toFile(path.join(out, `${id}.webp`));
  // env: [plate | mirrored plate] wraps without a seam; squash to 2:1 and blur
  const half = await sharp(src).resize(512, 512, { fit: 'fill' }).toBuffer();
  const flip = await sharp(half).flop().toBuffer();
  await sharp({ create: { width: 1024, height: 512, channels: 3, background: '#000' } })
    .composite([{ input: half, left: 0, top: 0 }, { input: flip, left: 512, top: 0 }])
    .png().toBuffer()
    .then((b) => sharp(b).blur(7).webp({ quality: 80 }).toFile(path.join(out, `${id}_env.webp`)));
  console.log(id, 'ok');
}
