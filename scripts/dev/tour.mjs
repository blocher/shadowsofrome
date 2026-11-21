// Developer tool: drive the running dev server through its main screens with real clicks and save screenshots.
//   node scripts/dev/tour.mjs <outDir> [step,step,...]     steps: title setup play hint review ludus lesson story mobile
import puppeteer from 'puppeteer-core';
const [outDir, which] = process.argv.slice(2);
const steps = (which || 'title,setup,play,hint,review,ludus,lesson,story').split(',');
const URL0 = process.env.URL || 'http://localhost:5183/latrunculi/';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 810 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 4).join('\n')));
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => { await page.screenshot({ path: `${outDir}/${name}.jpg`, type: 'jpeg', quality: 82 }); console.log('saved', name); };
const ev = (code) => page.evaluate(code);
const clickText = async (text) => { const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t) && x.offsetParent !== null); if (b) b.click(); return !!b; }, text); if (!ok) errors.push('no button: ' + text); await sleep(400); };
const clickSquare = async (name) => { const p = await page.evaluate((n) => { const s = app.session ? app.session.state : null; const cols = app.board.cols; const i = (n.charCodeAt(0) - 97) + (parseInt(n.slice(1), 10) - 1) * cols; const v = app.board.pos(i, 0.08); return app.stage.toPixels(v); }, name); await page.mouse.click(p.x, p.y); await sleep(350); };

await page.goto(URL0, { waitUntil: 'load' }); await sleep(4500);
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Play as a guest')); if (b) b.click(); }); await sleep(400);
for (const step of steps) {
  try {
    if (step === 'title') await shot('01-title');
    if (step === 'setup') { await clickText('Free play'); await sleep(600); await shot('02-setup'); await clickText('House rules'); await sleep(400); await shot('03-house'); await clickText('Legionary'); }
    if (step === 'play') {
      await ev(`app.ui.setup()`); await sleep(300);
      await clickText('Sit down and play'); await sleep(9000);
      await shot('04-play-start');
      await clickSquare('d2'); await shot('05-selected');
      await clickSquare('d5'); await sleep(5000); await shot('06-after-move');
      console.log('state', JSON.stringify(await ev(`({ply: app.session.state.ply, turn: app.session.state.turn, log: app.session.log.map(e=>e.text)})`)));
    }
    if (step === 'hint') { await sleep(3000); await clickText('Hint'); await sleep(2500); await clickText('Hint'); await sleep(800); await clickText('Hint'); await sleep(1200); await shot('07-hint'); await clickText('Danger'); await clickText('Rules'); await sleep(500); await shot('08-rules'); await page.keyboard.press('Escape'); await sleep(300); }
    if (step === 'review') {
      // finish quickly: let two AIs play it out at speed, then open the review
      await ev(`app.startGame({ rules: 'legionary', seats: [{ char: 'maximus', kind: 'ai', level: 1 }, { char: 'aghiles', kind: 'ai', level: 3 }], setting: 'colosseum', quietTalk: true, speed: 4 }).then(() => { app.stage.timeScale = 6; })`);
      for (let i = 0; i < 90; i++) { await sleep(2000); if (await ev(`!!(app.session && app.session.state.over)`)) break; }
      await sleep(3500); await shot('09-victory');
      console.log('over', JSON.stringify(await ev(`({over: app.session && app.session.state.over, plies: app.session && app.session.log.length})`)));
      await clickText('Review the game'); await sleep(14000); await shot('10-review');
      await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await sleep(600); await shot('11-review-step');
      await clickText('Close'); await sleep(800);
    }
    if (step === 'ludus') { await ev(`app.openLudus()`); await sleep(700); await shot('12-ludus'); }
    if (step === 'lesson') {
      await ev(`app.settings.voice = 0; app.applySettings(); app.ludus.lesson('capture'); 0`); await sleep(2500);
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Space'); await sleep(450); }
      await sleep(1500); await shot('13-lesson');
      await clickSquare('d2'); await clickSquare('d4'); await sleep(2500);
      for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await sleep(450); }
      await shot('14-lesson-right');
    }
    if (step === 'story') {
      await ev(`app.openStory()`); await sleep(700); await shot('15-story-menu');
      await clickText('Begin'); await sleep(3600); await shot('16-story-scene');
      await clickText('Skip scene'); await sleep(1500); await shot('17-matchcard');
      await clickText('Just watch'); await sleep(8000); await shot('18-story-match');
    }
    if (step === 'problem') {
      await ev(`app.settings.voice = 0; app.applySettings(); app.story.play(1); 0`); await sleep(1500); await shot('20-chapter-plate');
      await sleep(5000); await clickText('Skip scene'); await sleep(6000); await shot('21-problem');
      await clickSquare('d1'); await clickSquare('d4'); await sleep(4000); await shot('22-problem-solved');
      console.log('after', JSON.stringify(await ev(`({mode: app.mode, captured: app.session ? app.session.state.captured : null, lines: [...document.querySelectorAll('.bubble')].map(n => n.textContent.slice(0, 80))})`)));
      await clickText('Skip scene'); await sleep(1500); await clickText('Skip scene'); await sleep(2500); await shot('23-chapter-end');
    }
    if (step === 'mobile') { await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 }); await ev(`app.startGame({ rules: 'legionary', seats: [{ char: 'maximus', kind: 'human' }, { char: 'titus', kind: 'ai', level: 2 }], setting: 'atrium', quietTalk: true })`); await sleep(7000); await shot('19-mobile'); await page.setViewport({ width: 1440, height: 810 }); }
  } catch (e) { errors.push(`step ${step} threw: ${e.message}`); }
}
if (errors.length) console.log('ERRORS\n' + errors.slice(0, 20).join('\n'));
await browser.close();
