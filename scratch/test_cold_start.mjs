import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9356;
const profile = mkdtempSync(join(tmpdir(), 'fs-cold-'));
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

const evaluate = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  return r.result.result?.value;
};

await send('Page.enable');
await send('Page.navigate', { url: 'http://localhost:5173/' });
await sleep(3000);

// Check Dashboard state first
const dashDump = await evaluate(`(()=>{
  const sel = document.querySelector('.dashboard-field-select')?.value;
  const selText = document.querySelector('.dashboard-field-select option:checked')?.textContent;
  const mlYield = document.querySelector('.ml-stat-hero')?.innerText;
  const mlProd = document.querySelector('.ml-stat-hero + div')?.innerText || document.querySelector('.ml-yield-hero-block + div')?.innerText;
  const mlExpl = document.querySelector('.ml-explanation-box')?.innerText;
  const mlRange = document.querySelector('.ml-range-row')?.innerText;
  return { sel, selText, mlYield, mlProd, mlExpl, mlRange };
})()`);
console.log('DASHBOARD COLD START:', JSON.stringify(dashDump, null, 2));

// Navigate to Profile
await evaluate(`(()=>{
  const navBtn = [...document.querySelectorAll('.nav-item')].find(el => el.title && /profile|account|settings/i.test(el.title));
  if (navBtn) navBtn.click();
})()`);
await sleep(2000);

const profileDump = await evaluate(`(()=>{
  return {
    activeFieldCard: document.querySelector('.active-field-card')?.innerText,
    overviewStats: [...document.querySelectorAll('.profile-stat-card')].map(c => c.innerText.replace(/\\n/g, ': ')),
    myFieldsCount: document.querySelectorAll('.field-card-item').length,
    myFieldsText: document.querySelector('.my-fields-header')?.innerText,
    emptyStateSection: document.querySelector('.profile-card-section:has(.my-fields-header)')?.innerText
  };
})()`);
console.log('PROFILE COLD START:', JSON.stringify(profileDump, null, 2));

chrome.kill();
process.exit(0);
