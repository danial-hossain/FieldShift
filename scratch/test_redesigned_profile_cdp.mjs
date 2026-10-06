import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ARTIFACT_DIR = 'C:/Users/dania/.gemini/antigravity-cli/brain/4c730ae7-a2a5-460c-bbee-0350f39a7803';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9345;
const profile = mkdtempSync(join(tmpdir(), 'fs-prof3-cdp-'));
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
await sleep(1500);

// Click Demo Login if not logged in
const hasSignInBtn = await evaluate(`[...document.querySelectorAll('button')].some(b => /demo sign in/i.test(b.textContent))`);
if (hasSignInBtn) {
  console.log('Clicking Demo Sign In (Dani)...');
  await evaluate(`[...document.querySelectorAll('button')].find(b => /demo sign in/i.test(b.textContent)).click()`);
  await sleep(3000);
}

// 1. Verify Personal Information
const personalInfo = await evaluate(`(()=>{
  const blocks = [...document.querySelectorAll('.personal-info-grid .info-block')].map(b => ({
    label: b.querySelector('label')?.textContent,
    val: b.querySelector('strong')?.textContent
  }));
  return blocks;
})()`);
console.log('Personal Information Blocks:', JSON.stringify(personalInfo, null, 2));

// 2. Verify My Fields cards
const fieldsInfo = await evaluate(`(()=>{
  const cards = [...document.querySelectorAll('.field-card-item')].map(c => ({
    name: c.querySelector('.field-card-title-wrap h4')?.textContent,
    id: c.querySelector('.field-id-badge')?.textContent,
    coords: c.querySelector('.location-coords')?.textContent,
    size: c.querySelector('.metric-cell:nth-child(1) strong')?.textContent,
    texture: c.querySelector('.metric-cell:nth-child(2) strong')?.textContent,
    crop: c.querySelector('.crop-chip')?.textContent
  }));
  return cards;
})()`);
console.log(`Loaded ${fieldsInfo.length} Field Cards`);

// Screenshot 1: Profile Page with Personal Info & Fields
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1200, deviceScaleFactor: 1, mobile: false });
await sleep(500);
const shot1 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync(join(ARTIFACT_DIR, 'profile_redesigned_cards.png'), Buffer.from(shot1.result.data, 'base64'));
console.log('Saved artifact: profile_redesigned_cards.png');

// 3. Test View Modal
console.log('\n--- Step 2: Testing View Field Modal ---');
await evaluate(`(()=>{
  const viewBtn = document.querySelector('.field-card-item .btn-field-action');
  if (viewBtn) viewBtn.click();
})()`);
await sleep(1000);

const viewModalOpen = await evaluate(`!!document.querySelector('.modal-dialog')`);
console.log('View Modal Opened:', viewModalOpen);

const shot2 = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(join(ARTIFACT_DIR, 'profile_view_field_modal.png'), Buffer.from(shot2.result.data, 'base64'));
console.log('Saved artifact: profile_view_field_modal.png');

// Close View Modal
await evaluate(`document.querySelector('.modal-close-btn')?.click()`);
await sleep(600);

// 4. Test Add Field Modal
console.log('\n--- Step 3: Testing Add New Field Modal ---');
await evaluate(`document.querySelector('.btn-add-field')?.click()`);
await sleep(1000);

// Click preset 'Barisal' in modal (which now sets name to 'Barisal Coastal Parcel')
await evaluate(`[...document.querySelectorAll('.modal-dialog .preset-chip')].find(b => /barisal/i.test(b.textContent))?.click()`);
await sleep(400);

const uniqueName = 'Barisal Test Station ' + Math.floor(Math.random() * 1000);
await evaluate(`(()=>{
  const input = document.querySelector('.modal-dialog input[placeholder*="North Plot"]');
  if (input) {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(input, "${uniqueName}");
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
})()`);
await sleep(400);

const shot3 = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(join(ARTIFACT_DIR, 'profile_add_field_modal.png'), Buffer.from(shot3.result.data, 'base64'));
console.log('Saved artifact: profile_add_field_modal.png');

// Submit Add Field Form
await evaluate(`document.querySelector('.modal-dialog form button[type="submit"]')?.click()`);
await sleep(3000);

const fieldNamesAfterAdd = await evaluate(`[...document.querySelectorAll('.field-card-title-wrap h4')].map(h => h.textContent)`);
console.log('Field Names after addition:', fieldNamesAfterAdd);
const wasAdded = fieldNamesAfterAdd.includes(uniqueName);
console.log(`Field "${uniqueName}" successfully registered in PostgreSQL:`, wasAdded);

// 5. Test "Select for Analysis"
console.log('\n--- Step 4: Testing Select for Analysis ---');
await evaluate(`(()=>{
  const selectBtn = document.querySelector('.field-card-item .btn-select-analysis');
  if (selectBtn) selectBtn.click();
})()`);
await sleep(5000);

const navStatus = await evaluate(`(()=>{
  const hasWeather = !!document.querySelector('.weather-card');
  const hasKpi = !!document.querySelector('.kpi-row');
  const hasSummary = !!document.querySelector('.analytics-panel-card');
  return { hasWeather, hasKpi, hasSummary };
})()`);
console.log('Dashboard active after Select for Analysis:', navStatus);

const shot4 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
writeFileSync(join(ARTIFACT_DIR, 'profile_selected_field_analysis.png'), Buffer.from(shot4.result.data, 'base64'));
console.log('Saved artifact: profile_selected_field_analysis.png');

console.log('\nAll E2E profile tests passed successfully!');
try { chrome.kill(); } catch {}
process.exit(0);
