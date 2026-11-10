// scripts/lang_check.js
// Automated Language Purity Guard (L3) & Visual Proof Capturer
// Verifies:
// 1. In 'bn' mode: No banned English words ('Balanced', 'Water Saving', 'Soil Health', 'Profit', 'Mustard', 'Rice', 'Mungbean', 'T. Aman', 'Year 1 · Year 1 Rabi', 'Soil: Clay_loam', 'Annual profit', 'Total Water')
// 2. In 'en' mode: No banned Bangla characters/words ('সুষম', 'পানি সাশ্রয়', 'মাটির স্বাস্থ্য', 'লাভ', 'সরিষা', 'মুগডাল', 'আমন ধান', 'বছর ১ · রবি', 'মাটি: এঁটেল দোআঁশ', 'টাকা', 'মণ', 'হেক্টর', 'বিঘা') outside the farmer's typed field name.
// 3. Crawls all 8 destinations (dashboard, field, farm_planning, weather, water_irrigation, harvest_profit, data_evidence, assistant)
//    for both Rahim's field (251) and Sunamganj field (247).
// 4. Captures screenshot proofs in docs/screens/replan_fix/.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9249;
const SCREENS_DIR = path.join(REPO_ROOT, 'docs', 'screens', 'replan_fix');
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';

