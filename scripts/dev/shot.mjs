// Developer tool: screenshot a page of the running dev server with the locally installed Chrome (headless).
//   node scripts/dev/shot.mjs <url> <out.png> [--w 1440] [--h 810] [--wait 4000] [--js "code to run in the page"] [--js2 "..."] [--wait2 ms]
import puppeteer from 'puppeteer-core';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const [url, out] = args;
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--mute-audio', `--window-size=${opt('w', 1440)},${opt('h', 810)}`],
});
const page = await browser.newPage();
await page.setViewport({ width: +opt('w', 1440), height: +opt('h', 810), deviceScaleFactor: +opt('dpr', 1) });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
page.on('requestfailed', (r) => errors.push('failed: ' + r.url().slice(-80)));
page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url().slice(-70)); });
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await new Promise((r) => setTimeout(r, +opt('wait', 4000)));
for (const k of ['js', 'js2', 'js3']) {
  const code = opt(k, null);
  if (code) { try { const v = await page.evaluate(code); if (v !== undefined) console.log(k + ' ->', JSON.stringify(v)); } catch (e) { errors.push(k + ' threw: ' + e.message); } await new Promise((r) => setTimeout(r, +opt('wait2', 1500))); }
}
await page.screenshot({ path: out, type: out.endsWith('.jpg') ? 'jpeg' : 'png', quality: out.endsWith('.jpg') ? 85 : undefined });
if (errors.length) console.log(errors.slice(0, 12).join('\n'));
await browser.close();
