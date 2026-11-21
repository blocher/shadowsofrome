// Chroma-key matting with sharp: soft alpha, foreground un-mixing, despill and
// edge colour extension. Works on the flat (but never perfectly uniform) studio
// backdrops the image model produces.
//
//   import { matte } from './matte.mjs'
//   const { data, width, height } = await matte('raw.jpg', { key: 'green' })   // straight-alpha RGBA
//
// key: 'green' (default) | 'magenta' | 'grey' (colour-distance key, only for comparison).

import sharp from 'sharp';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function keyValue(key, r, g, b) {
  if (key === 'magenta') return Math.min(r, b) - g;
  return g - Math.max(r, b); // green
}

async function blurGrey(buf, w, h, sigma) {
  return sharp(buf, { raw: { width: w, height: h, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
}

// Fill unknown (weight 0) cells of a small RGB field by repeated normalised averaging.
function fillField(rgb, wgt, w, h) {
  const out = Float32Array.from(rgb);
  const wt = Float32Array.from(wgt);
  for (let pass = 0; pass < 400; pass++) {
    let holes = 0;
    const nOut = Float32Array.from(out);
    const nWt = Float32Array.from(wt);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (wt[i] > 0) continue;
        let s = 0, r = 0, g = 0, b = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const j = yy * w + xx;
            if (wt[j] > 0) { s++; r += out[j * 3]; g += out[j * 3 + 1]; b += out[j * 3 + 2]; }
          }
        }
        if (s > 0) { nOut[i * 3] = r / s; nOut[i * 3 + 1] = g / s; nOut[i * 3 + 2] = b / s; nWt[i] = 1; } else holes++;
      }
    }
    out.set(nOut); wt.set(nWt);
    if (!holes) break;
  }
  return out;
}

/**
 * @param {string|Buffer} input
 * @param {object} [o]
 * @param {'green'|'magenta'|'grey'} [o.key]
 * @param {number} [o.lo]  alpha_raw below this -> 0  (noise floor of the backdrop)
 * @param {number} [o.hi]  alpha_raw above this -> 1
 * @param {number} [o.core] radius (px) of the erosion that forces the interior opaque
 * @param {number} [o.choke] extra sub-pixel edge choke, 0..1
 */
