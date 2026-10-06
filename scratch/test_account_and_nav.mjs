import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9334;
const profile = mkdtempSync(join(tmpdir(), 'fs-acc-cdp-'));
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

console.log('--- Step 1: Loading application ---');
await sleep(4000);

// Wait for auto-run to complete
for (let i = 0; i < 30; i++) {
  const isRunning = await evaluate(`[...document.querySelectorAll('button')].some(b => /running/i.test(b.textContent))`);
  if (!isRunning) break;
  await sleep(500);
}

console.log('Initial page title / header:', await evaluate(`document.querySelector('.header-greeting h1')?.textContent`));
console.log('KPI cards present:', await evaluate(`document.querySelectorAll('.kpi-card').length`));

console.log('\n--- Step 2: Testing Sidebar Navigation Buttons ---');
const navTitles = [
  'Growth Analytics & ML',
  'Field Parcel Map & History',
  'NASA POWER Weather & Climate',
  'Stress Test & What-If',
  'AI Assistant & Decision Support',
  'Account, Profile & Saved History'
];

for (const title of navTitles) {
  const clickRes = await evaluate(`(()=>{
    const btn = document.querySelector('button[title="${title}"]');
    if (!btn) return 'not found';
    btn.click();
    return 'clicked';
  })()`);
  await sleep(400);
  const subHeading = await evaluate(`document.querySelector('.view-sub-header h2')?.textContent || 'none'`);
  console.log(`Nav button [${title}]: ${clickRes} -> Heading: "${subHeading}"`);
}

console.log('\n--- Step 3: Testing Top Header Profile Card Click ---');
// Switch back to dashboard first
await evaluate(`document.querySelector('button[title="Overview Dashboard"]').click()`);
await sleep(400);
console.log('Switched to dashboard. Heading present:', await evaluate(`document.querySelector('.header-greeting h1')?.textContent`));

// Now click the profile card in header
const profClick = await evaluate(`(()=>{
  const card = document.querySelector('.profile-card');
  if (!card) return 'no card';
  card.click();
  return 'clicked';
})()`);
await sleep(400);
const headingAfterProf = await evaluate(`document.querySelector('.view-sub-header h2')?.textContent || 'none'`);
console.log(`Profile card click: ${profClick} -> Heading: "${headingAfterProf}"`);

console.log('\n--- Step 4: Testing Account & Profile functionality (Demo Login as Dani) ---');
const demoBtnText = await evaluate(`document.querySelector('.profile-hero-card button')?.textContent`);
console.log('Hero card button text:', demoBtnText);

if (demoBtnText && demoBtnText.includes('Demo Sign In')) {
  console.log('Clicking Demo Sign In (Dani)...');
  await evaluate(`document.querySelector('.profile-hero-card button').click()`);
  await sleep(2000);
}

const userName = await evaluate(`document.querySelector('.profile-hero-details h2')?.textContent`);
const userEmail = await evaluate(`document.querySelector('.profile-hero-details p')?.textContent`);
const savedFieldCount = await evaluate(`document.querySelectorAll('.saved-item-card').length`);
const historyRows = await evaluate(`document.querySelectorAll('.history-table tbody tr').length`);

console.log(`Logged in User Name: "${userName}"`);
console.log(`Logged in User Email: "${userEmail}"`);
console.log(`Saved Field Cards in PostgreSQL: ${savedFieldCount}`);
console.log(`Saved Analysis History Rows in PostgreSQL: ${historyRows}`);

console.log('\n--- Step 5: Capturing Account View Screenshot ---');
await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 1600, deviceScaleFactor: 1, mobile: false });
await sleep(500);
const accountShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync('scratch/account_view.png', Buffer.from(accountShot.result.data, 'base64'));
console.log('Saved scratch/account_view.png');

console.log('\n--- Step 6: Switching Back to Dashboard & Running Analysis ---');
await evaluate(`document.querySelector('button[title="Overview Dashboard"]').click()`);
await sleep(500);

const runBtn = await evaluate(`(()=>{
  const b = [...document.querySelectorAll('button')].find(x => /run analysis/i.test(x.textContent));
  if (!b) return 'none';
  b.click();
  return 'clicked';
})()`);
console.log('Run Analysis button clicked:', runBtn);

// Wait for run completion
for (let i = 0; i < 30; i++) {
  const isRunning = await evaluate(`[...document.querySelectorAll('button')].some(b => /running/i.test(b.textContent))`);
  if (!isRunning) break;
  await sleep(500);
}
await sleep(1000);

const kpiMlValue = await evaluate(`document.querySelector('.kpi-number')?.textContent`);
const objectiveVal = await evaluate(`document.querySelector('.gauge-percent')?.textContent`);
console.log(`Dashboard analysis results: ML Yield Estimate = ${kpiMlValue}, Objective Value = ${objectiveVal}`);

console.log('\n--- Step 7: Capturing Dashboard Screenshot ---');
await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 1600, deviceScaleFactor: 1, mobile: false });
await sleep(500);
const dashShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync('scratch/dashboard_view.png', Buffer.from(dashShot.result.data, 'base64'));
console.log('Saved scratch/dashboard_view.png');

if (logs.length > 0) {
  console.log('\n--- Browser Console / Network Logs ---');
  console.log(logs.join('\n'));
}

ws.close();
chrome.kill();
process.exit(0);
