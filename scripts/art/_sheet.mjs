// quick preview grid: node scripts/art/_sheet.mjs out.jpg cellW cols file1 file2 ...
import sharp from 'sharp';
const [out, cw, cols, ...files] = process.argv.slice(2);
const W = +cw, C = +cols;
const metas = await Promise.all(files.map(f => sharp(f).metadata()));
const H = Math.round(W * metas[0].height / metas[0].width);
const rows = Math.ceil(files.length / C);
const comps = await Promise.all(files.map(async (f, i) => ({ input: await sharp(f).resize(W, H, { fit: 'contain', background: '#444' }).flatten({ background: '#777' }).jpeg().toBuffer(), left: (i % C) * W, top: Math.floor(i / C) * H })));
await sharp({ create: { width: W * C, height: H * rows, channels: 3, background: '#222' } }).composite(comps).jpeg({ quality: 85 }).toFile(out);
console.log(out, W * C, H * rows);
