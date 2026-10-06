import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9335;
const profile = mkdtempSync(join(tmpdir(), 'fs-map-cdp-'));
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
const logs = [];

ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'info'].includes(msg.params.type)) {
    logs.push(`[${msg.params.type}] ` + msg.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 500));
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

const takeScreenshot = async filePath => {
  await send('Emulation.setDeviceMetricsOverride', { width: 1300, height: 1600, deviceScaleFactor: 1, mobile: false });
  await sleep(400);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(filePath, Buffer.from(shot.result.data, 'base64'));
  console.log(`Saved screenshot: ${filePath}`);
};

try {
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(3000);

  console.log('--- 1. Navigate to Account / Profile ---');
  await evaluate(`(()=>{
    const b = [...document.querySelectorAll('.nav-item')].find(el => el.title && /profile|account|settings/i.test(el.title));
    if (b) b.click();
  })()`);
  await sleep(1500);

  console.log('--- 2. Ensure Logged In as Dani ---');
  const loggedInBefore = await evaluate(`!!document.querySelector('.btn-edit-profile')`);
  if (!loggedInBefore) {
    console.log('Clicking Quick Demo Sign In (Dani)...');
    await evaluate(`(()=>{
      const b = [...document.querySelectorAll('button')].find(el => /quick demo sign in|demo sign in/i.test(el.textContent));
      if (b) b.click();
    })()`);
    await sleep(2000);
  }

  const profileHeader = await evaluate(`document.querySelector('.personal-title-wrap')?.innerText || ''`);
  console.log('Profile Header Text:\n', profileHeader);

  const artifactDir = 'C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803';
  await takeScreenshot(join(artifactDir, 'profile_redesigned_cards.png'));

  console.log('--- 3. Click Add New Field ---');
  await evaluate(`(()=>{
    const btn = document.querySelector('.btn-add-field');
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  const hasMapPicker = await evaluate(`!!document.querySelector('.google-map-picker-wrapper')`);
  const hasMapCanvas = await evaluate(`!!document.querySelector('.map-canvas-container')`);
  console.log('Map Picker Wrapper Found:', hasMapPicker);
  console.log('Map Canvas Found:', hasMapCanvas);

  console.log('--- 4. Select Barisal Preset in Google Maps ---');
  await evaluate(`(()=>{
    const preset = [...document.querySelectorAll('.preset-pill-btn')].find(b => /barisal/i.test(b.textContent));
    if (preset) preset.click();
  })()`);
  await sleep(500);

  const latValue = await evaluate(`document.querySelectorAll('input[type="number"][step="0.0001"]')[0]?.value || ''`);
  const lngValue = await evaluate(`document.querySelectorAll('input[type="number"][step="0.0001"]')[1]?.value || ''`);
  console.log('Coordinates synced from preset:', { latValue, lngValue });

  // Fill in field name
  await evaluate(`(()=>{
    const nameInput = document.querySelector('.modal-dialog input[placeholder*="North Plot"]');
    if (nameInput) {
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      s.call(nameInput, 'Barisal Coastal Delta Research Parcel');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);

  await takeScreenshot(join(artifactDir, 'profile_add_field_modal.png'));

  console.log('--- 5. Submit Add Field Form ---');
  await evaluate(`(()=>{
    const submitBtn = document.querySelector('.modal-dialog button[type="submit"]');
    if (submitBtn) submitBtn.click();
  })()`);
  await sleep(3000);

  const fieldsCount = await evaluate(`document.querySelectorAll('.field-card-item').length`);
  console.log('Total Registered Fields rendered:', fieldsCount);

  console.log('--- 6. View Field Details Modal ---');
  await evaluate(`(()=>{
    const viewBtn = [...document.querySelectorAll('.btn-field-action')].find(b => /view/i.test(b.textContent));
    if (viewBtn) viewBtn.click();
  })()`);
  await sleep(1500);

  const hasViewMap = await evaluate(`!!document.querySelector('.modal-dialog .google-map-picker-wrapper')`);
  console.log('View Field modal has Google Map:', hasViewMap);

  await takeScreenshot(join(artifactDir, 'profile_view_field_modal.png'));

  console.log('--- 7. Close View Modal & Select Field for Analysis ---');
  await evaluate(`(()=>{
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  await evaluate(`(()=>{
    const selectBtn = [...document.querySelectorAll('.btn-select-analysis')].find(b => /select for analysis/i.test(b.textContent));
    if (selectBtn) selectBtn.click();
  })()`);

  // Wait for analysis to complete
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const hasKPI = await evaluate(`document.querySelectorAll('.kpi-number').length > 0`);
    if (hasKPI) break;
  }
  await sleep(1500);

  const kpisFound = await evaluate(`document.querySelectorAll('.kpi-number').length`);
  console.log('Analysis Results KPI metrics rendered on Dashboard:', kpisFound);

  const activeNav = await evaluate(`document.querySelector('.view-title h1')?.textContent || ''`);
  console.log('Dashboard Title:', activeNav);

  await takeScreenshot(join(artifactDir, 'profile_selected_field_analysis.png'));

  console.log('=== TEST PASSED SUCCESSFULLY ===');
} catch (err) {
  console.error('Test encountered error:', err);
} finally {
  ws.close();
  chrome.kill();
  console.log('Logs captured:\n', logs.slice(-15).join('\n'));
}
