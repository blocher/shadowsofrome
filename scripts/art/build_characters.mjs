#!/usr/bin/env node
// Turns the raw character renders into game frames:
//   public/art/characters/<id>/<frame>.webp   RGBA 1024x1280, all frames of a boy share one canvas
//   public/art/characters/<id>/meta.json      landmarks + registration report
//
//   node scripts/art/build_characters.mjs [maximus titus aghiles] [--only neutral]
//
// neutral is keyed and placed first; every other frame is keyed, aligned to the neutral
// raw by translation, and placed with the same transform. talk / blink / look are then
// rebuilt as "neutral + feathered patch" so they are pixel-identical to neutral outside
// the mouth / eye region (see docs/art.md).

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { matte } from './matte.mjs';
import { ROOT, RAW } from './gen.mjs';
import { BASE, FRAMES } from './prompts.mjs';

export const CANVAS = { w: 1024, h: 1280 };
// Scale from raw (1856x2304) to canvas. The raw bottom edge sits on the canvas bottom edge.
// Head sizes come out roughly Maximus 0.94 : Titus 1 : Aghiles 1.08 and the seated height and
// shoulder width differ much more, so the big lad fills the frame and the small one does not.
export const PLACE = {
  maximus: { scale: 0.495 },
  titus: { scale: 0.525, darkHair: true },
  aghiles: { scale: 0.57, darkHair: true },
};
const LANDMARKS = JSON.parse(fs.existsSync(path.join(ROOT, 'scripts/art/landmarks.json')) ? fs.readFileSync(path.join(ROOT, 'scripts/art/landmarks.json'), 'utf8') : '{}');
const SEAM_MAX = 16;
let seamVal;
const OUT = (who) => path.join(ROOT, 'public/art/characters', who);
const rawOf = (who, frame) => path.join(RAW, (frame === 'neutral' ? BASE[who] : `${who}_${frame}`) + '.jpg');

function bbox(m) {
  let x0 = m.width, x1 = 0, y0 = m.height, y1 = 0;
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) if (m.data[(y * m.width + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, x1, y0, y1 };
}

// Shift a raw-size RGBA by whole raw pixels (keeps sub-canvas-pixel precision after scaling).
async function shiftRaw(m, dx, dy) {
  if (!dx && !dy) return m;
  const ex = { left: Math.max(0, -dx), top: Math.max(0, -dy), width: m.width - Math.abs(dx), height: m.height - Math.abs(dy) };
  const piece = await sharp(m.data, { raw: { width: m.width, height: m.height, channels: 4 } }).extract(ex).png().toBuffer();
  const data = await sharp({ create: { width: m.width, height: m.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: Math.max(0, dx), top: Math.max(0, dy) }]).raw().toBuffer();
  return { ...m, data };
}

// Place a full-res straight-alpha RGBA on the canvas: scale, then offset (ox, oy in canvas px).
async function place(m, scale, ox, oy) {
  const sw = Math.round(m.width * scale), sh = Math.round(m.height * scale);
  const scaled = await sharp(m.data, { raw: { width: m.width, height: m.height, channels: 4 } }).resize(sw, sh, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer();
  // crop / pad into the canvas
  const left = Math.round(ox), top = Math.round(oy);
  const ex = { left: Math.max(0, -left), top: Math.max(0, -top) };
  ex.width = Math.min(sw - ex.left, CANVAS.w - Math.max(0, left));
  ex.height = Math.min(sh - ex.top, CANVAS.h - Math.max(0, top));
  const piece = await sharp(scaled).extract(ex).png().toBuffer();
  return sharp({ create: { width: CANVAS.w, height: CANVAS.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: Math.max(0, left), top: Math.max(0, top) }]).raw().toBuffer();
}

async function grey(file, w, h) {
  return sharp(file).removeAlpha().greyscale().resize(w, h, { fit: 'fill' }).raw().toBuffer();
}

// Translation (in raw px) that best maps frame onto neutral, measured on the torso / shoulders /
// hair outline and ignoring the face box, which is meant to change.
// With `only` = {x0,y0,x1,y1, hole:{cx,cy,rx,ry}} the measurement is restricted to that box minus
// the elliptical hole: used to follow the head when the model bobbed it during talk / blink.
async function align(neutralFile, frameFile, faceBoxRaw, rawW, rawH, only = null, start = { dx: 0, dy: 0 }) {
  const best = { dx: 0, dy: 0 };
  let range = only ? 4 : 12, cx = start.dx, cy = start.dy;
  for (const f of only ? [4, 2, 1] : [8, 4, 2]) {
    const w = Math.round(rawW / f), h = Math.round(rawH / f);
    const A = await grey(neutralFile, w, h), B = await grey(frameFile, w, h);
    let bestErr = Infinity, bx = 0, by = 0;
    const c0x = Math.round(cx / f), c0y = Math.round(cy / f);
    for (let dy = c0y - range; dy <= c0y + range; dy++) {
      for (let dx = c0x - range; dx <= c0x + range; dx++) {
        let err = 0, cnt = 0;
        const st = only ? 1 : 2;
        for (let y = 8; y < h - 8; y += st) {
          const yy = y - dy;
          if (yy < 0 || yy >= h) continue;
          for (let x = 8; x < w - 8; x += st) {
            const xr = x * f, yr = y * f;
            if (faceBoxRaw && xr > faceBoxRaw.x0 && xr < faceBoxRaw.x1 && yr > faceBoxRaw.y0 && yr < faceBoxRaw.y1) continue;
            if (only) {
              if (xr < only.x0 || xr > only.x1 || yr < only.y0 || yr > only.y1) continue;
              const h0 = only.hole;
              if (h0 && ((xr - h0.cx) / h0.rx) ** 2 + ((yr - h0.cy) / h0.ry) ** 2 < 1) continue;
            }
            const xx = x - dx;
            if (xx < 0 || xx >= w) continue;
            const d = A[y * w + x] - B[yy * w + xx];
            err += d * d; cnt++;
          }
        }
        err /= cnt || 1;
        if (err < bestErr) { bestErr = err; bx = dx; by = dy; }
      }
    }
    cx = bx * f; cy = by * f; range = 3;
    best.dx = cx; best.dy = cy; best.err = Math.sqrt(bestErr);
  }
  return best; // neutral(x,y) ~ frame(x-dx, y-dy)  => shift the frame by (+dx,+dy)
}

function ellipseMask(w, h, cx, cy, rx, ry, feather) {
  const m = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2);
    const t = (1 - d) / feather; // 0 at the rim, 1 inside by `feather`
    m[y * w + x] = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  }
  return m;
}

