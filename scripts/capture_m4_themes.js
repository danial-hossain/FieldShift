import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'docs', 'visual_test', 'screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome not found');
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
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function capture() {
  const chromePath = findChrome();
  const tmpProfile = path.join(REPO_ROOT, 'scratch', 'chrome_m3_profile');
  if (!fs.existsSync(tmpProfile)) fs.mkdirSync(tmpProfile, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${tmpProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900'
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      try {
        const res = await fetch('http://localhost:9223/json');
        const list = await res.json();
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          wsUrl = list[0].webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }
    if (!wsUrl) throw new Error('Could not connect to Chrome debugging port');

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1500);

    await cdp.send('Runtime.evaluate', {
      expression: `
        (async function() {
          localStorage.setItem('fieldshift_lang', 'bn');
          document.documentElement.removeAttribute('data-theme');
          localStorage.removeItem('fieldshift-theme');
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'evaluator@fieldshift.local',
              password: 'EvaluationPass2026!'
            })
          });
        })()
      `,
      awaitPromise: true
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/?lang=bn' });
    await sleep(2500);

    // Navigate to My Farm
    console.log('Navigating to My Farm...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const items = Array.from(document.querySelectorAll('.nav-item'));
        const f = items.find(el => el.textContent.includes('আমার জমি') || el.textContent.includes('My Farm'));
        if (f) f.click();
      })()`
    });
    await sleep(1000);

    // Switch to Parcels tab
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button, .tab-btn, .pill-btn, [role="tab"]'));
        const p = tabs.find(b => b.textContent.includes('জমির তালিকা') || b.textContent.includes('Parcels'));
        if (p) p.click();
      })()`
    });
    await sleep(1500);

    // Dark Mode Verification
    const darkCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.querySelector('.parcel-hero-banner');
        const grid = document.querySelector('.parcel-main-grid');
        const stage = document.querySelector('.parcel-stage-card');
        const soil = document.querySelector('.parcel-soil-deck');
        const db = document.querySelector('.profile-card-section');
        const select = document.querySelector('.header-field-selector select');
        const legendBoxes = Array.from(document.querySelectorAll('.fraction-legend-box'));
        const activeTab = document.querySelector('.stage-mode-btn.active');
        return {
          hero: !!hero,
          grid: !!grid,
          stage: !!stage,
          soil: !!soil,
          db: !!db,
          selectFound: !!select,
          optionsCount: select ? select.options.length : 0,
          legendBoxesCount: legendBoxes.length,
          activeTabColor: activeTab ? window.getComputedStyle(activeTab).color : null,
          activeTabBg: activeTab ? window.getComputedStyle(activeTab).backgroundColor : null,
          legendBoxBg: legendBoxes.length ? window.getComputedStyle(legendBoxes[0]).backgroundColor : null,
          legendBoxColor: legendBoxes.length ? window.getComputedStyle(legendBoxes[0]).color : null,
          selectBg: select ? window.getComputedStyle(select).backgroundColor : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Dark Theme Elements:', JSON.stringify(darkCheck.result.value, null, 2));

    // Focus header select
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const sel = document.querySelector('.header-field-selector select');
        if (sel) sel.focus();
      })()`
    });
    await sleep(500);

    // 1. Screenshot Dark Theme with dropdown focused
    const darkShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm4_myfarm_dark_dropdown.png'), Buffer.from(darkShot.data, 'base64'));
    console.log('Saved screenshot: m4_myfarm_dark_dropdown.png');

    // 2. Switch to Light Mode
    console.log('Switching to Light Theme...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('fieldshift-theme', 'light');
        const sel = document.querySelector('.header-field-selector select');
        if (sel) sel.focus();
      })()`
    });
    await sleep(1000);

    const lightCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const select = document.querySelector('.header-field-selector select');
        const legendBoxes = Array.from(document.querySelectorAll('.fraction-legend-box'));
        const activeTab = document.querySelector('.stage-mode-btn.active');
        return {
          theme: document.documentElement.getAttribute('data-theme'),
          activeTabColor: activeTab ? window.getComputedStyle(activeTab).color : null,
          activeTabBg: activeTab ? window.getComputedStyle(activeTab).backgroundColor : null,
          legendBoxBg: legendBoxes.length ? window.getComputedStyle(legendBoxes[0]).backgroundColor : null,
          legendBoxColor: legendBoxes.length ? window.getComputedStyle(legendBoxes[0]).color : null,
          selectBg: select ? window.getComputedStyle(select).backgroundColor : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Light Theme Elements:', JSON.stringify(lightCheck.result.value, null, 2));

    // Screenshot 2: Light theme with dropdown focused
    const lightShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm4_myfarm_light_dropdown.png'), Buffer.from(lightShot.data, 'base64'));
    console.log('Saved screenshot: m4_myfarm_light_dropdown.png');

    // 3. Switch to Mobile Viewport 390px
    console.log('Switching to Mobile 390px Viewport...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(1000);

    const mobileCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const hero = !!document.querySelector('.parcel-hero-banner');
        const grid = !!document.querySelector('.parcel-main-grid');
        const db = !!document.querySelector('.profile-card-section');
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        return {
          hero, grid, db,
          scrollWidth, clientWidth,
          hasHorizontalScroll: scrollWidth > clientWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Check (390px):', JSON.stringify(mobileCheck.result.value, null, 2));

    const mobileShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm4_myfarm_mobile.png'), Buffer.from(mobileShot.data, 'base64'));
    console.log('Saved screenshot: m4_myfarm_mobile.png');

    cdp.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

capture().catch(err => {
  console.error('M4 capture error:', err);
  process.exit(1);
});
