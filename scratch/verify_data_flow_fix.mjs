import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9399;
const profile = mkdtempSync(join(tmpdir(), 'fs-flow-verify3-'));
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

function send(method, params = {}) {
  const curId = ++id;
  return new Promise(res => {
    pending.set(curId, res);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

async function evalCode(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
}

try {
  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: URL_ });
  await sleep(2500);

  // STEP 1: Log in via UI
  console.log('Navigating to Account/Profile...');
  await evalCode(`
    (() => {
      const accBtn = document.querySelector('button[title*="Account"]') || document.querySelector('.profile-card');
      if (accBtn) accBtn.click();
    })()
  `);
  await sleep(1200);

  console.log('Clicking Quick Demo Login...');
  await evalCode(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Demo Sign In') || b.innerText.includes('Quick Demo'));
      if (btn) btn.click();
    })()
  `);
  await sleep(3500);

  // Return to Dashboard
  console.log('Navigating to Dashboard...');
  await evalCode(`
    (() => {
      const dashBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Dashboard') || b.title?.includes('Overview'));
      if (dashBtn) dashBtn.click();
    })()
  `);
  await sleep(4000);

  // STEP 2: Set Field #58 to 20.0 ha in PostgreSQL, reload page
  console.log('\n--- Setting Field #58 to 20.0 ha in PostgreSQL ---');
  await evalCode(`
    (async () => {
      await fetch('/api/fields/58', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mirpur, Dhaka',
          latitude: 23.8029,
          longitude: 90.3685,
          area_ha: 20.0,
          soil_texture: 'loam',
          organic_matter: 3.9,
          irrigation_capacity_mm: 90.0,
          crop: 'Maize',
          previous_crop_year: 2024
        })
      });
    })()
  `);
  await sleep(1000);

  // Reload page to test cold session boot with updated 20.0 ha PostgreSQL record
  await send('Page.navigate', { url: URL_ });
  await sleep(4000);

  // Click Run Analysis to ensure fresh run with Field #58
  console.log('Clicking Run Analysis for 20 ha...');
  await evalCode(`
    (() => {
      const runBtn = document.querySelector('.dashboard-primary-run-btn');
      if (runBtn) runBtn.click();
    })()
  `);
  await sleep(4500);

  const dashData20 = await evalCode(`
    (() => {
      const fieldName = document.querySelector('.current-field-name')?.innerText || '';
      const select = document.querySelector('.dashboard-field-select');
      const areaRow = Array.from(document.querySelectorAll('.field-data-row')).find(r => r.innerText.includes('Area'))?.innerText || '';
      const yieldHero = document.querySelector('.ml-stat-hero')?.innerText || '';
      const range = document.querySelector('.ml-range-values')?.innerText || '';
      const totalProd = document.querySelector('.ml-yield-summary-card strong[style*="var(--primary-dark)"]')?.innerText || '';
      return {
        activeSelect: select ? select.options[select.selectedIndex]?.text : '',
        fieldName,
        areaRow,
        yieldHero,
        range,
        totalProd
      };
    })()
  `);
  console.log('Dashboard State for Field #58 at 20.0 ha:', JSON.stringify(dashData20, null, 2));

  // Save 20 ha desktop screenshot
  const shot20 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:/Users/dania/.gemini/antigravity-cli/brain/4c730ae7-a2a5-460c-bbee-0350f39a7803/data_flow_field58_20ha_desktop.png', Buffer.from(shot20.result.data, 'base64'));
  console.log('Saved data_flow_field58_20ha_desktop.png');

  // STEP 3: Set Field #58 to 10.0 ha in PostgreSQL, reload page
  console.log('\n--- Setting Field #58 to 10.0 ha in PostgreSQL ---');
  await evalCode(`
    (async () => {
      await fetch('/api/fields/58', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mirpur, Dhaka',
          latitude: 23.8029,
          longitude: 90.3685,
          area_ha: 10.0,
          soil_texture: 'loam',
          organic_matter: 3.9,
          irrigation_capacity_mm: 90.0,
          crop: 'Maize',
          previous_crop_year: 2024
        })
      });
    })()
  `);
  await sleep(1000);

  // Reload page to test cold session boot with updated 10.0 ha PostgreSQL record
  await send('Page.navigate', { url: URL_ });
  await sleep(4000);

  console.log('Clicking Run Analysis for 10 ha...');
  await evalCode(`
    (() => {
      const runBtn = document.querySelector('.dashboard-primary-run-btn');
      if (runBtn) runBtn.click();
    })()
  `);
  await sleep(4500);

  const dashData10 = await evalCode(`
    (() => {
      const fieldName = document.querySelector('.current-field-name')?.innerText || '';
      const select = document.querySelector('.dashboard-field-select');
      const areaRow = Array.from(document.querySelectorAll('.field-data-row')).find(r => r.innerText.includes('Area'))?.innerText || '';
      const yieldHero = document.querySelector('.ml-stat-hero')?.innerText || '';
      const range = document.querySelector('.ml-range-values')?.innerText || '';
      const totalProd = document.querySelector('.ml-yield-summary-card strong[style*="var(--primary-dark)"]')?.innerText || '';
      return {
        activeSelect: select ? select.options[select.selectedIndex]?.text : '',
        fieldName,
        areaRow,
        yieldHero,
        range,
        totalProd
      };
    })()
  `);
  console.log('Dashboard State for Field #58 at 10.0 ha:', JSON.stringify(dashData10, null, 2));

  // Save 10 ha desktop screenshot
  const shot10 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:/Users/dania/.gemini/antigravity-cli/brain/4c730ae7-a2a5-460c-bbee-0350f39a7803/data_flow_field58_10ha_desktop.png', Buffer.from(shot10.result.data, 'base64'));
  console.log('Saved data_flow_field58_10ha_desktop.png');

  // Mobile screenshot 10 ha (390px)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(600);
  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:/Users/dania/.gemini/antigravity-cli/brain/4c730ae7-a2a5-460c-bbee-0350f39a7803/data_flow_field58_10ha_mobile.png', Buffer.from(shotMobile.result.data, 'base64'));
  console.log('Saved data_flow_field58_10ha_mobile.png');

} catch (e) {
  console.error('Error during verification:', e);
} finally {
  ws.close();
  chrome.kill();
}
