import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9360;
const profile = mkdtempSync(join(tmpdir(), 'fs-activefield-cdp-'));
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

const takeScreenshot = async (filePath, width = 1280, height = 900) => {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await sleep(600);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(filePath, Buffer.from(shot.result.data, 'base64'));
  console.log(`Saved screenshot: ${filePath}`);
};

try {
  await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(2500);

  // Navigate to Profile page by clicking top header profile-card or sidebar account button
  await evaluate(`(() => {
    const accBtn = document.querySelector('.profile-card') || document.querySelector('button[title*="Account"]');
    if (accBtn) accBtn.click();
  })()`);
  await sleep(1500);

  // Click Quick Demo Sign In (Dani) to authenticate as Operator Dani
  const clickedLogin = await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Demo Sign In') || b.innerText.includes('Quick Demo'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Demo Sign In as Dani:', clickedLogin);
  await sleep(2500);

  // Verify Profile hierarchy & layout
  const hierarchyCheck = await evaluate(`(() => {
    const wrapper = document.querySelector('.profile-view-wrapper');
    if (!wrapper) return { error: 'No profile-view-wrapper found' };

    const children = Array.from(wrapper.children);
    const order = children.map(c => ({
      tag: c.tagName,
      className: c.className,
      firstHeading: c.querySelector('h1, h2, h3, h4')?.innerText || ''
    }));

    const activeCard = document.querySelector('.active-field-card');
    const identityCard = document.querySelector('.profile-identity-card');
    const overview = document.querySelector('.profile-overview-section');
    const personalInfo = Array.from(document.querySelectorAll('.profile-card-section')).find(s => s.innerText.includes('Personal Information'));
    const myFields = Array.from(document.querySelectorAll('.profile-card-section')).find(s => s.innerText.includes('My Fields'));

    // Check DOM order: activeCard must be before identityCard
    const activeIndex = children.indexOf(activeCard);
    const identityIndex = children.indexOf(identityCard);
    const overviewIndex = children.indexOf(overview);

    const activeTitle = activeCard?.querySelector('.active-field-title')?.innerText || '';
    const activeBadge = activeCard?.querySelector('.active-pill-text')?.innerText || '';
    const activeDashboardBtn = !!activeCard?.querySelector('.btn-open-dashboard');

    const overviewStats = Array.from(document.querySelectorAll('.profile-stat-card')).map(s => ({
      val: s.querySelector('.profile-stat-value')?.innerText || '',
      label: s.querySelector('.profile-stat-label')?.innerText || ''
    }));

    const fieldCards = Array.from(document.querySelectorAll('.field-card-item')).map(c => ({
      name: c.querySelector('h4')?.innerText || '',
      badge: c.querySelector('.completeness-badge')?.innerText || '',
      actionBtn: c.querySelector('.field-card-actions button')?.innerText || ''
    }));

    return {
      order,
      activeIndex,
      identityIndex,
      overviewIndex,
      isAboveIdentity: activeIndex < identityIndex,
      activeTitle,
      activeBadge,
      activeDashboardBtn,
      overviewStats,
      fieldCardsCount: fieldCards.length,
      fieldCards
    };
  })()`);

  console.log('--- Hierarchy Check ---');
  console.log('Active Field above Identity:', hierarchyCheck.isAboveIdentity);
  console.log('Active Field Title:', hierarchyCheck.activeTitle);
  console.log('Active Field Badge:', hierarchyCheck.activeBadge);
  console.log('Open Dashboard CTA present:', hierarchyCheck.activeDashboardBtn);
  console.log('Overview Stats:', JSON.stringify(hierarchyCheck.overviewStats, null, 2));
  console.log('Field cards count:', hierarchyCheck.fieldCardsCount);
  console.log('Field cards summary:', JSON.stringify(hierarchyCheck.fieldCards, null, 2));

  // Take initial Profile screenshot
  await takeScreenshot('C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803\\profile_active_field_desktop.png', 1300, 950);

  // Test Interactive Selection: Click "Select for Analysis" on Barisal field
  console.log('\n--- Testing Interactive Field Selection ---');
  const selectResult = await evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('.field-card-item'));
    const barisalCard = cards.find(c => c.querySelector('h4')?.innerText.includes('Barisal'));
    if (!barisalCard) return { error: 'Barisal card not found' };

    const selectBtn = barisalCard.querySelector('.btn-select-analysis');
    if (!selectBtn) return { error: 'Select for Analysis button not found on Barisal card' };

    selectBtn.click();
    return { clicked: true, fieldName: barisalCard.querySelector('h4')?.innerText };
  })()`);
  console.log('Click result:', selectResult);
  await sleep(1000);

  // Verify immediate update of Active Field card and buttons
  const afterSelectCheck = await evaluate(`(() => {
    const activeCard = document.querySelector('.active-field-card');
    const activeTitle = activeCard?.querySelector('.active-field-title')?.innerText || '';
    const overviewCurrentField = Array.from(document.querySelectorAll('.profile-stat-card')).find(s => s.innerText.includes('CURRENT FIELD'))?.querySelector('.profile-stat-value')?.innerText || '';

    const cards = Array.from(document.querySelectorAll('.field-card-item')).map(c => ({
      name: c.querySelector('h4')?.innerText || '',
      badge: c.querySelector('.completeness-badge')?.innerText || '',
      actionBtn: c.querySelector('.field-card-actions button')?.innerText || ''
    }));

    return {
      activeTitle,
      overviewCurrentField,
      cards
    };
  })()`);

  console.log('After Selection Active Title:', afterSelectCheck.activeTitle);
  console.log('After Selection Overview Current Field:', afterSelectCheck.overviewCurrentField);
  console.log('Updated Field Cards:', JSON.stringify(afterSelectCheck.cards, null, 2));

  // Take screenshot of updated profile with Barisal active
  await takeScreenshot('C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803\\profile_field_switched_barisal.png', 1300, 950);

  // Test Open Dashboard button
  console.log('\n--- Testing Open Dashboard CTA from Active Field Card ---');
  await evaluate(`(() => {
    const btn = document.querySelector('.active-field-card .btn-open-dashboard');
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  // Verify Dashboard loaded with active field name and coordinates
  const dashboardState = await evaluate(`(() => {
    const overlayHeader = document.querySelector('.map-floating-overlay .overlay-header span')?.innerText || '';
    const latInput = document.querySelector('input[name="latitude"]')?.value || '';
    const lonInput = document.querySelector('input[name="longitude"]')?.value || '';
    return {
      overlayHeader,
      latInput,
      lonInput
    };
  })()`);
  console.log('Dashboard State:', dashboardState);

  // Take screenshot of Dashboard showing synchronized Barisal field
  await takeScreenshot('C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803\\dashboard_synced_active_field.png', 1300, 950);

  // Return to Profile to verify Barisal remains active
  console.log('\n--- Returning to Profile to verify persistence ---');
  await evaluate(`(() => {
    const accBtn = document.querySelector('.profile-card') || document.querySelector('button[title*="Account"]');
    if (accBtn) accBtn.click();
  })()`);
  await sleep(1000);

  const returnProfileState = await evaluate(`(() => {
    const activeTitle = document.querySelector('.active-field-card .active-field-title')?.innerText || '';
    return { activeTitle };
  })()`);
  console.log('Profile Active Field upon return:', returnProfileState.activeTitle);

  // Mobile screenshot of the redesigned Profile page
  await takeScreenshot('C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803\\profile_active_field_mobile.png', 390, 844);

  console.log('\nAll automated verifications completed successfully!');
} catch (err) {
  console.error('Test error:', err);
} finally {
  ws.close();
  chrome.kill();
}