export async function matte(input, o = {}) {
  // avgDespillAbove: raw-pixel row above which green is limited to the R/B average (dark hair that
  // picked up green reflections); leave unset for blond hair or gold, which it would redden.
  // despill: 0..1 minimum despill strength everywhere (0.5 suits cream / gold fur).
  // shadowKill: also key on green *purity*, which a cast shadow on the backdrop keeps, so contact
  // shadows under an animal vanish instead of becoming a dark translucent smear.
  const { key = 'green', lo = 0.14, hi = 0.86, core = 7, choke = 0.0, avgDespillAbove = 0, shadowKill = false, despill = 0 } = o;
  const { data: src, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;

  // 1. backdrop colour from the border, then a "certainly backdrop" mask
  const border = [];
  for (let x = 0; x < w; x += 4) for (const y of [2, 12]) border.push(y * w + x);
  for (let y = 0; y < Math.floor(h * 0.6); y += 4) for (const x of [2, 12, w - 3, w - 13]) border.push(y * w + x);
  const med = (arr) => arr.sort((a, b) => a - b)[arr.length >> 1];
  const bR = med(border.map((i) => src[i * 3])), bG = med(border.map((i) => src[i * 3 + 1])), bB = med(border.map((i) => src[i * 3 + 2]));
  const kBorder = key === 'grey' ? 0 : keyValue(key, bR, bG, bB);

  const sure = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = src[i * 3], g = src[i * 3 + 1], b = src[i * 3 + 2];
    if (key === 'grey') {
      const d = Math.abs(r - bR) + Math.abs(g - bG) + Math.abs(b - bB);
      sure[i] = d < 26 ? 255 : 0;
    } else {
      sure[i] = keyValue(key, r, g, b) > 0.62 * kBorder ? 255 : 0;
    }
  }
  // erode the sure mask a little so edge pixels never pollute the backdrop estimate
  const sureBlur = await blurGrey(Buffer.from(sure), w, h, 4);
  for (let i = 0; i < n; i++) sure[i] = sureBlur[i] > 250 ? 255 : 0;

  // 2. smooth backdrop colour field B(x,y): masked average at 1/16 res, hole-filled, upsampled
  const F = 16, lw = Math.ceil(w / F), lh = Math.ceil(h / F);
  const acc = new Float32Array(lw * lh * 3), cnt = new Float32Array(lw * lh);
  for (let y = 0; y < h; y++) {
    const ly = (y / F) | 0;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!sure[i]) continue;
      const j = ly * lw + ((x / F) | 0);
      acc[j * 3] += src[i * 3]; acc[j * 3 + 1] += src[i * 3 + 1]; acc[j * 3 + 2] += src[i * 3 + 2]; cnt[j]++;
    }
  }
  const wgt = new Float32Array(lw * lh);
  for (let j = 0; j < lw * lh; j++) {
    if (cnt[j] >= F * F * 0.5) { acc[j * 3] /= cnt[j]; acc[j * 3 + 1] /= cnt[j]; acc[j * 3 + 2] /= cnt[j]; wgt[j] = 1; } else { acc[j * 3] = acc[j * 3 + 1] = acc[j * 3 + 2] = 0; }
  }
  const filled = fillField(acc, wgt, lw, lh);
  const lowBuf = Buffer.alloc(lw * lh * 3);
  for (let j = 0; j < lw * lh * 3; j++) lowBuf[j] = Math.round(filled[j]);
  const bg = await sharp(lowBuf, { raw: { width: lw, height: lh, channels: 3 } }).blur(2).resize(w, h, { kernel: 'cubic', fit: 'fill' }).raw().toBuffer();

  // 3. raw alpha
  const aRaw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = src[i * 3], g = src[i * 3 + 1], b = src[i * 3 + 2];
    const br = bg[i * 3], bgg = bg[i * 3 + 1], bb = bg[i * 3 + 2];
    let a;
    if (key === 'grey') {
      const d = Math.sqrt((r - br) ** 2 + (g - bgg) ** 2 + (b - bb) ** 2);
      a = d / 70;
    } else {
      const kb = Math.max(20, keyValue(key, br, bgg, bb));
      const kv = keyValue(key, r, g, b);
      a = 1 - kv / kb;
      if (shadowKill && key === 'green') {
        const pb = kb / Math.max(bgg, 24), p = kv / Math.max(g, 24);
        a = Math.min(a, 1 - p / pb);
      }
    }
    aRaw[i] = clamp01((a - lo) / (hi - lo));
  }

  // 4. interior core: anything well inside the subject is fully opaque
  const hard = Buffer.alloc(n);
  for (let i = 0; i < n; i++) hard[i] = aRaw[i] > 0.5 ? 255 : 0;
  const hb = await blurGrey(hard, w, h, core);
  const coreMask = Buffer.alloc(n);
  for (let i = 0; i < n; i++) coreMask[i] = hb[i] > 247 ? 255 : 0;
  const coreSoft = await blurGrey(coreMask, w, h, 1.2);

  // 5. drop islands that are not attached to the main subject (specks in the backdrop)
  const keep = await keepMainBody(hard, w, h);

  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let a = Math.max(aRaw[i], coreSoft[i] / 255);
    if (choke > 0) a = clamp01((a - choke) / (1 - choke));
    alpha[i] = a * (keep[i] / 255);
  }

  // 6. un-mix the foreground colour and despill
  const fg = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // un-mix with the keyed alpha, not the final one: thin hair that the core mask makes opaque
    // must still lose the backdrop that shows through it
    const a = alpha[i] > 0 ? aRaw[i] : 0;
    let r = src[i * 3], g = src[i * 3 + 1], b = src[i * 3 + 2];
    if (a > 0.02 && a < 0.999) {
      const ia = 1 / Math.max(a, 0.25);
      r = (r - (1 - a) * bg[i * 3]) * ia + 0; g = (g - (1 - a) * bg[i * 3 + 1]) * ia; b = (b - (1 - a) * bg[i * 3 + 2]) * ia;
      r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
    }
    if (key === 'green') {
      // interior: only clamp true green dominance; edge band: a firmer limit halfway to the R/B average
      // and wherever green actually dominates (spill the model painted into hair), limit to the average
      const mx = Math.max(r, b), band = 1 - coreSoft[i] / 255;
      const sk = clamp01((g - mx + 10) / 25);
      const strong = i < avgDespillAbove * w ? 0.85 : 0;
      const lim = mx - Math.max(sk, band * 0.5, strong, despill) * (mx - (r + b) / 2);
      if (g > lim) g = lim;
    } else if (key === 'magenta') {
      // magenta spill: red and blue both exceed green; pull the smaller of them down to green
      const m = Math.min(r, b);
      if (m > g) { const d = m - g; r -= d * (r <= b ? 1 : 0.6); b -= d * (b <= r ? 1 : 0.6); }
    }
    fg[i * 3] = r; fg[i * 3 + 1] = g; fg[i * 3 + 2] = b;
  }

  // 7. edge colour extension: thin, low-alpha edge pixels borrow colour from the solid interior
  const wBuf = Buffer.alloc(n), cBuf = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    const s = aRaw[i] > 0.985 && alpha[i] > 0.985 ? 1 : 0;
    wBuf[i] = s * 255;
    cBuf[i * 3] = s * fg[i * 3]; cBuf[i * 3 + 1] = s * fg[i * 3 + 1]; cBuf[i * 3 + 2] = s * fg[i * 3 + 2];
  }
  // two radii: a tight one for ordinary edges, a wide one that reaches out along wisps of hair
  const wB1 = await blurGrey(wBuf, w, h, 4);
  const cB1 = await sharp(cBuf, { raw: { width: w, height: h, channels: 3 } }).blur(4).raw().toBuffer();
  const wB2 = await blurGrey(wBuf, w, h, 16);
  const cB2 = await sharp(cBuf, { raw: { width: w, height: h, channels: 3 } }).blur(16).raw().toBuffer();

  const out = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const a = Math.min(alpha[i], aRaw[i]);
    let r = fg[i * 3], g = fg[i * 3 + 1], b = fg[i * 3 + 2];
    if (a < 0.985 && alpha[i] > 0 && (wB1[i] > 10 || wB2[i] > 2)) {
      const near = wB1[i] > 10;
      const wv = near ? wB1[i] : wB2[i], cv = near ? cB1 : cB2;
      const k = 255 / wv;
      const er = Math.min(255, cv[i * 3] * k), eg = Math.min(255, cv[i * 3 + 1] * k), eb = Math.min(255, cv[i * 3 + 2] * k);
      // t = how much we trust the un-mixed colour (high alpha) versus the extended interior colour
      const t = clamp01((a - 0.55) / 0.42);
      r = er + (r - er) * t; g = eg + (g - eg) * t; b = eb + (b - eb) * t;
    }
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = Math.round(alpha[i] * 255);
  }
  return { data: out, width: w, height: h, backdrop: [bR, bG, bB] };
}

