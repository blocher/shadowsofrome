// Developer tool: walk the main screens at phone sizes, report anything that overflows the viewport, and save
// montages of the screenshots.   node scripts/dev/mobile.mjs <outDir> [portrait|landscape|small]
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
const [outDir, mode = 'portrait'] = process.argv.slice(2);
const SIZES = { portrait: { width: 390, height: 844 }, small: { width: 360, height: 640 }, landscape: { width: 844, height: 390 } };
const vp = { ...SIZES[mode], deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const URL0 = process.env.URL || 'http://localhost:5183/';
const browser = await puppeteer.launch({ protocolTimeout: 60000, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport(vp);
const errors = [], shots = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (code) => page.evaluate(code);
const clickText = async (text) => { const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button, a')].find((x) => x.textContent.includes(t) && x.offsetParent !== null); if (b) b.click(); return !!b; }, text); if (!ok) errors.push('no button: ' + text); await sleep(450); };
// anything visible that sticks out of the viewport, or a page that scrolls sideways
const audit = async (name) => {
  const report = await page.evaluate(() => {
    const W = window.innerWidth, H = window.innerHeight, out = [];
    const de = document.documentElement;
    if (de.scrollWidth > W + 1) out.push(`page scrolls sideways: ${de.scrollWidth} > ${W}`);
    for (const n of document.querySelectorAll('body *')) {
      if (n.closest('canvas') || n.tagName === 'CANVAS' || n.tagName === 'SCRIPT') continue;
      const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const r = n.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const label = `${n.tagName.toLowerCase()}.${String(n.className).split(' ').slice(0, 2).join('.')} "${(n.textContent || '').trim().slice(0, 24)}"`;
      const scroller = n.closest('.setup-box, .list-box, .card, .moves, .screen');
      if (!scroller && (r.right > W + 1 || r.left < -1)) out.push(`sideways ${Math.round(r.left)}..${Math.round(r.right)}: ${label}`);
      if (scroller && scroller.scrollWidth > scroller.clientWidth + 1 && n === scroller) out.push(`scroller scrolls sideways (${scroller.scrollWidth} > ${scroller.clientWidth}): ${label}`);
      if (n.matches('button, .btn, select, input') && !scroller && (r.bottom > H + 1 || r.top < -1)) out.push(`control off screen vertically ${Math.round(r.top)}..${Math.round(r.bottom)}: ${label}`);
      if (n.matches('button, .btn') && (r.height < 30 || r.width < 30) && r.top < H && r.bottom > 0) out.push(`small tap target ${Math.round(r.width)}x${Math.round(r.height)}: ${label}`);
    }
    return [...new Set(out)].slice(0, 14);
  });
  const file = `${outDir}/m-${mode}-${name}.png`;
  await page.screenshot({ path: file }); shots.push(file);
  console.log(`[${name}]` + (report.length ? '\n  ' + report.join('\n  ') : ' ok'));
};

const steps = [
  async () => { await page.goto(URL0, { waitUntil: 'load' }); await sleep(1500); await audit('hub'); },
  async () => { await page.goto(URL0 + 'latrunculi/voices.html', { waitUntil: 'load' }); await sleep(1200); await audit('voices'); },
  async () => { await page.goto(URL0 + 'latrunculi/', { waitUntil: 'load' }); await sleep(4500); await audit('title'); },
  async () => { await clickText('Free play'); await sleep(600); await audit('setup'); },
  async () => { await clickText('House rules'); await sleep(400); await ev(`document.querySelector('.setup-box').scrollTo(0, 99999)`); await sleep(300); await audit('house'); },
  async () => { await ev(`app.startGame({ rules: 'legionary', seats: [{ char: 'maximus', kind: 'human' }, { char: 'titus', kind: 'ai', level: 2 }], setting: 'cubiculum' }); 0`); await sleep(9000); await audit('game'); },
  async () => { await ev(`app.session.hint(); 0`); await sleep(2500); await audit('hint'); },
  async () => { await clickText('Rules'); await sleep(500); await audit('rules'); },
  async () => { await page.keyboard.press('Escape'); await sleep(300); await clickText('Menu'); await sleep(400); await audit('menu'); },
  async () => { await clickText('Settings'); await sleep(400); await audit('settings'); await clickText('Done'); await clickText('Back to the game'); },
  async () => { await ev(`app.freePlayOver({ winnerSeat: 0, over: { winner: 1, reason: 'pieces' }, session: app.session }); 0`); await sleep(1500); await audit('victory'); },
  async () => { await clickText('Review the game'); await sleep(5000); await audit('review'); await clickText('Close'); await sleep(600); },
  async () => { await ev(`app.openLudus(); 0`); await sleep(600); await audit('ludus'); },
  async () => { await ev(`app.openStory(); 0`); await sleep(600); await audit('storymenu'); },
  async () => { await ev(`app.settings.voice = 0; app.applySettings(); app.story.play(0); 0`); await sleep(2000); await audit('chapter'); await sleep(5200); await audit('scene'); },
  async () => { await clickText('Skip scene'); await sleep(1500); await audit('matchcard'); },
  async () => { await clickText('Just watch'); await sleep(7000); await audit('storygame'); },
  async () => { await ev(`app.startGame({ rules: 'stanway', seats: [{ char: 'aghiles', kind: 'human' }, { char: 'maximus', kind: 'ai', level: 2 }], setting: 'atrium', quietTalk: true }); 0`); await sleep(7000); await audit('stanway'); },
];
for (const [i, step] of steps.entries()) { try { await step(); } catch (e) { errors.push(`step ${i + 1} threw: ${e.message.slice(0, 120)}`); } }
if (errors.length) console.log('ERRORS\n' + errors.join('\n'));
await browser.close();
// montages, six screens to a sheet
const per = mode === 'landscape' ? 4 : 6, cols = mode === 'landscape' ? 2 : 6, tw = mode === 'landscape' ? 844 : 330, th = Math.round(tw * vp.height / vp.width);
for (let i = 0; i < shots.length; i += per) {
  const group = shots.slice(i, i + per), rows = Math.ceil(group.length / cols);
  const tiles = await Promise.all(group.map((f) => sharp(f).resize(tw, th).toBuffer()));
  await sharp({ create: { width: cols * (tw + 8), height: rows * (th + 8), channels: 3, background: '#333' } })
    .composite(tiles.map((b, k) => ({ input: b, left: (k % cols) * (tw + 8), top: Math.floor(k / cols) * (th + 8) }))).jpeg({ quality: 80 }).toFile(`${outDir}/sheet-${mode}-${i / per + 1}.jpg`);
}
console.log('sheets', Math.ceil(shots.length / per));
