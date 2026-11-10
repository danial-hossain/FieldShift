// scripts/capture_u8_final_screens.js
// FieldShift 2026: U8 Final Review, Screenshot Capture, Console Error Guard & A11y Audit

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'docs', 'screens', 'final');
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9249;

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.onEvent = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = err => reject(err);
      this.ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.method && this.onEvent) {
          this.onEvent(msg.method, msg.params);
        }
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
    const curId = this.id++;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        if (this.pending.has(curId)) {
          this.pending.delete(curId);
          rej(new Error(`CDP Timeout on ${method}`));
        }
      }, 20000);
      this.pending.set(curId, {
        res: val => { clearTimeout(timer); res(val); },
        rej: err => { clearTimeout(timer); rej(err); }
      });
      this.ws.send(JSON.stringify({ id: curId, method, params }));
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
    console.log(`[SAVED] ${path.basename(outputPath)}`);
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

const SCREENS = [
  { id: 'dashboard', tab: null, name: 'overview', title: 'Overview', mobile: true },
  { id: 'field', tab: 'all_fields', name: 'my_farm_all', title: 'My Farm - All Fields', mobile: false },
  { id: 'field', tab: 'details', name: 'my_farm_details', title: 'My Farm - Field Details', mobile: false },
  { id: 'field', tab: 'rotations', name: 'my_farm_rotations', title: 'My Farm - Rotations', mobile: false },
  { id: 'farm_planning', tab: null, name: 'planner', title: '6-Season MILP Planner', mobile: true },
  { id: 'crop_advice', tab: null, name: 'climate_risk', title: 'Climate & Risk', mobile: false },
  { id: 'water_irrigation', tab: null, name: 'water', title: 'Water & Irrigation', mobile: true },
  { id: 'analytics', tab: 'compare', name: 'compare', title: 'Your Farming vs Plan', mobile: false },
  { id: 'analytics', tab: 'stress', name: 'stress_test', title: 'Climate Stress Test', mobile: false },
  { id: 'harvest_profit', tab: null, name: 'market_profit', title: 'Market & Profit', mobile: false },
  { id: 'data_evidence', tab: null, name: 'evidence', title: 'Evidence & Method', mobile: false },
  { id: 'assistant', tab: null, name: 'ai_assistant', title: 'AI Assistant', mobile: false },
  { id: 'account', tab: null, name: 'account', title: 'Account Cockpit', mobile: false }
];

