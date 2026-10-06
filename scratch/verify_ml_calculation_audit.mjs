import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9366;
const profile = mkdtempSync(join(tmpdir(), 'fs-ml-audit-login-'));
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

const artifactDir = 'C:\\Users\\dania\\.gemini\\antigravity-cli\\brain\\4c730ae7-a2a5-460c-bbee-0350f39a7803';

try {
  await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(3000);

  console.log('=== STEP 1: INITIAL UNLOGGED / DEMO STATE ===');
  const demoCheck = await evaluate(`(() => {
    const mlCard = document.querySelector('.ml-yield-summary-card');
    const topLabel = mlCard?.querySelector('.card-top-label')?.textContent || '';
    return {
      hasSyntheticDemoBadge: topLabel.includes('Synthetic Demo'),
      hasConfidenceInterval: mlCard?.textContent.includes('Confidence Interval'),
      hasEstimatedRange: mlCard?.textContent.includes('Estimated Range'),
      yieldNum: mlCard?.querySelector('.ml-stat-num')?.textContent.trim(),
      rangeVal: mlCard?.querySelector('.ml-range-values')?.textContent.trim(),
      uncertaintyPill: mlCard?.querySelector('.ml-uncertainty-pill')?.textContent.trim()
    };
  })()`);
  console.log('Demo ML State:', demoCheck);

  // Now log in as Dani
  console.log('\n=== STEP 2: LOGGING IN AS OPERATOR DANI (User 47) ===');
  await evaluate(`(() => {
    // Go to profile / account
    const accBtn = document.querySelector('.profile-card') || document.querySelector('button[title*="Account"]');
    if (accBtn) accBtn.click();
  })()`);
  await sleep(1500);

  const clickedLogin = await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Demo Sign In') || b.innerText.includes('Quick Demo'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  })()`);
  console.log('Clicked Demo Sign In:', clickedLogin);
  await sleep(3500);

  // Switch back to Dashboard
  await evaluate(`(() => {
    const dashBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Dashboard') || b.innerText.includes('Overview'));
    if (dashBtn) dashBtn.click();
  })()`);
  await sleep(4000);

  console.log('\n=== STEP 3: AUDITING DASHBOARD WITH FIELD #58 ACTIVE ===');
  const field58Check = await evaluate(`(() => {
    const mlCard = document.querySelector('.ml-yield-summary-card');
    const select = document.querySelector('.dashboard-field-select');
    const topLabel = mlCard?.querySelector('.card-top-label')?.textContent || '';
    const locName = document.querySelector('.field-location-name strong')?.textContent;
    const locCoords = document.querySelector('.field-location-coords')?.textContent;

    return {
      activeFieldInSelect: select ? select.options[select.selectedIndex]?.text : '',
      selectValue: select ? select.value : '',
      locName,
      locCoords,
      hasSyntheticDemoBadge: topLabel.includes('Synthetic Demo'),
      hasConfidenceInterval: mlCard?.textContent.includes('Confidence Interval'),
      hasEstimatedRange: mlCard?.textContent.includes('Estimated Range'),
      yieldNum: mlCard?.querySelector('.ml-stat-num')?.textContent.trim(),
      rangeVal: mlCard?.querySelector('.ml-range-values')?.textContent.trim(),
      uncertaintyPill: mlCard?.querySelector('.ml-uncertainty-pill')?.textContent.trim(),
      cardFullText: mlCard?.textContent.replace(/\\s+/g, ' ').trim()
    };
  })()`);

  console.log('Field #58 Active State:');
  console.log('  Selected Option:', field58Check.activeFieldInSelect, '(ID:', field58Check.selectValue, ')');
  console.log('  Location Display:', field58Check.locName, '|', field58Check.locCoords);
  console.log('  "Synthetic Demo" Badge on card (MUST BE FALSE):', field58Check.hasSyntheticDemoBadge);
  console.log('  "Confidence Interval" in card (MUST BE FALSE):', field58Check.hasConfidenceInterval);
  console.log('  "Estimated Range" in card (MUST BE TRUE):', field58Check.hasEstimatedRange);
  console.log('  Expected Yield (Calculated for Field #58):', field58Check.yieldNum, 't/ha');
  console.log('  Estimated Range:', field58Check.rangeVal);
  console.log('  Uncertainty:', field58Check.uncertaintyPill);
  console.log('  Full Card Text:', field58Check.cardFullText);

  // Take screenshot of Field #58 active on Desktop & Mobile
  await takeScreenshot(join(artifactDir, 'ml_yield_audit_field58_desktop.png'), 1280, 950);
  await takeScreenshot(join(artifactDir, 'ml_yield_audit_field58_mobile.png'), 390, 844);

  // Step 4: Test switching to Demo in Dropdown
  console.log('\n=== STEP 4: SWITCHING DROPDOWN TO DEMO FIELD ===');
  await evaluate(`(() => {
    const select = document.querySelector('.dashboard-field-select');
    if (select) {
      select.value = 'demo';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(4000);

  const demoSwitchCheck = await evaluate(`(() => {
    const mlCard = document.querySelector('.ml-yield-summary-card');
    const select = document.querySelector('.dashboard-field-select');
    return {
      activeFieldInSelect: select ? select.options[select.selectedIndex]?.text : '',
      yieldNum: mlCard?.querySelector('.ml-stat-num')?.textContent.trim(),
      rangeVal: mlCard?.querySelector('.ml-range-values')?.textContent.trim(),
      uncertaintyPill: mlCard?.querySelector('.ml-uncertainty-pill')?.textContent.trim()
    };
  })()`);
  console.log('Switched to Demo Field:', demoSwitchCheck);
  await takeScreenshot(join(artifactDir, 'ml_yield_audit_demo_desktop.png'), 1280, 950);

  // Step 5: Test switching back to Field #58
  console.log('\n=== STEP 5: SWITCHING DROPDOWN BACK TO FIELD #58 ===');
  await evaluate(`(() => {
    const select = document.querySelector('.dashboard-field-select');
    if (select) {
      select.value = '58';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`);
  await sleep(4000);

  const switchBackCheck = await evaluate(`(() => {
    const mlCard = document.querySelector('.ml-yield-summary-card');
    const select = document.querySelector('.dashboard-field-select');
    return {
      activeFieldInSelect: select ? select.options[select.selectedIndex]?.text : '',
      yieldNum: mlCard?.querySelector('.ml-stat-num')?.textContent.trim(),
      rangeVal: mlCard?.querySelector('.ml-range-values')?.textContent.trim(),
      uncertaintyPill: mlCard?.querySelector('.ml-uncertainty-pill')?.textContent.trim()
    };
  })()`);
  console.log('Switched back to Field #58:', switchBackCheck);

  console.log('\n=== AUDIT VERIFICATION COMPLETE ===');
} catch (err) {
  console.error('Error during verification:', err);
} finally {
  ws.close();
  chrome.kill();
  process.exit(0);
}