// Keep the largest connected blob (plus anything near it); returns a soft 0..255 mask.
async function keepMainBody(hard, w, h) {
  const F = 4, lw = Math.ceil(w / F), lh = Math.ceil(h / F);
  const low = await sharp(hard, { raw: { width: w, height: h, channels: 1 } }).resize(lw, lh, { fit: 'fill', kernel: 'linear' }).extractChannel(0).raw().toBuffer();
  const lab = new Int32Array(lw * lh);
  const sizes = [0];
  const stack = [];
  for (let s = 0; s < lw * lh; s++) {
    if (low[s] < 40 || lab[s]) continue;
    const id = sizes.length; let size = 0;
    stack.push(s); lab[s] = id;
    while (stack.length) {
      const p = stack.pop(); size++;
      const x = p % lw, y = (p / lw) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= lw || yy >= lh) continue;
        const q = yy * lw + xx;
        if (low[q] >= 40 && !lab[q]) { lab[q] = id; stack.push(q); }
      }
    }
    sizes.push(size);
  }
  let best = 1;
  for (let i = 2; i < sizes.length; i++) if (sizes[i] > sizes[best]) best = i;
  const m = Buffer.alloc(lw * lh);
  // keep the main blob and any blob at least 2% of its size (e.g. a hand separated by the frame edge)
  for (let i = 0; i < lw * lh; i++) m[i] = lab[i] && (lab[i] === best || sizes[lab[i]] > sizes[best] * 0.02) ? 255 : 0;
  // grow generously so wisps of hair near the body survive
  const grown = await sharp(m, { raw: { width: lw, height: lh, channels: 1 } }).blur(10).linear(12, 0).resize(w, h, { fit: 'fill', kernel: 'linear' }).extractChannel(0).raw().toBuffer();
  return grown;
}

export async function toPng(m, file) {
  await sharp(m.data, { raw: { width: m.width, height: m.height, channels: 4 } }).png({ compressionLevel: 6 }).toFile(file);
}
