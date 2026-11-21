// Developer check: players, saved games, resume after a reload, music and table-talk switches.
import puppeteer from 'puppeteer-core';
const out = process.argv[2];
const browser = await puppeteer.launch({ protocolTimeout: 60000, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 810 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (code) => page.evaluate(code);
const clickText = async (text) => { const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t) && x.offsetParent !== null); if (b) b.click(); return !!b; }, text); if (!ok) errors.push('no button: ' + text); await sleep(450); };
const clickSquare = async (name) => { const p = await page.evaluate((n) => { const cols = app.board.cols; const i = (n.charCodeAt(0) - 97) + (parseInt(n.slice(1), 10) - 1) * cols; return app.stage.toPixels(app.board.pos(i, 0.08)); }, name); await page.mouse.click(p.x, p.y); await sleep(350); };
const check = (label, ok, extra = '') => console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra ? '  ' + extra : ''));
const shot = (n) => page.screenshot({ path: `${out}/p-${n}.jpg`, type: 'jpeg', quality: 80 });

await page.goto('http://localhost:5183/latrunculi/', { waitUntil: 'load' }); await sleep(4500);
check('first visit asks who is playing', await ev(`!!document.querySelector('.players')`)); await shot('1-first');
await page.type('.addrow input', 'Ben'); await clickText('Start'); await sleep(500);
check('title shows the player', await ev(`document.querySelector('.titlechips').textContent.includes('Playing: Ben')`));
await clickText('Playing: Ben'); await page.type('.addrow input', 'Clara'); await clickText('Add'); await sleep(300); await shot('2-players');
check('two players listed', await ev(`app.store.profiles.length === 2 && app.store.current.name === 'Clara'`));
await ev(`[...document.querySelectorAll('.pickme')].find(b => b.textContent.includes('Ben')).click()`); await sleep(400);
check('switched back to Ben', await ev(`app.store.current.name === 'Ben'`));
await clickText('Free play'); await sleep(500); await shot('3-setup');
check('left seat defaults to Ben', await ev(`document.querySelector('[data-player]').selectedOptions[0].textContent === 'Ben'`));
await clickText('Sit down and play'); await sleep(9000);
check('nameplate shows played by Ben', await ev(`document.querySelector('.plate.left').textContent.includes('played by Ben')`));
await clickSquare('d2'); await clickSquare('d5'); await sleep(5000);
await clickSquare('a2'); await clickSquare('a4'); await sleep(5000); await shot('4-game');
const before = await ev(`JSON.stringify({ ply: app.session.state.ply, moves: app.session.log.map(e => e.text), saves: app.store.saves.length, key: app.session.state.key })`);
check('game autosaved', JSON.parse(before).saves === 1, before.slice(0, 160));
check('music running after a click', await ev(`!!(app.music.ctx && app.music.on && app.music.ctx.state === 'running')`), await ev(`app.music.ctx ? app.music.ctx.state : 'no ctx'`));
// table talk off: nobody may speak
await clickText('Talk'); await sleep(300);
check('talk switch turns chatter off', await ev(`app.settings.talk === false && app.director.quiet === true`));
check('forced lines are silent too', await ev(`app.director.banter('win', 'maximus', { force: true }).then(v => v === false)`));
await clickText('Talk');
// reload and resume
await page.reload({ waitUntil: 'load' }); await sleep(4500);
check('no name prompt on return', await ev(`!document.querySelector('.players')`));
check('still Ben after reload', await ev(`app.store.current && app.store.current.name === 'Ben'`));
await clickText('Saved games'); await sleep(500); await shot('5-saved');
await clickText('Take it up'); await sleep(7000);
const after = await ev(`JSON.stringify({ ply: app.session.state.ply, moves: app.session.log.map(e => e.text), key: app.session.state.key })`);
check('resumed at the same position', JSON.parse(after).key === JSON.parse(before).key && JSON.parse(after).ply === JSON.parse(before).ply, after.slice(0, 140));
await shot('6-resumed');
check('take-back works after resuming', await ev(`app.session.undo() && app.session.log.length < ${JSON.parse(before).moves.length}`));
// finish a game quickly and see it filed as finished with the record updated
await ev(`app.gameFinished(app.session, 0); app.toTitle(); 0`); await sleep(500);
check('finished game filed and record kept', await ev(`app.store.saves.length === 0 && app.store.finished.length === 1 && app.store.progress().record.played === 1`), await ev(`JSON.stringify(app.store.progress().record)`));
await clickText('Saved games'); await sleep(400); await clickText('Look it over'); await sleep(6000); await shot('7-review-saved');
check('review of a saved game opens', await ev(`!!document.querySelector('.review')`));
await clickText('Close'); await sleep(800);
check('back on the saved games list', await ev(`!!document.querySelector('.list-box') && document.querySelector('.list-box').textContent.includes('Saved games')`));
// story progress is per player
await ev(`app.save.story.done.push('prologue'); app.persist(); app.store.choose(app.store.profiles.find(p => p.name === 'Clara').id); 0`);
check('Clara has her own story progress', await ev(`app.save.story.done.length === 0`));
if (errors.length) console.log('ERRORS\n' + errors.join('\n'));
await browser.close();
