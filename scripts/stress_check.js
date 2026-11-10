// scripts/stress_check.js
// Verification of Climate Stress Test across 5 hazards x 3 intensities
// for Rahim field (Balanced plan), verifying table, summary, mitigations,
// bed labels, 3D before/after pixel diff > 5%, and 0 console errors.

import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.consoleErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = err => reject(err);
      this.ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        } else if (msg.method) {
          if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            const errText = msg.params.args.map(a => a.value || a.description || '').join(' ');
            this.consoleErrors.push(errText);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const msgId = this.id++;
      this.pending.set(msgId, { res, rej });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

const HAZARDS = [
  { id: 'heatwave', name: 'Heatwave', bn: 'তাপপ্রবাহ' },
  { id: 'drought', name: 'Drought', bn: 'খরা' },
  { id: 'flood', name: 'Flood', bn: 'বন্যা' },
  { id: 'coldwave', name: 'Coldwave', bn: 'শৈত্যপ্রবাহ' },
  { id: 'salinity', name: 'Salinity', bn: 'লবণাক্ততা' }
];

const INTENSITIES = [
  { id: 'mild', bn: 'মৃদু' },
  { id: 'moderate', bn: 'মাঝারি' },
  { id: 'severe', bn: 'তীব্র' }
];

async function runStressCheck() {
  console.log('==============================================================');
  console.log('FIELDSHIFT CLIMATE STRESS TEST AUDIT (SF5 Check)');
  console.log('==============================================================');

  const chromeProc = spawn(findChrome(), [
    '--headless=new',
    '--remote-debugging-port=9477',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const listRes = await fetch('http://127.0.0.1:9477/json/list');
        const tabs = await listRes.json();
        wsUrl = tabs[0]?.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome debugging endpoint');

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[1/5] Navigating to http://localhost:3000 (English mode for assertions)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 2000));
    await cdp.eval(`
      localStorage.setItem('fieldshift_lang', 'en');
      window.location.reload();
    `);
    await new Promise(r => setTimeout(r, 2500));

    // Ensure Rahim field is active
    console.log('[2/5] Selecting Rahim field and navigating to Rotation Planner -> Climate Stress Test...');
    await cdp.eval(`
      (() => {
        // Find field selector or button
        const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const plannerBtn = allButtons.find(b => b.textContent.includes('Rotation Planner') || b.textContent.includes('পরিকল্পনা'));
        if (plannerBtn) plannerBtn.click();
      })()
    `);

    await new Promise(r => setTimeout(r, 1500));

    // Switch to tab 3 (Climate Stress Test)
    await cdp.eval(`
      (() => {
        const subTabs = Array.from(document.querySelectorAll('button, [role="button"]'));
        const stressTab = subTabs.find(b => b.textContent.includes('Stress') || b.textContent.includes('চাপ'));
        if (stressTab) stressTab.click();
      })()
    `);

    await new Promise(r => setTimeout(r, 1500));

    // Ensure Balanced strategy is active
    await cdp.eval(`
      (() => {
        const stratBtns = Array.from(document.querySelectorAll('button'));
        const balBtn = stratBtns.find(b => b.textContent.includes('Balanced') || b.textContent.includes('সুষম'));
        if (balBtn) balBtn.click();
      })()
    `);

    await new Promise(r => setTimeout(r, 1000));

    console.log('[3/5] Testing 5 hazards x 3 intensities (15 combinations)...');
    const results = [];
    const monotonicityViolations = [];

    for (const h of HAZARDS) {
      const intensityResults = {};

      for (const intObj of INTENSITIES) {
        const intensity = intObj.id;
        // Select hazard and intensity
        await cdp.eval(`
          (() => {
            // Click hazard card
            const cards = Array.from(document.querySelectorAll('.climate-stress-workspace div[style*="cursor: pointer"]'));
            const hCard = cards.find(c => {
              const txt = c.textContent.toLowerCase();
              return txt.includes('${h.id}') || txt.includes('${h.bn}');
            });
            if (hCard) hCard.click();

            // Click intensity button
            const intBtns = Array.from(document.querySelectorAll('button'));
            const iBtn = intBtns.find(b => {
              const txt = b.textContent.toLowerCase().trim();
              return txt === '${intensity}' || txt === '${intObj.bn}' || txt.includes('${intensity}') || txt.includes('${intObj.bn}');
            });
            if (iBtn) iBtn.click();
          })()
        `);

        // Wait for 300ms debounce + API response
        await new Promise(r => setTimeout(r, 900));

        // Evaluate UI state
        const state = await cdp.eval(`
          (() => {
            function bnToAscii(str) {
              if (!str) return '';
              const map = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
              return String(str).replace(/[০-৯]/g, d => map[d] || d);
            }

            // 1. Table rows
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            const rowCount = rows.length;

            // Extract loss % and hit count
            let hitRowsWithLoss = 0;
            let hitCount = 0;
            rows.forEach(tr => {
              const text = tr.textContent;
              const hasMinus = text.includes('−') || text.includes('-');
              if (hasMinus) hitRowsWithLoss++;
              if (!text.includes('Not affected') && !text.includes('প্রভাবিত নয়')) hitCount++;
            });

            // 2. Summary strip numbers
            const summaryStrip = document.querySelector('.stress-summary-strip');
            const summaryCards = summaryStrip ? Array.from(summaryStrip.children) : [];
            const summaryNumsCount = summaryCards.length;
            const yieldLossText = summaryCards[0]?.innerText || '';
            const profitLossText = summaryCards[1]?.innerText || '';
            const worstSeasonText = summaryCards[2]?.innerText || '';

            const yLines = yieldLossText.split('\\n').map(s => s.trim()).filter(Boolean);
            const pLines = profitLossText.split('\\n').map(s => s.trim()).filter(Boolean);
            const wLines = worstSeasonText.split('\\n').map(s => s.trim()).filter(Boolean);

            const yieldVal = yLines[1] || yLines[0] || '';
            const profitVal = pLines[1] || pLines[0] || '';
            const worstVal = wLines[1] || wLines[0] || '';

            // Parse yield loss %
            const cleanYield = bnToAscii(yieldLossText);
            const lossMatch = cleanYield.match(/−?([0-9.]+)\s*%/);
            const lossPct = lossMatch ? parseFloat(lossMatch[1]) : 0;

            // 3. Mitigations
            const mitText = document.querySelector('.climate-stress-workspace')?.innerText || '';
            const hasMitigations = mitText.includes('BARI') || mitText.includes('BRRI') || mitText.includes('FAO') || mitText.includes('IRRI') || mitText.includes('Mitigation') || mitText.includes('প্রমাণিত কৌশল') || mitText.includes('মাঠ-প্রমাণিত');

            // 4. Bed labels: check none contain "0 mm"
            const bedLabels = Array.from(document.querySelectorAll('.farm3d-bed-label'));
            const zeroMmLabels = bedLabels.filter(l => l.textContent.includes('0 mm') || l.textContent.includes('০ মিমি'));

            return {
              rowCount,
              hitRowsWithLoss,
              hitCount,
              summaryNumsCount,
              yieldLossText: yieldVal,
              profitLossText: profitVal,
              worstSeasonText: worstVal,
              lossPct,
              hasMitigations,
              zeroMmCount: zeroMmLabels.length,
              bedLabelsCount: bedLabels.length
            };
          })()
        `);

        if (state.rowCount !== 6) {
          throw new Error(`[FAIL] Expected 6 table rows for ${h.name} (${intensity}), got ${state.rowCount}`);
        }
        if (state.hitRowsWithLoss === 0) {
          throw new Error(`[FAIL] Expected at least one hit row with loss > 0 for ${h.name} (${intensity})`);
        }
        if (state.summaryNumsCount < 3) {
          throw new Error(`[FAIL] Expected 3 summary strip numbers for ${h.name} (${intensity}), got ${state.summaryNumsCount}`);
        }
        if (!state.hasMitigations) {
          throw new Error(`[FAIL] Mitigations empty for ${h.name} (${intensity})`);
        }
        if (state.zeroMmCount > 0) {
          throw new Error(`[FAIL] Bed label contains "0 mm" for ${h.name} (${intensity})`);
        }

        intensityResults[intensity] = state.lossPct;
        results.push({
          hazard: h.name,
          intensity,
          lossPct: state.lossPct,
          yieldLoss: state.yieldLossText,
          profitLoss: state.profitLossText,
          worstSeason: state.worstSeasonText
        });
      }

      // Check monotonicity: Severe >= Moderate >= Mild
      if (intensityResults.severe < intensityResults.moderate || intensityResults.moderate < intensityResults.mild) {
        monotonicityViolations.push({
          hazard: h.name,
          mild: intensityResults.mild,
          moderate: intensityResults.moderate,
          severe: intensityResults.severe
        });
      }
    }

    if (monotonicityViolations.length > 0) {
      throw new Error(`[FAIL] Monotonicity violation: ${JSON.stringify(monotonicityViolations)}`);
    }

    console.log('[4/5] Testing 3D Before vs After visual pixel difference > 5%...');
    // Select Drought Severe
    await cdp.eval(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.climate-stress-workspace div[style*="cursor: pointer"]'));
        const dCard = cards.find(c => c.textContent.toLowerCase().includes('drought') || c.textContent.includes('খরা'));
        if (dCard) dCard.click();
        const intBtns = Array.from(document.querySelectorAll('button'));
        const sBtn = intBtns.find(b => b.textContent.toLowerCase().trim() === 'severe' || b.textContent.includes('তীব্র'));
        if (sBtn) sBtn.click();
      })()
    `);

    await new Promise(r => setTimeout(r, 800));

    // 1. Switch to After (Stressed)
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const afterBtn = buttons.find(b => b.textContent.includes('After') || b.textContent.includes('পরে'));
        if (afterBtn) afterBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1000)); // wait for 0.6s transition

    // Sample pixels across canvas for After
    const afterPixels = await cdp.eval(`
      (() => {
        const canvas = document.querySelector('.climate-stress-workspace canvas');
        if (!canvas) return null;
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return null;
        const w = Math.min(300, Math.round(canvas.width * 0.6));
        const h = Math.min(200, Math.round(canvas.height * 0.6));
        const startX = Math.round((canvas.width - w) / 2);
        const startY = Math.round((canvas.height - h) / 2);
        const buf = new Uint8Array(w * h * 4);
        gl.readPixels(startX, startY, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        return Array.from(buf);
      })()
    `);

    // 2. Switch to Before (Normal)
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const beforeBtn = buttons.find(b => b.textContent.includes('Before') || b.textContent.includes('আগে'));
        if (beforeBtn) beforeBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1200)); // wait for 0.6s transition

    // Sample pixels across canvas for Before
    const beforePixels = await cdp.eval(`
      (() => {
        const canvas = document.querySelector('.climate-stress-workspace canvas');
        if (!canvas) return null;
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return null;
        const w = Math.min(300, Math.round(canvas.width * 0.6));
        const h = Math.min(200, Math.round(canvas.height * 0.6));
        const startX = Math.round((canvas.width - w) / 2);
        const startY = Math.round((canvas.height - h) / 2);
        const buf = new Uint8Array(w * h * 4);
        gl.readPixels(startX, startY, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        return Array.from(buf);
      })()
    `);

    if (!afterPixels || !beforePixels) {
      throw new Error('[FAIL] Unable to read pixels from WebGL canvas');
    }

    let diffCount = 0;
    const totalSamplePixels = afterPixels.length / 4;
    for (let p = 0; p < totalSamplePixels; p++) {
      const idx = p * 4;
      const dr = Math.abs(afterPixels[idx] - beforePixels[idx]);
      const dg = Math.abs(afterPixels[idx + 1] - beforePixels[idx + 1]);
      const db = Math.abs(afterPixels[idx + 2] - beforePixels[idx + 2]);
      if (dr + dg + db > 20) {
        diffCount++;
      }
    }

    const pixelDiffPct = (diffCount / totalSamplePixels) * 100;
    console.log(`[3D Visual Check] Before vs After canvas pixel diff: ${pixelDiffPct.toFixed(2)}% (Target: > 5.0%)`);
    if (pixelDiffPct < 5.0) {
      throw new Error(`[FAIL] 3D canvas Before vs After difference was only ${pixelDiffPct.toFixed(2)}% (must be > 5%)`);
    }

    console.log('[5/5] Checking console errors...');
    if (cdp.consoleErrors.length > 0) {
      console.error('Console errors encountered:', cdp.consoleErrors);
      throw new Error(`[FAIL] Encountered ${cdp.consoleErrors.length} console errors`);
    }

    console.log('\n==============================================================');
    console.log('RESULTS TABLE (Rahim Field · Balanced Plan)');
    console.log('==============================================================');
    console.log('| Hazard | Intensity | Total Yield Loss | Total Profit Loss | Worst Season |');
    console.log('|---|---|---|---|---|');
    for (const r of results) {
      console.log(`| ${r.hazard} | ${r.intensity.toUpperCase()} | ${r.yieldLoss} | ${r.profitLoss} | ${r.worstSeason} |`);
    }
    console.log('==============================================================');
    console.log(`3D Canvas Difference: ${pixelDiffPct.toFixed(2)}% (> 5.0%)`);
    console.log(`Console Errors: 0`);
    console.log('STATUS: PASS');
    console.log('==============================================================');

    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

runStressCheck().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
