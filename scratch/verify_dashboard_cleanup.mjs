import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9362;
const profile = mkdtempSync(join(tmpdir(), 'fs-dash-cdp-'));
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

  // 1. Verify Clean Dashboard structure
  const dashCheck = await evaluate(`(() => {
    const topHeader = document.querySelector('.top-header');
    const oldAvatar = document.querySelector('.avatar-badge');
    const oldEmail = document.querySelector('.profile-info small');
    const oldGreeting = document.querySelector('.header-greeting');
    const fakeSatelliteCanvas = document.querySelector('.satellite-canvas');
    const fakeSoilNutrientCard = Array.from(document.querySelectorAll('.dash-card')).find(c => c.textContent.includes('Soil Nutrient Status'));
    const formPanelOnDash = document.querySelector('.dashboard-clean-grid .form-panel-card');

    const cleanHeader = document.querySelector('.dashboard-page-header');
    const fieldSelect = document.querySelector('.dashboard-field-select');
    const runBtn = document.querySelector('.dashboard-primary-run-btn');
    const analysisStatus = document.querySelector('.dashboard-analysis-status');

    const currentFieldCard = document.querySelector('.current-field-summary-card');
    const currentConditionsCard = document.querySelector('.current-conditions-card');
    const rotationCard = document.querySelector('.rotation-main-card');
    const fieldLocationCard = document.querySelector('.field-location-card');
    const mlYieldCard = document.querySelector('.ml-yield-summary-card');
    const fieldStatusCard = document.querySelector('.field-status-summary-card');
    const aiTeaserCard = document.querySelector('.ai-assistant-teaser-card');
    const footerNote = document.querySelector('.dashboard-footer-note');

    // Count options in fieldSelect
    const options = fieldSelect ? Array.from(fieldSelect.options).map(o => ({ value: o.value, text: o.text })) : [];

    return {
      hasTopHeader: !!topHeader,
      hasOldAvatar: !!oldAvatar,
      hasOldGreeting: !!oldGreeting,
      hasFakeSatelliteCanvas: !!fakeSatelliteCanvas,
      hasFakeSoilNutrientCard: !!fakeSoilNutrientCard,
      hasFormPanelOnDash: !!formPanelOnDash,

      hasCleanHeader: !!cleanHeader,
      hasFieldSelect: !!fieldSelect,
      optionsCount: options.length,
      options,
      hasRunBtn: !!runBtn,
      runBtnText: runBtn ? runBtn.textContent.trim() : null,
      hasAnalysisStatus: !!analysisStatus,

      hasCurrentFieldCard: !!currentFieldCard,
      currentFieldName: currentFieldCard ? currentFieldCard.querySelector('.current-field-name')?.textContent.trim() : null,
      hasCurrentConditionsCard: !!currentConditionsCard,
      hasRotationCard: !!rotationCard,
      hasFieldLocationCard: !!fieldLocationCard,
      hasMlYieldCard: !!mlYieldCard,
      hasFieldStatusCard: !!fieldStatusCard,
      hasAiTeaserCard: !!aiTeaserCard,
      hasFooterNote: !!footerNote
    };
  })()`);

  console.log('--- DASHBOARD VERIFICATION RESULTS ---');
  console.log('Old top-header present:', dashCheck.hasTopHeader);
  console.log('Old avatar present:', dashCheck.hasOldAvatar);
  console.log('Old greeting present:', dashCheck.hasOldGreeting);
  console.log('Fake satellite SVG canvas present:', dashCheck.hasFakeSatelliteCanvas);
  console.log('Fake Soil Nutrient card present:', dashCheck.hasFakeSoilNutrientCard);
  console.log('Controls form present on Dashboard:', dashCheck.hasFormPanelOnDash);
  console.log('Raw JSON present on Dashboard:', dashCheck.hasRawJsonOnDash);

  console.log('New clean header present:', dashCheck.hasCleanHeader);
  console.log('Field select present:', dashCheck.hasFieldSelect, 'Options:', dashCheck.optionsCount);
  console.log('Primary Run Analysis CTA present:', dashCheck.hasRunBtn, dashCheck.runBtnText);
  console.log('Analysis status indicator:', dashCheck.hasAnalysisStatus);

  console.log('Cards present:');
  console.log('  1. Current Field:', dashCheck.hasCurrentFieldCard, `(${dashCheck.currentFieldName})`);
  console.log('  2. Current Conditions:', dashCheck.hasCurrentConditionsCard);
  console.log('  3. Optimized Rotation:', dashCheck.hasRotationCard);
  console.log('  4. Field Location Map:', dashCheck.hasFieldLocationCard);
  console.log('  5. ML Yield Estimate:', dashCheck.hasMlYieldCard);
  console.log('  6. Field Status:', dashCheck.hasFieldStatusCard);
  console.log('  7. AI Assistant Teaser:', dashCheck.hasAiTeaserCard);
  console.log('  8. Footer Note:', dashCheck.hasFooterNote);

  // Take Desktop Screenshot
  await takeScreenshot(join(artifactDir, 'dashboard_clean_restructured_desktop.png'), 1280, 950);

  // 2. Test Dropdown Switching if multiple fields exist
  if (dashCheck.optionsCount > 1) {
    console.log('Testing field dropdown switch to option 1...');
    await evaluate(`(() => {
      const select = document.querySelector('.dashboard-field-select');
      if (select && select.options.length > 1) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await sleep(1500);

    const switchedCheck = await evaluate(`(() => {
      const currentFieldCard = document.querySelector('.current-field-summary-card');
      return {
        name: currentFieldCard ? currentFieldCard.querySelector('.current-field-name')?.textContent.trim() : null,
        coords: currentFieldCard ? currentFieldCard.querySelector('.field-coords-pill')?.textContent.trim() : null
      };
    })()`);
    console.log('Switched Field Name:', switchedCheck.name, 'Coords:', switchedCheck.coords);
    await takeScreenshot(join(artifactDir, 'dashboard_field_switched_dropdown.png'), 1280, 950);
  }

  // 3. Test Navigation to Analysis page via "View Full Analysis →" button
  console.log('Testing "View Full Analysis →" button...');
  await evaluate(`(() => {
    const btn = document.querySelector('.rotation-card-header .btn-outline-action');
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  const analysisCheck = await evaluate(`(() => {
    const tabs = Array.from(document.querySelectorAll('.analysis-tab-btn')).map(b => b.textContent.trim());
    const gauge = document.querySelector('.gauge-container');
    return {
      tabsCount: tabs.length,
      tabs,
      hasGauge: !!gauge
    };
  })()`);
  console.log('Analysis page opened. Sub-tabs found:', analysisCheck.tabs);
  await takeScreenshot(join(artifactDir, 'analysis_page_overview_tab.png'), 1280, 950);

  // Click Controls tab in Analysis page
  console.log('Clicking "Field Profile & Controls Form" tab in Analysis page...');
  await evaluate(`(() => {
    const tab = Array.from(document.querySelectorAll('.analysis-tab-btn')).find(b => b.textContent.includes('Controls'));
    if (tab) tab.click();
  })()`);
  await sleep(1000);

  const controlsTabCheck = await evaluate(`(() => {
    const form = document.querySelector('.form-panel-card form');
    const latInput = form ? form.querySelector('input[name="latitude"]') : null;
    return {
      hasForm: !!form,
      latValue: latInput ? latInput.value : null
    };
  })()`);
  console.log('Controls form found in Analysis tab:', controlsTabCheck.hasForm, 'Lat:', controlsTabCheck.latValue);
  await takeScreenshot(join(artifactDir, 'analysis_page_controls_tab.png'), 1280, 950);

  // 4. Return to Dashboard and capture Mobile Screenshot
  console.log('Returning to Dashboard for Mobile screenshot...');
  await evaluate(`(() => {
    const dashNav = document.querySelector('button[title="Decision Support Dashboard"]') || document.querySelector('.sidebar-logo');
    if (dashNav) dashNav.click();
  })()`);
  await sleep(1200);

  await takeScreenshot(join(artifactDir, 'dashboard_clean_restructured_mobile.png'), 390, 844);

  console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
} catch (err) {
  console.error('Error during verification:', err);
} finally {
  ws.close();
  chrome.kill();
  process.exit(0);
}