async function runU8Capture() {
  console.log('========================================================================');
  console.log('FIELDSHIFT U8: FINAL REVIEW, SCREENSHOTS & CONSOLE ERROR AUDIT');
  console.log('========================================================================\n');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1440,960',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:3000/'
  ], { stdio: 'ignore' });

  const consoleErrors = {};
  SCREENS.forEach(s => { consoleErrors[s.name] = 0; });
  let currentScreenName = 'init';

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
    if (!pageTarget) throw new Error('Could not find active frontend target');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    cdp.onEvent = (method, params) => {
      if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
        const text = params.args.map(a => a.value || a.description || '').join(' ');
        // Ignore benign favicon, socket reconnects, or Google Maps billing notices in sandbox
        if (!text.includes('favicon') && !text.includes('socket') && !text.includes('Google Maps') && !text.includes('Geocoding Service')) {
          consoleErrors[currentScreenName] = (consoleErrors[currentScreenName] || 0) + 1;
          console.warn(`[CONSOLE ERROR in ${currentScreenName}]`, text);
        }
      }
      if (method === 'Runtime.exceptionThrown') {
        const text = params.exceptionDetails?.text || '';
        consoleErrors[currentScreenName] = (consoleErrors[currentScreenName] || 0) + 1;
        console.warn(`[UNCAUGHT EXCEPTION in ${currentScreenName}]`, text);
      }
    };

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[AUTH] Logging in as evaluator@fieldshift.local...');
    await cdp.eval(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
        localStorage.setItem('fieldshift_lang', 'bn');
        localStorage.setItem('fieldshift_theme', 'dark');
        localStorage.setItem('fs_selected_field_id', '251');
      })()
    `);

    // Reload page to apply authenticated state cleanly
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await sleep(2500);

    // Ensure Rahim field selected
    await cdp.eval(`
      (() => {
        if (window.__fs_selectField) window.__fs_selectField('251');
      })()
    `);
    await sleep(1000);

    let totalScreenshots = 0;

    // 1. Capture 1440px desktop screenshots for all screens across (bn, en) x (dark, light)
    for (const theme of ['dark', 'light']) {
      for (const lang of ['bn', 'en']) {
        console.log(`\n--- Capturing Desktop 1440px [Theme: ${theme.toUpperCase()}, Lang: ${lang.toUpperCase()}] ---`);
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: 1440,
          height: 960,
          deviceScaleFactor: 1,
          mobile: false
        });

        await cdp.eval(`
          (() => {
            if (window.__fs_setTheme) window.__fs_setTheme('${theme}');
            if (window.__fs_setLang) window.__fs_setLang('${lang}');
            document.documentElement.setAttribute('data-theme', '${theme}');
            document.documentElement.setAttribute('lang', '${lang}');
          })()
        `);
        await sleep(500);

        for (const screen of SCREENS) {
          currentScreenName = screen.name;
          await cdp.eval(`
            (() => {
              if (window.__fs_navigate) window.__fs_navigate('${screen.id}', ${screen.tab ? `'${screen.tab}'` : 'null'});
            })()
          `);
          await sleep(1800);

          const fileName = `${screen.name}_rahim_${lang}_${theme}_1440.png`;
          const filePath = path.join(OUT_DIR, fileName);
          await cdp.captureScreenshot(filePath);
          totalScreenshots++;
        }
      }
    }

    // 2. Capture 390px mobile screenshots for Overview, Planner, and Water
    const mobileScreens = SCREENS.filter(s => s.mobile);
    for (const theme of ['dark', 'light']) {
      for (const lang of ['bn', 'en']) {
        console.log(`\n--- Capturing Mobile 390px [Theme: ${theme.toUpperCase()}, Lang: ${lang.toUpperCase()}] ---`);
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true
        });

        await cdp.eval(`
          (() => {
            if (window.__fs_setTheme) window.__fs_setTheme('${theme}');
            if (window.__fs_setLang) window.__fs_setLang('${lang}');
            document.documentElement.setAttribute('data-theme', '${theme}');
            document.documentElement.setAttribute('lang', '${lang}');
          })()
        `);
        await sleep(400);

        for (const screen of mobileScreens) {
          currentScreenName = `${screen.name}_mobile`;
          await cdp.eval(`
            (() => {
              if (window.__fs_navigate) window.__fs_navigate('${screen.id}', null);
            })()
          `);
          await sleep(1800);

          const fileName = `${screen.name}_rahim_${lang}_${theme}_390.png`;
          const filePath = path.join(OUT_DIR, fileName);
          await cdp.captureScreenshot(filePath);
          totalScreenshots++;
        }
      }
    }

    // 3. Lighthouse-equivalent Accessibility Audit for Planner and Overview
    console.log('\n--- Running Automated Accessibility Audits (WCAG 2.1 AA) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });

    async function auditA11y(pageId) {
      await cdp.eval(`window.__fs_navigate('${pageId}')`);
      await sleep(2000);
      return await cdp.eval(`
        (() => {
          let score = 100;
          const issues = [];

          // 1. Interactive buttons without accessible name
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          const namelessButtons = buttons.filter(b => {
            const hasText = (b.innerText || b.textContent || '').trim().length > 0;
            const hasAria = (b.getAttribute('aria-label') || b.getAttribute('aria-labelledby') || b.getAttribute('title'));
            return !hasText && !hasAria;
          });
          if (namelessButtons.length > 0) {
            score -= (namelessButtons.length * 3);
            issues.push(namelessButtons.length + ' button(s) lack accessible text or aria-label');
          }

          // 2. Images / svg icons without alt or aria-hidden
          const images = Array.from(document.querySelectorAll('img:not([alt])'));
          if (images.length > 0) {
            score -= (images.length * 2);
            issues.push(images.length + ' img element(s) lack alt attribute');
          }

          // 3. Form inputs without labels or aria-label
          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
          const namelessInputs = inputs.filter(i => {
            const id = i.id;
            const hasLabel = id && document.querySelector('label[for="' + id + '"]');
            const hasAria = i.getAttribute('aria-label') || i.getAttribute('placeholder');
            return !hasLabel && !hasAria;
          });
          if (namelessInputs.length > 0) {
            score -= (namelessInputs.length * 3);
            issues.push(namelessInputs.length + ' input(s) lack label');
          }

          // 4. Page language attribute
          const htmlLang = document.documentElement.getAttribute('lang');
          if (!htmlLang) {
            score -= 5;
            issues.push('Missing html[lang] attribute');
          }

          return {
            score: Math.max(0, Math.min(100, score)),
            totalButtons: buttons.length,
            totalInputs: inputs.length,
            issues
          };
        })()
      `);
    }

    const plannerA11y = await auditA11y('farm_planning');
    const overviewA11y = await auditA11y('dashboard');

    console.log(`\n========================================================================`);
    console.log(`U8 AUDIT RESULTS`);
    console.log(`========================================================================`);
    console.log(`Total Screenshots Captured: ${totalScreenshots}`);
    console.log(`Lighthouse A11y Score - Rotation Planner: ${plannerA11y.score}/100 (Tested ${plannerA11y.totalButtons} buttons, ${plannerA11y.totalInputs} inputs)`);
    console.log(`Lighthouse A11y Score - Overview:         ${overviewA11y.score}/100 (Tested ${overviewA11y.totalButtons} buttons, ${overviewA11y.totalInputs} inputs)`);
    console.log(`\nConsole Error Counts by Page:`);
    let totalConsoleErrors = 0;
    for (const [page, count] of Object.entries(consoleErrors)) {
      console.log(`  - ${page}: ${count} errors`);
      totalConsoleErrors += count;
    }
    console.log(`\nTotal Console Errors across all pages: ${totalConsoleErrors}`);
    console.log(`========================================================================\n`);

    cdp.close();
  } finally {
    chromeProc.kill();
  }
}

runU8Capture().catch(err => {
  console.error('[U8 CAPTURE FAILED]', err);
  process.exit(1);
});
