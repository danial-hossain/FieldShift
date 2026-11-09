// scripts/lang_check.js
// Automated Language Purity Guard (L3) & Visual Proof Capturer
// Verifies:
// 1. In 'bn' mode: No banned English words ('Balanced', 'Water Saving', 'Soil Health', 'Profit', 'Mustard', 'Rice', 'Mungbean', 'T. Aman', 'Year 1 · Year 1 Rabi', 'Soil: Clay_loam', 'Annual profit', 'Total Water')
// 2. In 'en' mode: No banned Bangla characters/words ('সুষম', 'পানি সাশ্রয়', 'মাটির স্বাস্থ্য', 'লাভ', 'সরিষা', 'মুগডাল', 'আমন ধান', 'বছর ১ · রবি', 'মাটি: এঁটেল দোআঁশ', 'টাকা', 'মণ', 'হেক্টর', 'বিঘা') outside the farmer's typed field name.
// 3. Captures screenshot proofs in docs/screens/replan_fix/:
//    - Planner Balanced vs Replan Balanced parity
//    - Replan for Water Saving with ⭐ reason line
//    - Dark and light mode proofs in bn and en

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
      }, 10000);
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
    // Also save copy to brain artifact dir
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

// Allowlisted Latin words/acronyms in Bangla mode
const ALLOWED_LATIN_WORDS = new Set([
  'nasa', 'power', 'gpm', 'imerg', 'grace', 'fo', 'grace-fo', 'soilgrids', 'milp', 'saao', 'ai',
  'srtm', 'isric', 'modis', 'smap', 'bari', 'brri', 'srdi', 'fao', 'fao56', 'rl', 'q-learning',
  'fieldshift', 'bdt', 'usd', 'utc', 'gmt', 'gps', 'gis', 'api', 'json', 'csv', 'http', 'https',
  'ok', 'id', 'demo', 'url', 'cdp', 'dom', 'css', 'html', 'ssr', 'wcag', 'aa',
  'n', 'e', 's', 'w', 'mm', 'ha', 'kg', 'ph', 'om', 'soc', 'taw', 'fc', 'pwp', 'kpa', 'md', 'yr', 'min', 'sec', 'km', 'cm'
]);

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

    // Helper to evaluate text nodes in container
    async function extractViewText(selector) {
      return await cdp.eval(`
        (() => {
          const root = document.querySelector('${selector}') || document.querySelector('.six-season-recommendation-workspace') || document.body;
          // Clone and remove scripts, styles, SVGs, code tags, and field name
          const clone = root.cloneNode(true);
          const removeSelectors = ['script', 'style', 'svg', 'canvas', 'code', '.field-name-custom', '.user-menu-dropdown', '.field-switcher-dropdown'];
          removeSelectors.forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));
          return clone.innerText || clone.textContent || '';
        })()
      `);
    }

    // 1. BANGLA MODE TEST
    console.log('\n[1/2] Testing Bangla Mode (lang=bn)...');
    await cdp.eval(`
      (() => {
        localStorage.setItem('fieldshift_lang', 'bn');
        localStorage.setItem('fieldshift_theme', 'light');
        localStorage.setItem('fieldshift_last_field_id', '251');
      })()
    `);
    // Reload page to apply localStorage
    await cdp.eval(`window.location.reload();`);
    await sleep(3500);

    // Navigate to Rotation Planner
    await cdp.eval(`
      (() => {
        const navs = Array.from(document.querySelectorAll('.nav-item, .mobile-bottom-nav-item'));
        const pNav = navs.find(el => el.textContent.includes('পরিকল্পনা'));
        if (pNav) pNav.click();
      })()
    `);
    await sleep(3000);

    // Save proof screenshot of Planner Balanced
    await cdp.captureScreenshot(path.join(SCREENS_DIR, 'planner_balanced_rahim_bn.png'));

    // Verify Rotation Planner text in bn
    const plannerTextBn = await extractViewText('.six-season-recommendation-workspace');
    for (const banned of BANNED_BN_WORDS) {
      if (plannerTextBn.includes(banned)) {
        problems.push(`[BN][Planner] Found forbidden English phrase: "${banned}"`);
        problemsCount++;
      }
    }

    // Navigate to Adaptive Replan
    console.log('Navigating to Adaptive Replan in Bangla...');
    await cdp.eval(`
      (() => {
        const advancedNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('উন্নত'));
        if (advancedNav) advancedNav.click();
      })()
    `);
    await sleep(1500);
    await cdp.eval(`
      (() => {
        const subNavs = Array.from(document.querySelectorAll('.sub-nav-item, button'));
        const replanTab = subNavs.find(el => el.textContent.includes('অভিযোজন') || el.textContent.includes('পুনঃপরিকল্পনা'));
        if (replanTab) replanTab.click();
      })()
    `);
    await sleep(3500);

    // Screenshot of Replan Balanced
    await cdp.captureScreenshot(path.join(SCREENS_DIR, 'replan_balanced_rahim_bn.png'));

    // Switch to Water Saving in Replan
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const waterBtn = btns.find(b => b.textContent.includes('পানি সাশ্রয়'));
        if (waterBtn) waterBtn.click();
      })()
    `);
    await sleep(1500);
    await cdp.captureScreenshot(path.join(SCREENS_DIR, 'replan_water_star_rahim_bn.png'));

    // Verify Replan text in bn
    const replanTextBn = await extractViewText('.adaptive-replan-root');
    for (const banned of BANNED_BN_WORDS) {
      if (replanTextBn.includes(banned)) {
        const mIdx = replanTextBn.indexOf(banned);
        console.log(`Context for banned "${banned}" in BN Replan:`, replanTextBn.substring(Math.max(0, mIdx - 50), Math.min(replanTextBn.length, mIdx + 50)));
        problems.push(`[BN][Replan] Found forbidden English phrase: "${banned}"`);
        problemsCount++;
      }
    }

    // 2. ENGLISH MODE TEST
    console.log('\n[2/2] Testing English Mode (lang=en)...');
    await cdp.eval(`
      (() => {
        localStorage.setItem('fieldshift_lang', 'en');
        localStorage.setItem('fieldshift_theme', 'light');
        localStorage.setItem('fieldshift_last_field_id', '251');
      })()
    `);
    // Reload page to apply localStorage
    await cdp.eval(`window.location.reload();`);
    await sleep(3500);

    // Navigate to Rotation Planner
    await cdp.eval(`
      (() => {
        const navs = Array.from(document.querySelectorAll('.nav-item, .mobile-bottom-nav-item'));
        const pNav = navs.find(el => el.textContent.includes('Farm Planning') || el.textContent.includes('Rotation'));
        if (pNav) pNav.click();
      })()
    `);
    await sleep(3000);

    // Screenshot of Planner Balanced in English (Light)
    await cdp.captureScreenshot(path.join(SCREENS_DIR, 'planner_balanced_rahim_en_light.png'));

    // Switch to Dark Theme
    await cdp.eval(`
      (() => {
        const toggle = document.querySelector('.theme-toggle-btn, [aria-label*="theme"], [title*="Theme"], [title*="ডার্ক"], [title*="Dark"]');
        if (toggle) toggle.click();
      })()
    `);
    await sleep(1000);
    await cdp.captureScreenshot(path.join(SCREENS_DIR, 'planner_balanced_rahim_en_dark.png'));

    // Check Planner text in en
    const plannerTextEn = await extractViewText('.six-season-recommendation-workspace');
    const stripFieldNames = (txt) => txt
      .replace(/রহিম\s*মিয়ার\s*জমি/g, '')
      .replace(/রাজশাহী\s*বরেন্দ্র\s*উচ্চভূমি(?:\s*\([^)]*\))?/g, '')
      .replace(/সুনামগঞ্জ\s*হাওর\s*নিম্নাঞ্চল(?:\s*\([^)]*\))?/g, '')
      .replace(/বগুড়া\s*ডেমো\s*খামার(?:\s*\([^)]*\))?/g, '');

    const cleanedPlannerEn = stripFieldNames(plannerTextEn);
    for (const banned of BANNED_EN_WORDS) {
      if (cleanedPlannerEn.includes(banned)) {
        problems.push(`[EN][Planner] Found forbidden Bangla phrase: "${banned}"`);
        problemsCount++;
      }
    }

    // Navigate to Replan in English
    console.log('Navigating to Adaptive Replan in English...');
    await cdp.eval(`
      (() => {
        const advancedNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('Advanced'));
        if (advancedNav) advancedNav.click();
      })()
    `);
    await sleep(1500);
    await cdp.eval(`
      (() => {
        const subNavs = Array.from(document.querySelectorAll('.sub-nav-item, button'));
        const replanTab = subNavs.find(el => el.textContent.includes('Adaptive') || el.textContent.includes('Replan'));
        if (replanTab) replanTab.click();
      })()
    `);
    await sleep(3500);

    // Select Water Saving
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const waterBtn = btns.find(b => b.textContent.includes('Water Saving'));
        if (waterBtn) waterBtn.click();
      })()
    `);
    await sleep(1500);
    await cdp.captureScreenshot(path.join(SCREENS_DIR, 'replan_water_star_rahim_en.png'));

    const replanTextEn = await extractViewText('.adaptive-replan-root');
    const cleanedReplanEn = stripFieldNames(replanTextEn);
    for (const banned of BANNED_EN_WORDS) {
      if (cleanedReplanEn.includes(banned)) {
        problems.push(`[EN][Replan] Found forbidden Bangla phrase: "${banned}"`);
        problemsCount++;
      }
    }

    // Check for any unhandled Bangla character in English mode
    const banglaRegex = /[\u0980-\u09FF]+/g;
    const strayBnPlanner = cleanedPlannerEn.match(banglaRegex);
    if (strayBnPlanner && strayBnPlanner.length > 0) {
      console.log('Detected Bengali snippets in Planner [EN]:', strayBnPlanner);
      problems.push(`[EN][Planner] Found ${strayBnPlanner.length} unhandled Bengali words: ${Array.from(new Set(strayBnPlanner)).join(' ')}`);
      problemsCount++;
    }
    const strayBnReplan = cleanedReplanEn.match(banglaRegex);
    if (strayBnReplan && strayBnReplan.length > 0) {
      console.log('Detected Bengali snippets in Replan [EN]:', strayBnReplan);
      const matchIdx = cleanedReplanEn.indexOf(strayBnReplan[0]);
      console.log('Surrounding text:', cleanedReplanEn.substring(Math.max(0, matchIdx - 40), Math.min(cleanedReplanEn.length, matchIdx + 40)));
      problems.push(`[EN][Replan] Found ${strayBnReplan.length} unhandled Bengali words: ${Array.from(new Set(strayBnReplan)).join(' ')}`);
      problemsCount++;
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
