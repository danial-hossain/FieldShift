import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9340;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 30; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find(t => t.type === 'page')) break; } catch {}
  await sleep(200);
}
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable');
await send('Page.navigate', { url: 'http://localhost:5173/' });
await sleep(4000);

await evaluate(`document.querySelector('button[title="Account, Profile & Saved History"]').click()`);
await sleep(1000);
const heroText = await evaluate(`document.querySelector('.profile-hero-card')?.textContent`);
if (heroText && heroText.includes('Demo Sign In')) {
  await evaluate(`[...document.querySelectorAll('button')].find(b => /demo sign in/i.test(b.textContent)).click()`);
  await sleep(2000);
}
await evaluate(`[...document.querySelectorAll('.profile-nav-tab')].find(t => /history/i.test(t.textContent)).click()`);
await sleep(800);
await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 1600, deviceScaleFactor: 1, mobile: false });
await sleep(500);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync('scratch/professional_profile_history.png', Buffer.from(shot.result.data, 'base64'));
ws.close(); chrome.kill(); process.exit(0);
