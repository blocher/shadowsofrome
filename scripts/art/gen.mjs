#!/usr/bin/env node
// Image generation via the Gemini API (Nano Banana 2.1 by default).
//
//   node scripts/art/gen.mjs <id> [<id> ...] [--force] [--concurrency 3]
//   node scripts/art/gen.mjs --list
//
// Every prompt lives in scripts/art/prompts.mjs. Raw model output is cached in
// scripts/art/raw/<id>.jpg (git-ignored); the build_*.mjs scripts turn the raw
// files into the game-ready files under public/art/.
// The API key is read from GEMINI_API_KEY (environment or .env) and never printed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const RAW = path.join(HERE, 'raw');
const LOG = path.join(RAW, 'genlog.jsonl');
const DEFAULT_MODEL = 'gemini-nano-banana-2.1';

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?GEMINI_API_KEY\s*=\s*(.*)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  throw new Error('GEMINI_API_KEY is not set (environment or .env)');
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate one image.
 * @param {object} o
 * @param {string} o.prompt
 * @param {string[]} [o.refs]   reference image paths (relative to repo root or absolute), sent before the text
 * @param {string} [o.aspect]   e.g. "4:5", "16:9", "1:1"
 * @param {string} [o.size]     "1K" | "2K" | "4K"
 * @param {string} [o.model]
 * @param {string} o.out        output path; the extension is replaced to match the returned mime type
 * @param {boolean} [o.force]
 */
export async function generate({ id = '', prompt, refs = [], aspect, size, model = DEFAULT_MODEL, out, force = false }) {
  const stem = out.replace(/\.[a-z]+$/i, '');
  const existing = ['.jpg', '.png', '.webp'].map((e) => stem + e).find((p) => fs.existsSync(p));
  if (existing && !force) return { path: existing, skipped: true };

  const parts = [];
  for (const r of refs) {
    const p = path.isAbsolute(r) ? r : path.join(ROOT, r);
    parts.push({ inlineData: { mimeType: MIME[path.extname(p).toLowerCase()] || 'image/jpeg', data: fs.readFileSync(p).toString('base64') } });
  }
  parts.push({ text: prompt });
  const generationConfig = { responseModalities: ['IMAGE'] };
  if (aspect || size) generationConfig.imageConfig = { ...(aspect && { aspectRatio: aspect }), ...(size && { imageSize: size }) };
  const body = JSON.stringify({ contents: [{ parts }], generationConfig });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const key = loadKey();

  let lastErr = '';
  for (let attempt = 1; attempt <= 5; attempt++) {
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, body });
    } catch (e) {
      lastErr = `network: ${e.message}`;
      await sleep(3000 * attempt);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      lastErr = `HTTP ${res.status}`;
      await sleep(Math.min(60000, 4000 * 2 ** (attempt - 1)));
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${JSON.stringify(json.error || json).slice(0, 400)}`);
    const cand = json.candidates?.[0];
    const img = cand?.content?.parts?.find((p) => p.inlineData);
    fs.mkdirSync(RAW, { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), id, model, attempt, ok: !!img, finish: cand?.finishReason, tokens: json.usageMetadata?.totalTokenCount }) + '\n');
    if (!img) {
      lastErr = `no image (finishReason ${cand?.finishReason || json.promptFeedback?.blockReason || 'unknown'})`;
      if (attempt >= 2) break;
      continue;
    }
    const ext = img.inlineData.mimeType === 'image/png' ? '.png' : img.inlineData.mimeType === 'image/webp' ? '.webp' : '.jpg';
    fs.mkdirSync(path.dirname(stem), { recursive: true });
    for (const e of ['.jpg', '.png', '.webp']) if (fs.existsSync(stem + e)) fs.unlinkSync(stem + e);
    fs.writeFileSync(stem + ext, Buffer.from(img.inlineData.data, 'base64'));
    return { path: stem + ext, skipped: false };
  }
  throw new Error(`${id}: failed after retries: ${lastErr}`);
}

export function generationCount() {
  if (!fs.existsSync(LOG)) return 0;
  return fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).length;
}

async function main() {
  const { PROMPTS } = await import('./prompts.mjs');
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    for (const id of Object.keys(PROMPTS)) console.log(id);
    return;
  }
  const force = args.includes('--force');
  const ci = args.indexOf('--concurrency');
  const conc = ci >= 0 ? Number(args[ci + 1]) : 3;
  const ids = args.filter((a, i) => !a.startsWith('--') && !(ci >= 0 && i === ci + 1));
  const jobs = [];
  for (const id of ids) {
    if (!PROMPTS[id]) throw new Error(`unknown prompt id: ${id}`);
    jobs.push({ id, ...PROMPTS[id], out: path.join(RAW, id + '.jpg'), force });
  }
  let next = 0;
  let failed = 0;
  await Promise.all(
    Array.from({ length: Math.min(conc, jobs.length) }, async () => {
      while (next < jobs.length) {
        const job = jobs[next++];
        const t0 = Date.now();
        try {
          const r = await generate(job);
          console.log(`${r.skipped ? 'skip' : 'ok  '} ${job.id} -> ${path.relative(ROOT, r.path)} ${r.skipped ? '' : ((Date.now() - t0) / 1000).toFixed(1) + 's'}`);
        } catch (e) {
          failed++;
          console.log(`FAIL ${e.message}`);
        }
      }
    }),
  );
  console.log(`generations logged so far: ${generationCount()}`);
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
