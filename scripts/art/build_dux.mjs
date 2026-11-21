#!/usr/bin/env node
// Dux sprites: public/art/dux/<pose>.webp, RGBA 768x768, plus meta.json.
// The seated poses share one transform, so they stay registered to each other (only the arms
// and face change); cheer and sleep are placed on the same ground line on their own.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { matte } from './matte.mjs';
import { ROOT, RAW } from './gen.mjs';
import { DUX_BASE, DUX_POSES } from './prompts.mjs';

const SIZE = 768, GROUND = 742;
const SEATED = ['sit', 'eat', 'point', 'steal', 'scared', 'chatter'];
const BOOST = { cheer: 1.22 }; // the model drew the standing monkey smaller than the seated one
const out = path.join(ROOT, 'public/art/dux');
fs.mkdirSync(out, { recursive: true });
const rawOf = (pose) => path.join(RAW, (pose === 'sit' ? DUX_BASE : `dux_${pose}`) + '.jpg');

function bbox(m) {
  let x0 = m.width, x1 = 0, y0 = m.height, y1 = 0;
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (m.data[(y * m.width + x) * 4 + 3] > 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, x1, y0, y1 };
}
async function place(m, s, ox, oy, file) {
  const sw = Math.round(m.width * s), sh = Math.round(m.height * s);
  const scaled = await sharp(m.data, { raw: { width: m.width, height: m.height, channels: 4 } }).resize(sw, sh, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
  const left = Math.round(ox), top = Math.round(oy);
  const ex = { left: Math.max(0, -left), top: Math.max(0, -top) };
  ex.width = Math.min(sw - ex.left, SIZE - Math.max(0, left));
  ex.height = Math.min(sh - ex.top, SIZE - Math.max(0, top));
  const piece = await sharp(scaled).extract(ex).png().toBuffer();
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: Math.max(0, left), top: Math.max(0, top) }]).webp({ quality: 88, alphaQuality: 95, effort: 5 }).toFile(file);
}

const mattes = {}, boxes = {};
for (const pose of DUX_POSES) {
  mattes[pose] = await matte(rawOf(pose), { shadowKill: true, core: 6, despill: 0.5 });
  boxes[pose] = bbox(mattes[pose]);
}
// seated group: one scale and offset from the union box
const u = SEATED.reduce((a, p) => ({ x0: Math.min(a.x0, boxes[p].x0), x1: Math.max(a.x1, boxes[p].x1), y0: Math.min(a.y0, boxes[p].y0), y1: Math.max(a.y1, boxes[p].y1) }), { x0: 1e9, x1: 0, y0: 1e9, y1: 0 });
const s = Math.min((SIZE - 40) / (u.x1 - u.x0), (GROUND - 40) / (u.y1 - u.y0));
const meta = { size: [SIZE, SIZE], groundY: GROUND / SIZE, registered: SEATED, poses: {} };
for (const pose of DUX_POSES) {
  const b = boxes[pose];
  let ps = s, ox, oy;
  if (SEATED.includes(pose)) {
    ox = SIZE / 2 - ((u.x0 + u.x1) / 2) * s; oy = GROUND - u.y1 * s;
  } else {
    ps = Math.min(s * (BOOST[pose] || 1), (SIZE - 30) / (b.x1 - b.x0), (GROUND - 20) / (b.y1 - b.y0));
    ox = SIZE / 2 - ((b.x0 + b.x1) / 2) * ps; oy = GROUND - b.y1 * ps;
  }
  await place(mattes[pose], ps, ox, oy, path.join(out, `${pose}.webp`));
  meta.poses[pose] = { box: [Math.round(b.x0 * ps + ox), Math.round(b.y0 * ps + oy), Math.round((b.x1 - b.x0) * ps), Math.round((b.y1 - b.y0) * ps)], scale: +(ps / s).toFixed(3) };
  console.log(pose, JSON.stringify(meta.poses[pose]));
}
meta.note = 'box = [x,y,w,h] of the opaque pixels. groundY is the line the feet sit on (normalised). The poses in `registered` share one transform: body and tail overlap exactly, so they can be swapped or crossfaded in place. cheer and sleep stand on the same ground line, centred.';
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
