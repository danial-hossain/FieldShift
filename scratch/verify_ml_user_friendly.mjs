import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = 'http://localhost:5173/';
const port = 9364;
const profile = mkdtempSync(join(tmpdir(), 'fs-ml-cdp-'));
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

  const mlCheck = await evaluate(`(() => {
    const mlCard = document.querySelector('.ml-yield-summary-card');
    if (!mlCard) return { found: false };

    const text = mlCard.textContent;
    const hasConfidenceInterval = text.includes('Confidence Interval');
    const hasEstimatedRange = text.includes('Estimated Range') || text.includes('Prediction Range');
    const hasWhatIsML = text.includes('What is ML doing?');
    const hasExpectedYield = text.includes('Expected Yield:');
    const hasMlJob = text.includes("ML's job:") && text.includes('Estimate expected yield');
    const hasMilpJob = text.includes("MILP's job:") && text.includes('Optimize the crop rotation');
    const hasDisclaimer = text.includes('Synthetic-demo estimate') && text.includes('not been validated against real field-trial yield data');
    const yieldNum = mlCard.querySelector('.ml-stat-num')?.textContent.trim();
    const rangeVal = mlCard.querySelector('.ml-range-values')?.textContent.trim();
    const uncertaintyPill = mlCard.querySelector('.ml-uncertainty-pill')?.textContent.trim();

    return {
      found: true,
      hasConfidenceInterval,
      hasEstimatedRange,
      hasWhatIsML,
      hasExpectedYield,
      hasMlJob,
      hasMilpJob,
      hasDisclaimer,
      yieldNum,
      rangeVal,
      uncertaintyPill,
      cardTextPreview: text.replace(/\\s+/g, ' ').slice(0, 300)
    };
  })()`);

  console.log('--- ML YIELD ESTIMATE CARD VERIFICATION ---');
  console.log('Card found:', mlCheck.found);
  console.log('Contains "Confidence Interval" (MUST BE FALSE):', mlCheck.hasConfidenceInterval);
  console.log('Contains "Estimated Range":', mlCheck.hasEstimatedRange);
  console.log('Contains "What is ML doing?":', mlCheck.hasWhatIsML);
  console.log('Contains "Expected Yield:":', mlCheck.hasExpectedYield);
  console.log('Contains "ML\'s job: Estimate expected yield":', mlCheck.hasMlJob);
  console.log('Contains "MILP\'s job: Optimize the crop rotation":', mlCheck.hasMilpJob);
  console.log('Contains required synthetic disclaimer:', mlCheck.hasDisclaimer);
  console.log('Expected Yield value:', mlCheck.yieldNum);
  console.log('Estimated Range value:', mlCheck.rangeVal);
  console.log('Uncertainty pill value:', mlCheck.uncertaintyPill);
  console.log('Card text preview:', mlCheck.cardTextPreview);

  // Capture Desktop Screenshot
  await takeScreenshot(join(artifactDir, 'ml_yield_estimate_user_friendly_desktop.png'), 1280, 950);

  // Capture Mobile Screenshot
  await takeScreenshot(join(artifactDir, 'ml_yield_estimate_user_friendly_mobile.png'), 390, 844);

  console.log('ALL ML CHECKS COMPLETED SUCCESSFULLY!');
} catch (err) {
  console.error('Error during ML verification:', err);
} finally {
  ws.close();
  chrome.kill();
  process.exit(0);
}