if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
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
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          rej(new Error(`Timeout waiting for CDP response to ${method}`));
        }
      }, 15000);
      this.pending.set(id, {
        res: (val) => { clearTimeout(timer); res(val); },
        rej: (err) => { clearTimeout(timer); rej(err); }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Runtime.evaluate exception');
    }
    return res.result?.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${path.basename(outputPath)}`);
    try {
      const artifactPath = path.join(ARTIFACT_DIR, path.basename(outputPath));
      fs.writeFileSync(artifactPath, Buffer.from(res.data, 'base64'));
    } catch {}
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const BANNED_BN_WORDS = [
  'Balanced',
  'Water Saving',
  'Soil Health',
  'Profit',
  'Mustard',
  'Rice',
  'Mungbean',
  'T. Aman',
  'Year 1 · Year 1 Rabi',
  'Soil: Clay_loam',
  'Annual profit',
  'Total Water'
];

const BANNED_EN_WORDS = [
  'সুষম',
  'পানি সাশ্রয়',
  'মাটির স্বাস্থ্য',
  'লাভ',
  'সরিষা',
  'মুগডাল',
  'আমন ধান',
  'বছর ১ · রবি',
  'মাটি: এঁটেল দোআঁশ',
  'টাকা',
  'মণ',
  'হেক্টর',
  'বিঘা'
];

const STRIP_REGEXES = [
  /রহিম\s*মিয়ার\s*জমি/g,
  /সুনামগঞ্জ\s*হাওর\s*নিম্নাঞ্চল(?:\s*\([^)]*\))?/g,
  /বগুড়া\s*ডেমো\s*খামার(?:\s*\([^)]*\))?/g,
  /রাজশাহী\s*বরেন্দ্র\s*উচ্চভূমি(?:\s*\([^)]*\))?/g,
  /হাওর\s*নিম্নাঞ্চল/g,
  /বরেন্দ্র\s*উচ্চভূমি/g,
  /ডেমো\s*খামার/g
];

function cleanEnText(rawText) {
  let cleaned = rawText || '';
  for (const rx of STRIP_REGEXES) {
    cleaned = cleaned.replace(rx, '');
  }
  return cleaned;
}

const DESTINATIONS = [
  { nav: 'dashboard', name: 'Overview' },
  { nav: 'field', name: 'My Fields' },
  { nav: 'farm_planning', name: 'Rotation Planner' },
  { nav: 'weather', name: 'Climate & Risk' },
  { nav: 'water_irrigation', name: 'Water' },
  { nav: 'harvest_profit', name: 'Market & Profit' },
  { nav: 'data_evidence', name: 'Evidence & Method' },
  { nav: 'assistant', name: 'AI Assistant' }
];

async function runCheck() {
  console.log('==============================================================');
  console.log('FIELDSHIFT AUTOMATED LANGUAGE PURITY GUARD (L3)');
  console.log('==============================================================');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:3000/'
  ], { stdio: 'ignore' });

  let problemsCount = 0;
  const problems = [];

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        targets = await res.json();
        if (targets && targets.some(t => t.url.includes('3000'))) break;
      } catch {}
      await sleep(250);
    }
    const pageTarget = targets.find(t => t.url.includes('3000'));
    if (!pageTarget) throw new Error('Page target not found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Authenticating evaluator session...');
    await cdp.eval(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
      })()
    `);

    async function extractPageText() {
      return await cdp.eval(`
        (() => {
          const root = document.querySelector('.main-wrapper') || document.body;
          const clone = root.cloneNode(true);
          const removeSelectors = [
            'script', 'style', 'svg', 'canvas', 'code',
            '.field-name-custom', '.user-menu-dropdown', '.field-switcher-dropdown'
          ];
          removeSelectors.forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));
          return clone.innerText || clone.textContent || '';
        })()
      `);
    }

    async function navigateTo(navKey) {
      return await cdp.eval(`
        (() => {
          const btn = document.querySelector('[data-nav="${navKey}"]');
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()
      `);
    }

    const TEST_CONFIGS = [
      { fieldId: 251, fieldName: 'Rahim (Chapainawabganj)' },
      { fieldId: 247, fieldName: 'Sunamganj (Haor)' }
    ];

    for (const cfg of TEST_CONFIGS) {
      console.log(`\n==============================================================`);
      console.log(`FIELD: ${cfg.fieldName} (id=${cfg.fieldId})`);
      console.log(`==============================================================`);

      // 1. BANGLA MODE
      console.log(`\n--- [BN] Bangla Mode (${cfg.fieldName}) ---`);
      await cdp.eval(`
        (() => {
          localStorage.setItem('fieldshift_lang', 'bn');
          localStorage.setItem('fieldshift_theme', 'light');
          localStorage.setItem('fs_selected_field_id', '${cfg.fieldId}');
          localStorage.setItem('fs_selected_field_id_323', '${cfg.fieldId}');
        })()
      `);
      await cdp.eval(`window.location.reload();`);
      await sleep(3500);

      // Verify each destination in bn
      for (const dest of DESTINATIONS) {
        await navigateTo(dest.nav);
        await sleep(1500);

        const pageText = await extractPageText();
        for (const banned of BANNED_BN_WORDS) {
          if (pageText.includes(banned)) {
            problems.push(`[BN][${cfg.fieldName}][${dest.name}] Found forbidden English phrase: "${banned}"`);
            problemsCount++;
          }
        }

        // Special handling for farm_planning: also check Replan
        if (dest.nav === 'farm_planning') {
          if (cfg.fieldId === 251) {
            await cdp.captureScreenshot(path.join(SCREENS_DIR, 'planner_balanced_rahim_bn.png'));
          }

          // Check sub-tab Adaptive Replan
          await cdp.eval(`
            (() => {
              const advancedNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('উন্নত'));
              if (advancedNav) advancedNav.click();
            })()
          `);
          await sleep(1000);
          await cdp.eval(`
            (() => {
              const subNavs = Array.from(document.querySelectorAll('.sub-nav-item, button'));
              const replanTab = subNavs.find(el => el.textContent.includes('অভিযোজন') || el.textContent.includes('পুনঃপরিকল্পনা'));
              if (replanTab) replanTab.click();
            })()
          `);
          await sleep(2500);

          if (cfg.fieldId === 251) {
            await cdp.captureScreenshot(path.join(SCREENS_DIR, 'replan_balanced_rahim_bn.png'));
          }

          // Switch to Water Saving
          await cdp.eval(`
            (() => {
              const btns = Array.from(document.querySelectorAll('button'));
              const waterBtn = btns.find(b => b.textContent.includes('পানি সাশ্রয়'));
              if (waterBtn) waterBtn.click();
            })()
          `);
          await sleep(1500);

          if (cfg.fieldId === 251) {
            await cdp.captureScreenshot(path.join(SCREENS_DIR, 'replan_water_star_rahim_bn.png'));
          }

          const replanText = await extractPageText();
          for (const banned of BANNED_BN_WORDS) {
            if (replanText.includes(banned)) {
              problems.push(`[BN][${cfg.fieldName}][Adaptive Replan] Found forbidden English phrase: "${banned}"`);
              problemsCount++;
            }
          }
        }
      }

      // 2. ENGLISH MODE
      console.log(`\n--- [EN] English Mode (${cfg.fieldName}) ---`);
      await cdp.eval(`
        (() => {
          localStorage.setItem('fieldshift_lang', 'en');
          localStorage.setItem('fieldshift_theme', 'light');
          localStorage.setItem('fs_selected_field_id', '${cfg.fieldId}');
          localStorage.setItem('fs_selected_field_id_323', '${cfg.fieldId}');
        })()
      `);
      await cdp.eval(`window.location.reload();`);
      await sleep(3500);

      for (const dest of DESTINATIONS) {
        await navigateTo(dest.nav);
        await sleep(1500);

        const pageText = await extractPageText();
        const cleanedText = cleanEnText(pageText);

        for (const banned of BANNED_EN_WORDS) {
          if (cleanedText.includes(banned)) {
            problems.push(`[EN][${cfg.fieldName}][${dest.name}] Found forbidden Bangla phrase: "${banned}"`);
            problemsCount++;
          }
        }

        const banglaRegex = /[\u0980-\u09FF]+/g;
        const strayBn = cleanedText.match(banglaRegex);
        if (strayBn && strayBn.length > 0) {
          const uniqueStray = Array.from(new Set(strayBn));
          problems.push(`[EN][${cfg.fieldName}][${dest.name}] Found unhandled Bengali words: ${uniqueStray.slice(0, 10).join(', ')}`);
          problemsCount++;
        }

        if (dest.nav === 'farm_planning') {
          if (cfg.fieldId === 251) {
            await cdp.captureScreenshot(path.join(SCREENS_DIR, 'planner_balanced_rahim_en_light.png'));
            // Switch to Dark Theme
            await cdp.eval(`
              (() => {
                const toggle = document.querySelector('.theme-toggle-btn, [aria-label*="theme"], [title*="Theme"], [title*="Dark"], [title*="ডার্ক"]');
                if (toggle) toggle.click();
              })()
            `);
            await sleep(1000);
            await cdp.captureScreenshot(path.join(SCREENS_DIR, 'planner_balanced_rahim_en_dark.png'));
            // Switch back to light
            await cdp.eval(`
              (() => {
                const toggle = document.querySelector('.theme-toggle-btn, [aria-label*="theme"], [title*="Theme"], [title*="Dark"], [title*="ডার্ক"]');
                if (toggle) toggle.click();
              })()
            `);
            await sleep(1000);
          }

          // Check Adaptive Replan in EN
          await cdp.eval(`
            (() => {
              const advancedNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('Advanced'));
              if (advancedNav) advancedNav.click();
            })()
          `);
          await sleep(1000);
          await cdp.eval(`
            (() => {
              const subNavs = Array.from(document.querySelectorAll('.sub-nav-item, button'));
              const replanTab = subNavs.find(el => el.textContent.includes('Adaptive') || el.textContent.includes('Replan'));
              if (replanTab) replanTab.click();
            })()
          `);
          await sleep(2500);

          await cdp.eval(`
            (() => {
              const btns = Array.from(document.querySelectorAll('button'));
              const waterBtn = btns.find(b => b.textContent.includes('Water Saving'));
              if (waterBtn) waterBtn.click();
            })()
          `);
          await sleep(1500);

          if (cfg.fieldId === 251) {
            await cdp.captureScreenshot(path.join(SCREENS_DIR, 'replan_water_star_rahim_en.png'));
          }

          const replanTextEn = await extractPageText();
          const cleanedReplan = cleanEnText(replanTextEn);
          for (const banned of BANNED_EN_WORDS) {
            if (cleanedReplan.includes(banned)) {
              problems.push(`[EN][${cfg.fieldName}][Adaptive Replan] Found forbidden Bangla phrase: "${banned}"`);
              problemsCount++;
            }
          }

          const strayReplan = cleanedReplan.match(banglaRegex);
          if (strayReplan && strayReplan.length > 0) {
            const uniqueStray = Array.from(new Set(strayReplan));
            problems.push(`[EN][${cfg.fieldName}][Adaptive Replan] Found unhandled Bengali words: ${uniqueStray.slice(0, 10).join(', ')}`);
            problemsCount++;
          }
        }
      }
    }

    cdp.close();
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }

  console.log('\n==============================================================');
  console.log(`LANGUAGE CHECK RESULTS: ${problemsCount} problems`);
  console.log('==============================================================');
  if (problemsCount > 0) {
    for (const p of problems) {
      console.error(`❌ ${p}`);
    }
    process.exit(1);
  } else {
    console.log('✅ ALL VIEWS STRICTLY RESPECT SINGLE-LANGUAGE PURITY (0 problems).');
    process.exit(0);
  }
}

runCheck().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
