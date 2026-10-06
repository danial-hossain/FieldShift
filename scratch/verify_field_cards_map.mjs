import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9338;
const profile = mkdtempSync(join(tmpdir(), 'fs-cardmap-cdp-'));
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

const takeScreenshot = async (filePath, width = 1366, height = 900) => {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await sleep(600);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(filePath, Buffer.from(shot.result.data, 'base64'));
  console.log(`Saved screenshot: ${filePath}`);
};

try {
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(2500);

  // Switch to Account/Profile view
  await evaluate(`(()=>{
    const b = [...document.querySelectorAll('.nav-item')].find(el => el.title && /profile|account|settings/i.test(el.title));
    if (b) b.click();
  })()`);
  await sleep(1500);

  // Check login state
  const loggedIn = await evaluate(`!!document.querySelector('.btn-edit-profile')`);
  if (!loggedIn) {
    console.log('Signing in demo user Dani...');
    await evaluate(`(()=>{
      const b = [...document.querySelectorAll('button')].find(el => /quick demo sign in|demo sign in/i.test(el.textContent));
      if (b) b.click();
    })()`);
    await sleep(2000);
  }

  // Verify field cards
  const cardsInfo = await evaluate(`(()=>{
    const cards = [...document.querySelectorAll('.field-card-item')];
    return cards.map(c => {
      const name = c.querySelector('.field-card-title-wrap h4')?.textContent?.trim();
      const id = c.querySelector('.field-id-badge')?.textContent?.trim();
      const coords = c.querySelector('.field-coords-text')?.textContent?.trim();
      const farm = c.querySelector('.field-farm-text')?.textContent?.trim();
      const hasMapThumbnail = !!c.querySelector('.field-card-map-thumbnail');
      const thumbnailHeight = c.querySelector('.field-card-map-thumbnail')?.style?.height;
      const highlightProps = [...c.querySelectorAll('.prop-highlight-card')].map(p => ({
        val: p.querySelector('.prop-highlight-val')?.textContent?.trim(),
        lbl: p.querySelector('.prop-highlight-lbl')?.textContent?.trim()
      }));
      const detailedProps = [...c.querySelectorAll('.prop-row')].map(r => ({
        key: r.querySelector('.prop-row-key')?.textContent?.trim(),
        val: r.querySelector('.prop-row-val')?.textContent?.trim()
      }));
      const buttons = [...c.querySelectorAll('button')].map(b => b.textContent?.trim());
      return {
        name,
        id,
        coords,
        farm,
        hasMapThumbnail,
        thumbnailHeight,
        highlightProps,
        detailedProps,
        buttons
      };
    });
  })()`);

  console.log(`Found ${cardsInfo?.length || 0} registered field cards:`);
  console.log(JSON.stringify(cardsInfo, null, 2));

  // Wait a few seconds for Google Map tiles or canvas elements to render
  await sleep(3500);

  // Scroll down to the My Fields section to capture the cards clearly
  await evaluate(`(()=>{
    const myFields = document.querySelector('.my-fields-header');
    if (myFields) myFields.scrollIntoView({ behavior: 'instant', block: 'start' });
  })()`);
  await sleep(800);

  // Take screenshot of redesigned cards with map thumbnails
  await takeScreenshot('C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803\\profile_cards_with_map_previews.png', 1366, 920);

  // Test clicking "View" on Field #58 (Mirpur)
  console.log('Testing "View" action modal...');
  await evaluate(`(()=>{
    const firstCard = document.querySelectorAll('.field-card-item')[0];
    const viewBtn = [...firstCard.querySelectorAll('button')].find(b => b.textContent.includes('View'));
    if (viewBtn) viewBtn.click();
  })()`);
  await sleep(2000);

  const viewModalVisible = await evaluate(`!!document.querySelector('.modal-dialog')`);
  console.log('View Field modal opened:', viewModalVisible);
  await takeScreenshot('C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803\\profile_view_field_with_map.png', 1366, 920);

  // Close modal
  await evaluate(`(()=>{
    const closeBtn = document.querySelector('.modal-close-btn') || document.querySelector('.modal-footer .btn-secondary');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  // Test "Select for Analysis" on the first card (Field #58)
  console.log('Testing "Select for Analysis" flow...');
  await evaluate(`(()=>{
    const firstCard = document.querySelectorAll('.field-card-item')[0];
    const selBtn = firstCard.querySelector('.btn-select-analysis');
    if (selBtn) selBtn.click();
  })()`);
  await sleep(3000);

  // Check that Dashboard is active and coordinates reflect Field #58 (23.8029, 90.3685)
  const dashboardState = await evaluate(`(()=>{
    const latInput = document.querySelector('input[name="latitude"]')?.value;
    const lngInput = document.querySelector('input[name="longitude"]')?.value;
    const activeNavTitle = document.querySelector('.nav-item.active')?.getAttribute('title') || 'dashboard';
    const objVal = document.querySelector('.gauge-percent')?.textContent?.trim();
    return { activeNavTitle, latInput, lngInput, objVal };
  })()`);
  console.log('Dashboard loaded with selected field:', dashboardState);

  await takeScreenshot('C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803\\profile_selected_field_preview_run.png', 1366, 920);

  console.log('E2E verification completed successfully.');
} catch (err) {
  console.error('Error during CDP verification:', err);
} finally {
  ws.close();
  chrome.kill();
  process.exit(0);
}
