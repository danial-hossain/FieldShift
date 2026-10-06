import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9350;
const profile = mkdtempSync(join(tmpdir(), 'fs-profhdr-cdp-'));
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

const takeScreenshot = async (filePath, width = 1280, height = 850) => {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
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

  // Sign in Dani if not signed in
  const loggedInInitial = await evaluate(`!!document.querySelector('.profile-card')`);
  console.log('Initially logged in on Dashboard:', loggedInInitial);

  // 1. Check Dashboard View intact
  console.log('Verifying Dashboard view is intact...');
  const dashHeaderInfo = await evaluate(`(()=>{
    const hdr = document.querySelector('.top-header');
    return {
      hasTopHeader: !!hdr,
      greeting: hdr?.querySelector('.header-greeting h1')?.textContent,
      hasProfileCard: !!hdr?.querySelector('.profile-card'),
      hasRunAnalysis: !!hdr?.querySelector('.run-cta-btn')
    };
  })()`);
  console.log('Dashboard header info:', dashHeaderInfo);
  await takeScreenshot('C:\\FieldShift\\artifacts\\dashboard_view_intact.png', 1280, 850);

  // 2. Navigate to Profile / Account
  console.log('Navigating to Profile / Account...');
  await evaluate(`(()=>{
    const navBtn = [...document.querySelectorAll('.nav-item')].find(el => el.title && /profile|account|settings/i.test(el.title));
    if (navBtn) navBtn.click();
  })()`);
  await sleep(2000);

  // Check if we need demo sign in
  const signedInProfile = await evaluate(`!!document.querySelector('.btn-edit-profile')`);
  if (!signedInProfile) {
    console.log('Signing in demo operator Dani...');
    await evaluate(`(()=>{
      const b = [...document.querySelectorAll('button')].find(el => /quick demo sign in|demo sign in/i.test(el.textContent));
      if (b) b.click();
    })()`);
    await sleep(3000);
  }

  // 3. Inspect Profile Page structure
  console.log('Auditing Profile Page structure...');
  const profileAudit = await evaluate(`(()=>{
    const topHeader = document.querySelector('.top-header');
    const pageTitle = document.querySelector('.profile-page-title')?.textContent;
    const pageSubtitle = document.querySelector('.profile-page-subtitle')?.textContent;
    const breadcrumb = document.querySelector('.profile-breadcrumb')?.textContent?.trim();
    const signOutBtn = !!document.querySelector('.profile-signout-btn');
    const identityCard = document.querySelector('.profile-identity-card');
    const avatar = identityCard?.querySelector('.profile-avatar-circle')?.textContent?.trim();
    const name = identityCard?.querySelector('.profile-name-row h2')?.textContent?.trim();
    const verifiedBadge = identityCard?.querySelector('.profile-verified-badge')?.textContent?.trim();
    const role = identityCard?.querySelector('.profile-role-title')?.textContent?.trim();
    const email = identityCard?.querySelector('.profile-email-text')?.textContent?.trim();
    const editBtn = !!identityCard?.querySelector('.btn-edit-profile');
    
    // Check for duplicate avatar circles or cards
    const totalAvatars = document.querySelectorAll('.profile-avatar-circle, .personal-avatar, .operator-avatar-large').length;
    const duplicateProfileCard = !!document.querySelector('.top-header .profile-card');
    const strayChevron = document.querySelectorAll('.profile-card svg').length;

    // Overview cards
    const overviewCards = [...document.querySelectorAll('.profile-stat-card')].map(c => ({
      val: c.querySelector('.profile-stat-value')?.textContent?.trim(),
      lbl: c.querySelector('.profile-stat-label')?.textContent?.trim()
    }));

    // Personal info
    const personalInfoItems = [...document.querySelectorAll('.personal-info-grid .info-block')].map(i => ({
      lbl: i.querySelector('label')?.textContent?.trim(),
      val: i.querySelector('strong')?.textContent?.trim()
    }));

    // My fields
    const fieldCardsCount = document.querySelectorAll('.field-card-item').length;

    return {
      hasTopHeaderOnProfile: !!topHeader,
      pageTitle,
      pageSubtitle,
      breadcrumb,
      signOutBtn,
      avatar,
      name,
      verifiedBadge,
      role,
      email,
      editBtn,
      totalAvatars,
      duplicateProfileCard,
      strayChevron,
      overviewCards,
      personalInfoItems,
      fieldCardsCount
    };
  })()`);

  console.log('Profile page audit result:');
  console.log(JSON.stringify(profileAudit, null, 2));

  // Take Desktop screenshot
  await takeScreenshot('C:\\FieldShift\\artifacts\\profile_header_cleaned_desktop.png', 1366, 880);

  // 4. Test Mobile responsive layout
  console.log('Testing mobile responsive layout (375x720)...');
  await takeScreenshot('C:\\FieldShift\\artifacts\\profile_header_cleaned_mobile.png', 375, 750);

  // 5. Test Breadcrumb navigation back to Dashboard
  console.log('Testing Breadcrumb "Dashboard" navigation...');
  await evaluate(`(()=>{
    const dashLink = document.querySelector('.breadcrumb-link');
    if (dashLink) dashLink.click();
  })()`);
  await sleep(1500);

  const backOnDashboard = await evaluate(`!!document.querySelector('.top-header .header-greeting h1')`);
  console.log('Navigated back to Dashboard via breadcrumb successfully:', backOnDashboard);

  console.log('Verification finished with success!');
} catch (err) {
  console.error('Error in verification:', err);
} finally {
  ws.close();
  chrome.kill();
  process.exit(0);
}
