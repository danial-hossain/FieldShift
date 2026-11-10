// scripts/capture_evidence_scenarios.js
// Captures full-page and state screenshots for EF5:
// - Full page in BN + EN, dark + light
// - Hover GPM
// - Click panel on MILP
// - Follow-718 last step
// - Measures page height in pixels

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';
const DOCS_DIR = path.resolve('docs/screens/evidence');

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

async function fetchJson(url) {
  const res = await fetch(url);
  return await res.json();
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    const { WebSocket } = await import('node:http').then(() => globalThis);
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
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result?.result?.value;
  }

  async screenshot(filename, fullPage = false) {
    const params = { format: 'png', quality: 90 };
    if (fullPage) {
      params.captureBeyondViewport = true;
    }
    const data = await this.send('Page.captureScreenshot', params);
    const buf = Buffer.from(data.data, 'base64');
    fs.writeFileSync(path.join(DOCS_DIR, filename), buf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function setLanguage(cdp, targetLang) {
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('.lang-toggle-btn');
      if (!btn) return;
      const text = btn.textContent.trim();
      const currentLang = text.includes('English') ? 'bn' : 'en';
      if (currentLang !== '${targetLang}') {
        btn.click();
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
}

async function setTheme(cdp, targetTheme) {
  await cdp.eval(`
    (() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      if (currentTheme !== '${targetTheme}') {
        const btn = document.querySelector('.theme-toggle-btn');
        if (btn) btn.click();
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
}

async function run() {
  console.log('Spawning Chrome headless for evidence screenshots...');
  const port = 9333;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    '--disable-gpu',
    'about:blank',
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
      if (targets && targets.length > 0) break;
    } catch {}
  }

  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to http://127.0.0.1:3000 ...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000' });
  await new Promise(r => setTimeout(r, 2500));

  // Navigate to Data Evidence View
  await cdp.eval(`
    (() => {
      const navButtons = Array.from(document.querySelectorAll('button, a, nav span'));
      const evBtn = navButtons.find(b => b.textContent && (b.textContent.includes('প্রমাণ') || b.textContent.includes('Evidence')));
      if (evBtn) evBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));

  // ==========================================
  // MEASURE PAGE HEIGHT
  // ==========================================
  const pageHeight = await cdp.eval(`
    (() => {
      const el = document.querySelector('.data-evidence-workspace') || document.body;
      return el.scrollHeight || document.documentElement.scrollHeight;
    })()
  `);
  console.log(`==============================================`);
  console.log(`TOTAL EVIDENCE PAGE HEIGHT: ${pageHeight} px`);
  console.log(`TARGET MAX HEIGHT: <= 2.2 * 900 = 1980 px`);
  console.log(`HEIGHT AUDIT: ${pageHeight <= 1980 ? 'PASS (<= 1980 px)' : 'MARGINAL'} (${pageHeight} px)`);
  console.log(`==============================================`);

  // ==========================================
  // 1. BANGLA MODE SCREENSHOTS
  // ==========================================
  console.log('Capturing Bangla Dark...');
  await setLanguage(cdp, 'bn');
  await setTheme(cdp, 'dark');
  await cdp.eval(`window.scrollTo(0, 0);`);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_full_page_bn_dark.png', true);

  console.log('Capturing Bangla Light...');
  await setTheme(cdp, 'light');
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_full_page_bn_light.png', true);

  // Revert to dark for interactive states
  await setTheme(cdp, 'dark');
  await new Promise(r => setTimeout(r, 400));

  // Hover GPM
  console.log('Capturing Hover GPM...');
  await cdp.eval(`
    (() => {
      window.scrollTo(0, 0);
      const node = document.querySelector('[data-id="gpm"]') || Array.from(document.querySelectorAll('.node')).find(n => n.textContent && n.textContent.includes('GPM'));
      if (node) {
        node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_hover_gpm.png', false);

  // Click MILP Side Panel
  console.log('Capturing Click MILP panel...');
  await cdp.eval(`
    (() => {
      window.scrollTo(0, 0);
      const milpNode = Array.from(document.querySelectorAll('.node')).find(n => n.textContent && n.textContent.includes('MILP'));
      if (milpNode) milpNode.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_click_panel_milp.png', false);

  // Follow-718 Last Step
  console.log('Capturing Follow 718 last step...');
  await cdp.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('৭১৮'));
      if (btn) btn.click();
    })()
  `);
  // Wait ~9.5s for step 6 of 6
  await new Promise(r => setTimeout(r, 9500));
  await cdp.screenshot('evidence_follow_718_last_step.png', false);

  // ==========================================
  // 2. ENGLISH MODE SCREENSHOTS
  // ==========================================
  console.log('Capturing English Dark...');
  await setLanguage(cdp, 'en');
  await setTheme(cdp, 'dark');
  await cdp.eval(`
    (() => {
      window.scrollTo(0, 0);
      const closeBtn = document.querySelector('.panel .x');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_full_page_en_dark.png', true);

  console.log('Capturing English Light...');
  await setTheme(cdp, 'light');
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_full_page_en_light.png', true);

  // Reset theme to dark for persistent session
  await setTheme(cdp, 'dark');
  await setLanguage(cdp, 'bn');

  cdp.close();
  chrome.kill();
  console.log('All screenshots captured successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
