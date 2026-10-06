import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9338;
const profile = mkdtempSync(join(tmpdir(), 'fs-prof-cdp-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
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
const logs = [];

ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    logs.push(`console.${msg.params.type}: ` + msg.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 600));
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    logs.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).slice(0, 800));
  }
  if (msg.method === 'Network.responseReceived' && msg.params.response.url.includes('/api/')) {
    logs.push(`network: ${msg.params.response.status} ${msg.params.response.url}`);
  }
});

const send = (method, params = {}) => new Promise(r => {
  const i = ++id;
  pending.set(i, r);
  ws.send(JSON.stringify({ id: i, method, params }));
});

const evaluate = async expr => {
  const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  return res.result?.result?.value;
};

await send('Runtime.enable');
await send('Network.enable');
await send('Page.enable');
await send('Page.navigate', { url: URL_ });

console.log('--- Step 1: Loading page and authenticating as Dani ---');
await sleep(4000);

// Navigate to Account view
await evaluate(`document.querySelector('button[title="Account, Profile & Saved History"]').click()`);
await sleep(1000);

// Click Demo Login if not logged in
const heroText = await evaluate(`document.querySelector('.profile-hero-card')?.textContent`);
if (heroText && heroText.includes('Demo Sign In')) {
  console.log('Clicking Demo Sign In (Dani)...');
  await evaluate(`[...document.querySelectorAll('button')].find(b => /demo sign in/i.test(b.textContent)).click()`);
  await sleep(2500);
}

const userName = await evaluate(`document.querySelector('.profile-hero-details h2')?.textContent`);
const statsPills = await evaluate(`[...document.querySelectorAll('.stat-pill-item')].map(p => p.textContent.trim())`);
console.log('Operator Header Name:', userName);
console.log('Stats Strip Pills:', statsPills);

console.log('\n--- Step 2: Testing Tab 1: Registered Parcels & Adding New Parcel ---');
await evaluate(`[...document.querySelectorAll('.profile-nav-tab')].find(t => /parcels/i.test(t.textContent)).click()`);
await sleep(500);

const parcelsCountBefore = await evaluate(`document.querySelectorAll('.parcel-card-enhanced').length`);
console.log(`Parcels before adding: ${parcelsCountBefore}`);

// Click preset 'Barisal Coastal'
await evaluate(`[...document.querySelectorAll('.preset-chip')].find(b => /barisal/i.test(b.textContent))?.click()`);
await sleep(500);

const inputName = await evaluate(`document.querySelector('input[placeholder*="North Dhaka Plot"]')?.value`);
console.log('Preset filled Parcel Name:', inputName);

// Submit form
await evaluate(`(()=>{
  const form = document.querySelector('form button[type="submit"]');
  if (form) form.click();
})()`);
await sleep(2500);

const parcelsCountAfter = await evaluate(`document.querySelectorAll('.parcel-card-enhanced').length`);
console.log(`Parcels after adding: ${parcelsCountAfter}`);

await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 1600, deviceScaleFactor: 1, mobile: false });
await sleep(500);
const shot1 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync('scratch/professional_profile_parcels.png', Buffer.from(shot1.result.data, 'base64'));
console.log('Captured scratch/professional_profile_parcels.png');

console.log('\n--- Step 3: Testing Tab 2: Operational Defaults ---');
await evaluate(`[...document.querySelectorAll('.profile-nav-tab')].find(t => /defaults/i.test(t.textContent)).click()`);
await sleep(500);

// Click 'water efficiency' priority pill
await evaluate(`[...document.querySelectorAll('.pill-option')].find(p => /water/i.test(p.textContent))?.click()`);
await sleep(300);

// Click Save Defaults
await evaluate(`[...document.querySelectorAll('button')].find(b => /save operational defaults/i.test(b.textContent))?.click()`);
await sleep(1000);

const defaultsMsg = await evaluate(`document.querySelector('form p')?.textContent`);
console.log('Defaults confirmation message:', defaultsMsg);

const shot2 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync('scratch/professional_profile_defaults.png', Buffer.from(shot2.result.data, 'base64'));
console.log('Captured scratch/professional_profile_defaults.png');

console.log('\n--- Step 4: Testing Tab 3: Simulation History & Inspection Modal ---');
await evaluate(`[...document.querySelectorAll('.profile-nav-tab')].find(t => /history/i.test(t.textContent)).click()`);
await sleep(500);

const historyRowCount = await evaluate(`document.querySelectorAll('.history-table tbody tr').length`);
console.log(`History rows found: ${historyRowCount}`);

// Click Inspect JSON on first row
await evaluate(`[...document.querySelectorAll('button')].find(b => /inspect json/i.test(b.textContent))?.click()`);
await sleep(800);

const modalTitle = await evaluate(`document.querySelector('.modal-header h3')?.textContent`);
console.log('Inspection Modal Title:', modalTitle);

const shot3 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync('scratch/professional_profile_modal.png', Buffer.from(shot3.result.data, 'base64'));
console.log('Captured scratch/professional_profile_modal.png');

// Close modal
await evaluate(`document.querySelector('.modal-close-btn')?.click()`);
await sleep(500);

console.log('\n--- Step 5: Testing Tab 4: Security & Engine Telemetry ---');
await evaluate(`[...document.querySelectorAll('.profile-nav-tab')].find(t => /security/i.test(t.textContent)).click()`);
await sleep(500);

const securityItems = await evaluate(`[...document.querySelectorAll('.account-grid .stat-pill-item')].map(p => p.textContent.trim())`);
console.log('Security & Engine Telemetry items:\n', securityItems.join('\n'));

const shot4 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync('scratch/professional_profile_security.png', Buffer.from(shot4.result.data, 'base64'));
console.log('Captured scratch/professional_profile_security.png');

console.log('\n--- Step 6: Testing "Load into Planner" Action ---');
await evaluate(`[...document.querySelectorAll('.profile-nav-tab')].find(t => /history/i.test(t.textContent)).click()`);
await sleep(500);

await evaluate(`[...document.querySelectorAll('.history-table tbody tr button')].find(b => /load into planner/i.test(b.textContent))?.click()`);
console.log('Clicked "Load into Planner" on history row...');

// Wait for navigation to dashboard and workflow execution
for (let i = 0; i < 30; i++) {
  const isRunning = await evaluate(`[...document.querySelectorAll('button')].some(b => /running/i.test(b.textContent))`);
  if (!isRunning) break;
  await sleep(500);
}
await sleep(1500);

const activeHeading = await evaluate(`document.querySelector('.header-greeting h1')?.textContent`);
const mlYield = await evaluate(`document.querySelector('.kpi-number')?.textContent`);
console.log(`Navigated to: ${activeHeading}, ML Yield: ${mlYield} t/ha`);

if (logs.length > 0) {
  console.log('\n--- Recent Logs ---');
  console.log(logs.slice(-10).join('\n'));
}

ws.close();
chrome.kill();
process.exit(0);
