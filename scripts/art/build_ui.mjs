#!/usr/bin/env node
// Menu / UI art and the generated marble-slab material.
//   public/art/ui/hero.webp            2560x1440 key art
//   public/art/ui/card_<id>.webp       768x1024 character-select portraits (look frame over a painted backdrop)
//   public/art/ui/card_dux.webp
//   public/art/ui/parchment.webp       1024x1024, made tileable
//   public/art/ui/logo_mark.webp       512x512 RGBA roundel
//   public/art/textures/marble_slab/   seamless-slab alternative to the Poly Haven tile marble
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, RAW } from './gen.mjs';

const ui = path.join(ROOT, 'public/art/ui');
fs.mkdirSync(ui, { recursive: true });
const raw = (id) => path.join(RAW, id + '.jpg');
const LM = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/art/landmarks.json'), 'utf8'));
const svg = (s) => Buffer.from(s);

// ── hero ──
await sharp(raw('ui_hero_c')).resize(2560, 1440, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality: 86, effort: 5 }).toFile(path.join(ui, 'hero.webp'));

// ── cards ──
const CW = 768, CH = 1024;
const TINT = { maximus: '#3a2a4a', titus: '#5a2a12', aghiles: '#3a2c1c', dux: '#2a3320' };
async function cardBackdrop(who) {
  const tint = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}"><rect width="100%" height="100%" fill="${TINT[who]}" opacity="0.38"/></svg>`);
  const vignette = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}"><defs><radialGradient id="v" cx="50%" cy="38%" r="75%"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.78"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`);
  return sharp(raw('ui_card_bg')).resize(CW, CH, { fit: 'cover' }).modulate({ brightness: 0.9 }).composite([{ input: tint, blend: 'soft-light' }, { input: vignette }]).png().toBuffer();
}
const foot = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);

async function shadowOf(figure, blur, opacity) {
  // soft dark halo from the figure's alpha, to seat it on the backdrop
  const a = await sharp(figure).extractChannel(3).blur(blur).linear(opacity, 0).toBuffer();
  return sharp({ create: { width: CW, height: CH, channels: 3, background: '#000' } }).joinChannel(a).png().toBuffer();
}

for (const who of ['maximus', 'titus', 'aghiles']) {
  const lm = LM[who];
  const src = path.join(ROOT, 'public/art/characters', who, 'look.webp');
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, x1 = 0;
  for (let y = 0; y < info.height; y += 2) for (let x = 0; x < info.width; x += 2) if (data[(y * info.width + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  // one window size for all three, so the relative sizes of the boys survive on the cards
  const WW = 800, WH = Math.round((WW * CH) / CW);
  const faceX = ((lm.eyeL[0] + lm.eyeR[0]) / 2) * info.width;
  const cx = 0.55 * ((x0 + x1) / 2) + 0.45 * faceX;
  const left = Math.round(cx - WW / 2), top = Math.round(lm.headTop[1] * info.height - 105);
  const padded = await sharp(src).extend({ top: 200, bottom: 200, left: 200, right: 200, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const figure = await sharp(padded).extract({ left: left + 200, top: top + 200, width: WW, height: WH }).resize(CW, CH, { kernel: 'lanczos3' }).png().toBuffer();
  await sharp(await cardBackdrop(who))
    .composite([{ input: await shadowOf(figure, 18, 0.55) }, { input: figure }, { input: foot }])
    .webp({ quality: 88, effort: 5 }).toFile(path.join(ui, `card_${who}.webp`));
  console.log('card', who);
}
{
  const sprite = await sharp(path.join(ROOT, 'public/art/dux/sit.webp')).resize(700, 700).png().toBuffer();
  const figure = await sharp({ create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: sprite, left: 34, top: 215 }]).png().toBuffer();
  const ground = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}"><defs><radialGradient id="s"><stop offset="0" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="370" cy="895" rx="330" ry="46" fill="url(#s)"/></svg>`);
  await sharp(await cardBackdrop('dux'))
    .composite([{ input: ground }, { input: await shadowOf(figure, 16, 0.45) }, { input: figure }, { input: foot }])
    .webp({ quality: 88, effort: 5 }).toFile(path.join(ui, 'card_dux.webp'));
  console.log('card dux');
}

// ── parchment: make tileable by cross-fading with a half-offset copy ──
{
  const S = 1024;
  const { data: a } = await sharp(raw('ui_parchment')).resize(S, S, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // flatten large-scale brightness drift so the offset copy matches
  const out = Buffer.alloc(S * S * 3);
  const w1 = (t) => { const d = Math.min(t, S - 1 - t) / (S * 0.22); return d >= 1 ? 1 : d * d * (3 - 2 * d); };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const m = w1(x) * w1(y);
    const i = (y * S + x) * 3, j = (((y + S / 2) % S) * S + ((x + S / 2) % S)) * 3;
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(a[i + c] * m + a[j + c] * (1 - m));
  }
  await sharp(out, { raw: { width: S, height: S, channels: 3 } }).webp({ quality: 88, effort: 5 }).toFile(path.join(ui, 'parchment.webp'));
  console.log('parchment');
}

