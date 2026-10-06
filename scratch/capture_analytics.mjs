import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9358;
const chrome = spawn(CHROME, ['--headless=new', '--window-size=1400,1000', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
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
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2000);

  // Sign in as Dani
  await send('Runtime.evaluate', {
    expression: `fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'danialhossain2022@gmail.com', password: '12345678' })
    }).then(r => r.json())`,
    awaitPromise: true,
    returnByValue: true
  });

  // Reload
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(3000);

  // Click on Analytics nav item
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[title*="Growth Analytics"]')?.click()`
  });
  await sleep(3000);

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('scratch/analytics_view.png', Buffer.from(screenshot.result.data, 'base64'));
  console.log('Saved scratch/analytics_view.png');

  ws.close(); chrome.kill(); process.exit(0);
})();
