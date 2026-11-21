#!/usr/bin/env node
// Rebuild every game-ready file under public/art from the cached raw renders (no API calls).
// To regenerate a raw render first: node scripts/art/gen.mjs <id> --force
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
for (const s of ['build_characters', 'build_dux', 'build_backgrounds', 'fetch_polyhaven', 'build_ui', 'build_manifest']) {
  console.log(`\n== ${s} ==`);
  const r = spawnSync(process.execPath, [path.join(here, s + '.mjs')], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
