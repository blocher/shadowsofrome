// local block-matching offsets between two raws + mean tone difference: node _flow.mjs a.jpg b.jpg
import sharp from 'sharp';
const [a, b] = process.argv.slice(2);
const W = 928, H = 1152;
const A = await sharp(a).greyscale().resize(W, H).raw().toBuffer(), B = await sharp(b).greyscale().resize(W, H).raw().toBuffer();
const bs = 96, R = 6;
let rows = [];
for (let by = 100; by + bs < H; by += 150) {
  let row = [];
  for (let bx = 60; bx + bs < W; bx += 150) {
    let va = 0, ma = 0; for (let y = 0; y < bs; y++) for (let x = 0; x < bs; x++) ma += A[(by + y) * W + bx + x]; ma /= bs * bs;
    for (let y = 0; y < bs; y++) for (let x = 0; x < bs; x++) va += (A[(by + y) * W + bx + x] - ma) ** 2; va = Math.sqrt(va / bs / bs);
    if (va < 8) { row.push('   .   '); continue; }
    let best = 1e18, bdx = 0, bdy = 0, mb = 0;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      let e = 0; for (let y = 0; y < bs; y += 2) for (let x = 0; x < bs; x += 2) { const d = A[(by + y) * W + bx + x] - B[(by + y + dy) * W + bx + x + dx]; e += d * d; }
      if (e < best) { best = e; bdx = dx; bdy = dy; }
    }
    for (let y = 0; y < bs; y++) for (let x = 0; x < bs; x++) mb += B[(by + y + bdy) * W + bx + x + bdx]; mb /= bs * bs;
    row.push(`${String(bdx).padStart(2)},${String(bdy).padStart(2)}|${String(Math.round(mb - ma)).padStart(3)}`);
  }
  rows.push(row.join('  '));
}
console.log(rows.join('\n'));
