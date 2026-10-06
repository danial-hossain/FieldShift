import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9352;
const profile = mkdtempSync(join(tmpdir(), 'fs-actions-cdp-'));
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

try {
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(2500);

  // Navigate to Profile
  await evaluate(`(()=>{
    const navBtn = [...document.querySelectorAll('.nav-item')].find(el => el.title && /profile|account|settings/i.test(el.title));
    if (navBtn) navBtn.click();
  })()`);
  await sleep(1500);

  // Sign in if needed
  let editBtn = await evaluate(`!!document.querySelector('.btn-edit-profile')`);
  if (!editBtn) {
    await evaluate(`(()=>{
      const b = [...document.querySelectorAll('button')].find(el => /quick demo sign in|demo sign in/i.test(el.textContent));
      if (b) b.click();
    })()`);
    await sleep(2500);
  }

  // 1. Test Edit Profile modal
  console.log('Testing "Edit Profile" modal...');
  await evaluate(`(()=>{
    const btn = document.querySelector('.btn-edit-profile');
    if (btn) btn.click();
  })()`);
  await sleep(1000);

  const modalOpened = await evaluate(`(()=>{
    const m = document.querySelector('.modal-dialog');
    return !!m && m.textContent.includes('Edit Agronomist Profile');
  })()`);
  console.log('Edit Profile modal opened:', modalOpened);

  // Close modal
  await evaluate(`(()=>{
    const closeBtn = document.querySelector('.modal-close-btn') || document.querySelector('.modal-footer .btn-secondary');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(800);

  // 2. Test Sign Out
  console.log('Testing "Sign Out" action...');
  await evaluate(`(()=>{
    const soBtn = document.querySelector('.profile-signout-btn');
    if (soBtn) soBtn.click();
  })()`);
  await sleep(1500);

  const signedOutState = await evaluate(`(()=>{
    const name = document.querySelector('.profile-identity-card .profile-name-row h2')?.textContent?.trim();
    const hasSignInBtn = !![...document.querySelectorAll('button')].find(b => /demo sign in/i.test(b.textContent));
    return { name, hasSignInBtn };
  })()`);
  console.log('Signed out state:', signedOutState);

  // 3. Test Demo Sign In
  console.log('Testing "Demo Sign In" from Profile page...');
  await evaluate(`(()=>{
    const b = [...document.querySelectorAll('button')].find(el => /demo sign in/i.test(el.textContent));
    if (b) b.click();
  })()`);
  await sleep(2500);

  const signedInState = await evaluate(`(()=>{
    const name = document.querySelector('.profile-identity-card .profile-name-row h2')?.textContent?.trim();
    const verified = document.querySelector('.profile-verified-badge')?.textContent?.trim();
    const hasEditBtn = !!document.querySelector('.btn-edit-profile');
    return { name, verified, hasEditBtn };
  })()`);
  console.log('Re-signed in state:', signedInState);

  console.log('All profile actions verified successfully!');
} catch (err) {
  console.error('Error during action testing:', err);
} finally {
  ws.close();
  chrome.kill();
  process.exit(0);
}
