// scripts/capture_market_screens.js
// Capture screenshots for Market & Profit across bn/en x dark/light

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'docs', 'screens', 'market');
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9253;

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

async function capture() {
  console.log('Launching headless Chrome...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1440,1050',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:3000/'
  ], { stdio: 'ignore' });

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
    if (!pageTarget) throw new Error('Could not find active frontend target on port 3000');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Page connected. Navigating to Market & Profit (harvest_profit)...');
    await sleep(2500);

    const combos = [
      { lang: 'bn', theme: 'dark', file: 'market_profit_bn_dark.png' },
      { lang: 'bn', theme: 'light', file: 'market_profit_bn_light.png' },
      { lang: 'en', theme: 'dark', file: 'market_profit_en_dark.png' },
      { lang: 'en', theme: 'light', file: 'market_profit_en_light.png' },
    ];

    for (const { lang, theme, file } of combos) {
      console.log(`Setting state: lang=${lang}, theme=${theme}...`);
      await cdp.eval(`
        (function() {
          try {
            document.documentElement.setAttribute('data-theme', '${theme}');
            localStorage.setItem('fieldshift_theme', '${theme}');
            localStorage.setItem('fieldshift_lang', '${lang}');
          } catch(e) {}
        })()
      `);

      // Trigger navigation to harvest_profit
      await cdp.eval(`
        (function() {
          const navBtns = Array.from(document.querySelectorAll('button, a'));
          const mktBtn = navBtns.find(b => {
            const t = b.textContent || '';
            return t.includes('বাজার ও লাভ') || t.includes('Market & Profit') || t.includes('বাজার') || t.includes('Market');
          });
          if (mktBtn) mktBtn.click();
        })()
      `);

      await sleep(2000);

      // Verify page rendered
      await cdp.eval(`
        (function() {
          const h = document.querySelector('.market-profit-view');
          if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `);
      await sleep(1000);

      const outPath = path.join(OUT_DIR, file);
      await cdp.captureScreenshot(outPath);
    }

    cdp.close();
    console.log('All screenshots captured successfully.');
  } finally {
    try {
      chromeProc.kill('SIGKILL');
    } catch {}
  }
}

capture().catch(err => {
  console.error('Screenshot capture error:', err);
  process.exit(1);
});