function patchBlend(neutral, frame, mask) {
  const out = Buffer.from(neutral);
  for (let i = 0; i < mask.length; i++) {
    const t = mask[i];
    if (t <= 0) continue;
    // blend premultiplied so half-transparent edge pixels stay clean
    const an = neutral[i * 4 + 3] / 255, af = frame[i * 4 + 3] / 255;
    const a = an + (af - an) * t;
    for (let c = 0; c < 3; c++) {
      const pm = neutral[i * 4 + c] * an * (1 - t) + frame[i * 4 + c] * af * t;
      out[i * 4 + c] = a > 0 ? Math.round(pm / a) : 0;
    }
    out[i * 4 + 3] = Math.round(a * 255);
  }
  return out;
}

function diffStats(a, b, w, h, box) {
  let sum = 0, n = 0, x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]), Math.abs(a[i + 3] - b[i + 3]));
    if (a[i + 3] > 8 || b[i + 3] > 8) { sum += d; n++; }
    if (d > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return { mean: +(sum / n).toFixed(2), box: x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1] };
}

const webp = (buf, file) => sharp(buf, { raw: { width: CANVAS.w, height: CANVAS.h, channels: 4 } }).webp({ quality: 88, alphaQuality: 95, effort: 5 }).toFile(file);

async function buildOne(who, only) {
  fs.mkdirSync(OUT(who), { recursive: true });
  const s = PLACE[who].scale;
  // dark-haired boys: firmer despill from the chin up (needs landmarks, so a first pass runs without)
  let mopt = {};
  if (PLACE[who].darkHair && LANDMARKS[who]) {
    const oy0 = CANVAS.h - 2304 * s;
    mopt = { avgDespillAbove: Math.round((LANDMARKS[who].chin[1] * CANVAS.h - oy0) / s) };
  }
  const nm = await matte(rawOf(who, 'neutral'), mopt);
  const bb = bbox(nm);
  const ox = Math.round(CANVAS.w / 2 - ((bb.x0 + bb.x1) / 2) * s + (PLACE[who].dx || 0));
  const oy = Math.round(CANVAS.h - nm.height * s);
  const neutral = await place(nm, s, ox, oy);
  await webp(neutral, path.join(OUT(who), 'neutral.webp'));
  console.log(who, 'neutral placed: scale', s, 'offset', ox, oy, 'headTop y', Math.round(bb.y0 * s + oy), 'figure width', Math.round((bb.x1 - bb.x0) * s));
  if (only === 'neutral') return;

  const lm = LANDMARKS[who];
  if (!lm) throw new Error(`no landmarks for ${who} in scripts/art/landmarks.json`);
  const P = (k) => [lm[k][0] * CANVAS.w, lm[k][1] * CANVAS.h];
  const toRaw = ([x, y]) => [(x - ox) / s, (y - oy) / s];
  const [elx, ely] = P('eyeL'), [erx, ery] = P('eyeR'), [mx, my] = P('mouth'), [hx, hy] = P('headTop'), [cx, cy] = P('chin');
  const eyeDist = Math.hypot(erx - elx, ery - ely);
  const faceH = cy - hy;
  // face box in raw px, ignored while aligning
  const [fx0, fy0] = toRaw([Math.min(elx, erx) - eyeDist * 1.1, Math.min(ely, ery) - eyeDist * 0.9]);
  const [fx1, fy1] = toRaw([Math.max(elx, erx) + eyeDist * 1.0, cy + eyeDist * 0.4]);
  const faceBox = { x0: fx0, y0: fy0, x1: fx1, y1: fy1 };

  const report = {};
  for (const frame of FRAMES) {
    if (frame === 'neutral') continue;
    const file = rawOf(who, frame);
    if (!fs.existsSync(file)) { console.log(who, frame, 'MISSING raw'); continue; }
    const al = await align(rawOf(who, 'neutral'), file, faceBox, nm.width, nm.height);
    const fm = await matte(file, mopt);
    let placed = await place(await shiftRaw(fm, al.dx, al.dy), s, ox, oy);
    const whole = diffStats(neutral, placed, CANVAS.w, CANVAS.h);
    let mode = 'full-frame';
    seamVal = undefined;
    let headShift = null;
    if (frame === 'talk' || frame === 'blink' || frame === 'look') {
      const E = frame === 'talk'
        ? { cx: mx + eyeDist * 0.05, cy: my + (cy - my) * 0.35, rx: eyeDist * 1.15, ry: (cy - my) * 1.25 + eyeDist * 0.35, f: 0.45 }
        : { cx: (elx + erx) / 2, cy: (ely + ery) / 2, rx: eyeDist * 1.25, ry: eyeDist * 0.5, f: 0.5 };
      // follow the head: re-measure the offset on the face around (not inside) the patch
      const [hcx, hcy] = toRaw([E.cx, E.cy]);
      const only = { x0: fx0, y0: toRaw([0, hy + faceH * 0.3])[1], x1: fx1, y1: fy1, hole: { cx: hcx, cy: hcy, rx: (E.rx * (1 - E.f * 0.6)) / s, ry: (E.ry * (1 - E.f * 0.6)) / s } };
      const loc = await align(rawOf(who, 'neutral'), file, null, nm.width, nm.height, only, al);
      headShift = [+((loc.dx - al.dx) * s).toFixed(1), +((loc.dy - al.dy) * s).toFixed(1)];
      const local = await place(await shiftRaw(fm, loc.dx, loc.dy), s, ox, oy);
      const mask = ellipseMask(CANVAS.w, CANVAS.h, E.cx, E.cy, E.rx, E.ry, E.f);
      const full = placed;
      placed = local;
      // seam = how different the edit is from neutral in the feather ring; a big value means the
      // model moved the head, so a patch would ghost and the whole frame is used instead
      let seam = 0, sn = 0;
      for (let i = 0; i < mask.length; i++) if (mask[i] > 0.03 && mask[i] < 0.45 && neutral[i * 4 + 3] > 200) {
        seam += (Math.abs(neutral[i * 4] - placed[i * 4]) + Math.abs(neutral[i * 4 + 1] - placed[i * 4 + 1]) + Math.abs(neutral[i * 4 + 2] - placed[i * 4 + 2])) / 3; sn++;
      }
      seam /= sn || 1;
      seamVal = +seam.toFixed(2);
      if (seam < SEAM_MAX) { placed = patchBlend(neutral, placed, mask); mode = 'patch'; } else placed = full;
    }
    await webp(placed, path.join(OUT(who), `${frame}.webp`));
    const after = diffStats(neutral, placed, CANVAS.w, CANVAS.h);
    report[frame] = {
      mode,
      // translation applied to bring the model's edit back onto neutral, in canvas px
      offsetPx: [+(al.dx * s).toFixed(1), +(al.dy * s).toFixed(1)],
      residual: +al.err.toFixed(2),
      ...(seamVal !== undefined && { seam: seamVal, headShiftPx: headShift }),
      meanDiffBeforePatch: whole.mean,
      changedRect: after.box,
    };
    console.log(who, frame, JSON.stringify(report[frame]));
  }

  const meta = {
    id: who,
    canvas: [CANVAS.w, CANVAS.h],
    scaleHint: { maximus: 0.9, titus: 1.0, aghiles: 1.18 }[who],
    hiddenBelow: 0.85,
    eyeL: lm.eyeL, eyeR: lm.eyeR, mouth: lm.mouth, headTop: lm.headTop, chin: lm.chin,
    note: 'eyeL, eyeR, mouth, headTop and chin are normalised [x,y] on the neutral frame; eyeL/eyeR are the left/right eye as seen in the image. talk, blink and look are neutral plus a feathered patch (pixel-identical elsewhere): draw them as overlays or hard swaps. The other expressions are full re-renders aligned by translation: crossfade them (150-250 ms).',
    frames: FRAMES,
    registrationNote: 'offsetPx = whole-frame shift that was applied to put the edit back on neutral (canvas px; 0 means the model kept the framing). headShiftPx = extra shift of the head alone that the patch follows. residual / seam = remaining RMS / mean difference (0-255) outside the changed feature. changedRect = [x,y,w,h] of the pixels that differ from neutral.',
    registration: report,
  };
  fs.writeFileSync(path.join(OUT(who), 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
}

const args = process.argv.slice(2);
const oi = args.indexOf('--only');
const only = oi >= 0 ? args[oi + 1] : null;
const who = args.filter((a, i) => !a.startsWith('--') && i !== oi + 1);
for (const w of who.length ? who : Object.keys(PLACE)) await buildOne(w, only);