// ── logo mark: roundel cut from the emblem photo, bronze rim, soft alpha edge ──
{
  const S = 512, src = await sharp(raw('ui_logo')).metadata();
  const side = Math.round(src.width * 0.74);
  const sq = await sharp(raw('ui_logo')).extract({ left: Math.round((src.width - side) / 2), top: Math.round((src.height - side) / 2), width: side, height: side }).resize(S, S, { kernel: 'lanczos3' }).png().toBuffer();
  const mask = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><circle cx="256" cy="256" r="246" fill="#fff"/></svg>`);
  const rim = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d48a"/><stop offset="0.5" stop-color="#a8762c"/><stop offset="1" stop-color="#5e3d12"/></linearGradient><radialGradient id="in" cx="50%" cy="50%" r="50%"><stop offset="0.86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient></defs><circle cx="256" cy="256" r="246" fill="url(#in)"/><circle cx="256" cy="256" r="238" fill="none" stroke="url(#b)" stroke-width="15"/><circle cx="256" cy="256" r="246" fill="none" stroke="#3a240a" stroke-width="2"/><circle cx="256" cy="256" r="230" fill="none" stroke="#3a240a" stroke-opacity="0.7" stroke-width="1.5"/></svg>`);
  const rgb = await sharp(sq).composite([{ input: rim }]).removeAlpha().png().toBuffer();
  const alpha = await sharp(mask).extractChannel(0).blur(0.8).toBuffer();
  await sharp(rgb).joinChannel(alpha).webp({ quality: 90, alphaQuality: 100, effort: 5 }).toFile(path.join(ui, 'logo_mark.webp'));
  console.log('logo');
}

// ── board marble: one continuous slab (generated; the Poly Haven marble_01 set is a tiled wall) ──
//   textures/marble/slab.webp            albedo, evened out and brought to a mid tone
//   textures/marble/slab_normal_gl.jpg   micro relief derived from the albedo (OpenGL, +Y up)
//   textures/marble/slab_arm.jpg         AO (R), roughness (G), metal (B), same packing as Poly Haven
{
  const dir = path.join(ROOT, 'public/art/textures/marble');
  fs.mkdirSync(dir, { recursive: true });
  const S = 2048;
  const src = sharp(raw('tex_slab_a')).resize(S, S, { fit: 'cover', kernel: 'lanczos3' }).removeAlpha();
  const px = await src.clone().raw().toBuffer();
  const lowRgb = await src.clone().blur(140).raw().toBuffer();
  const st = await src.clone().stats();
  const mean = st.channels.map((c) => c.mean);
  // flatten slow drifts in tone (keeps veins and stains), then bring the slab down to a mid tone
  const TONE = 0.86, EVEN = 0.8;
  const alb = Buffer.alloc(S * S * 3);
  for (let i = 0; i < S * S; i++) for (let c = 0; c < 3; c++) {
    const flat = px[i * 3 + c] * (mean[c] / Math.max(1, lowRgb[i * 3 + c]));
    alb[i * 3 + c] = Math.max(0, Math.min(255, Math.round((px[i * 3 + c] + (flat - px[i * 3 + c]) * EVEN) * TONE)));
  }
  const base = sharp(alb, { raw: { width: S, height: S, channels: 3 } });
  await base.clone().webp({ quality: 90, effort: 5 }).toFile(path.join(dir, 'slab.webp'));
  const lum = await base.clone().greyscale().blur(1.1).raw().toBuffer();
  const low = await base.clone().greyscale().blur(6).raw().toBuffer();
  // micro height = high-pass of luminance (pits and scratches are darker = lower); veins are ignored
  const hgt = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) hgt[i] = Math.max(-40, Math.min(40, lum[i] - low[i]));
  const nrm = Buffer.alloc(S * S * 3), arm = Buffer.alloc(S * S * 3);
  const K = 0.05;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, xl = y * S + ((x + S - 1) % S), xr = y * S + ((x + 1) % S), yu = ((y + S - 1) % S) * S + x, yd = ((y + 1) % S) * S + x;
    const dx = (hgt[xr] - hgt[xl]) * K, dy = (hgt[yd] - hgt[yu]) * K;
    const nx = -dx, ny = dy, l = Math.hypot(nx, ny, 1);
    nrm[i * 3] = Math.round((nx / l * 0.5 + 0.5) * 255); nrm[i * 3 + 1] = Math.round((ny / l * 0.5 + 0.5) * 255); nrm[i * 3 + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
    const rough = 0.4 - hgt[i] * 0.012; // honed marble, rougher in pits and stains
    arm[i * 3] = Math.round(255 * Math.max(0.75, Math.min(1, 1 + hgt[i] * 0.008))); arm[i * 3 + 1] = Math.round(255 * Math.max(0.24, Math.min(0.8, rough))); arm[i * 3 + 2] = 0;
  }
  await sharp(nrm, { raw: { width: S, height: S, channels: 3 } }).jpeg({ quality: 76, chromaSubsampling: '4:4:4' }).toFile(path.join(dir, 'slab_normal_gl.jpg'));
  await sharp(arm, { raw: { width: S, height: S, channels: 3 } }).jpeg({ quality: 82 }).toFile(path.join(dir, 'slab_arm.jpg'));
  const after = await sharp(path.join(dir, 'slab.webp')).stats();
  console.log('marble slab, mean rgb', after.channels.map((c) => Math.round(c.mean)).join(','));
}

// ── story chapter plates ──
{
  const dir = path.join(ROOT, 'public/art/story');
  fs.mkdirSync(dir, { recursive: true });
  for (const id of ['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'epilogue'])
    await sharp(raw(`story_${id}`)).resize(1920, 1080, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality: 82, effort: 5 }).toFile(path.join(dir, `${id}.webp`));
  console.log('story plates');
}
