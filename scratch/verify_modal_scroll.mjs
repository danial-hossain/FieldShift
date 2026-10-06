import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9336;
const profile = mkdtempSync(join(tmpdir(), 'fs-scroll-cdp-'));
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

const takeScreenshot = async filePath => {
  // Use a standard 1280x800 laptop viewport to test scrolling and visibility under constrained vertical height!
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
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
  await sleep(2500);

  // Switch to Account
  await evaluate(`(()=>{
    const b = [...document.querySelectorAll('.nav-item')].find(el => el.title && /profile|account|settings/i.test(el.title));
    if (b) b.click();
  })()`);
  await sleep(1500);

  // Ensure logged in
  const loggedIn = await evaluate(`!!document.querySelector('.btn-edit-profile')`);
  if (!loggedIn) {
    await evaluate(`(()=>{
      const b = [...document.querySelectorAll('button')].find(el => /quick demo sign in|demo sign in/i.test(el.textContent));
      if (b) b.click();
    })()`);
    await sleep(2000);
  }

  // Open Add Field Modal
  await evaluate(`(()=>{
    const btn = document.querySelector('.btn-add-field');
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  // Check footer visibility
  const footerVisible = await evaluate(`(()=>{
    const f = document.querySelector('.modal-dialog .modal-footer');
    if (!f) return false;
    const rect = f.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height > 0;
  })()`);
  console.log('Modal Footer is visible within window viewport:', footerVisible);

  const saveBtnVisible = await evaluate(`(()=>{
    const b = document.querySelector('.modal-dialog .modal-footer button[type="submit"]');
    if (!b) return false;
    const rect = b.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.width > 0;
  })()`);
  console.log('Save New Field button is directly visible in viewport:', saveBtnVisible);

  const artifactDir = 'C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803';
  await takeScreenshot(join(artifactDir, 'profile_add_field_modal_initial.png'));

  // Scroll down modal body
  await evaluate(`(()=>{
    const mb = document.querySelector('.modal-dialog .modal-body');
    if (mb) mb.scrollTop = mb.scrollHeight;
  })()`);
  await sleep(600);

  await takeScreenshot(join(artifactDir, 'profile_add_field_modal_scrolled.png'));
  console.log('Scroll test completed successfully!');
} catch (err) {
  console.error('Error during scroll test:', err);
} finally {
  ws.close();
  chrome.kill();
}
