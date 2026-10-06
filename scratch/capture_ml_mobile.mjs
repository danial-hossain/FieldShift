import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9368;
const profile = mkdtempSync(join(tmpdir(), 'fs-ml-mobile-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--disable-gpu',
  'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    if (targets.find(t => t.type === 'page')) break;
  } catch {}
  await sleep(200);
}

const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

const send = (method, params = {}) =>
  new Promise(r => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

const evaluate = async expr =>
  (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

const takeScreenshot = async (filePath, width = 390, height = 844) => {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await sleep(600);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(filePath, Buffer.from(shot.result.data, 'base64'));
  console.log(`Saved screenshot: ${filePath}`);
};

const artifactDir = 'C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803';

try {
  await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(3000);

  // Set device metrics to mobile first
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(500);

  // Scroll directly to .ml-yield-summary-card
  await evaluate(`(() => {
    const card = document.querySelector('.ml-yield-summary-card');
    if (card) {
      const top = card.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo(0, top);
    }
  })()`);
  await sleep(600);

  await takeScreenshot(join(artifactDir, 'ml_yield_estimate_card_focused_mobile.png'), 390, 844);
  console.log('Mobile screenshot captured successfully.');
} catch (err) {
  console.error('Error:', err);
} finally {
  ws.close();
  chrome.kill();
  process.exit(0);
}
