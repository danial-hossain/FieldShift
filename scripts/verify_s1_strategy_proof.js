import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9248;
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';

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
      this.pending.set(id, { res, rej });
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
    console.log(`Saved screenshot: ${outputPath}`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Launching headless Chrome...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1440,1100',
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
    if (!pageTarget) throw new Error('Page target not found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Logging in...');
    await cdp.eval(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
      })()
    `);

    // Setup Rahim field in Bangla
    console.log('Setting up Rahim field in Bangla...');
    await cdp.eval(`
      (() => {
        localStorage.setItem('fieldshift_lang', 'bn');
        localStorage.setItem('fieldshift_theme', 'light');
        localStorage.setItem('fieldshift_last_field_id', '251');
      })()
    `);
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await sleep(2500);

    // Navigate to Farm Planning
    await cdp.eval(`
      (() => {
        const navItems = Array.from(document.querySelectorAll('.nav-item, .mobile-bottom-nav-item'));
        const planNav = navItems.find(el => el.textContent.includes('পরিকল্পনা') || el.textContent.includes('Farm Planning'));
        if (planNav) planNav.click();
      })()
    `);
    await sleep(3500);

    const shotPath = path.join(ARTIFACT_DIR, 's1_strategy_recommendation_proof_bn.png');
    await cdp.captureScreenshot(shotPath);

    // Also English mode
    console.log('Setting up English mode...');
    await cdp.eval(`
      (() => {
        localStorage.setItem('fieldshift_lang', 'en');
      })()
    `);
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await sleep(2500);
    await cdp.eval(`
      (() => {
        const navItems = Array.from(document.querySelectorAll('.nav-item, .mobile-bottom-nav-item'));
        const planNav = navItems.find(el => el.textContent.includes('Farm Planning') || el.textContent.includes('পরিকল্পনা'));
        if (planNav) planNav.click();
      })()
    `);
    await sleep(3500);

    const shotPathEn = path.join(ARTIFACT_DIR, 's1_strategy_recommendation_proof_en.png');
    await cdp.captureScreenshot(shotPathEn);

    console.log('Verification screenshots captured successfully!');
    cdp.close();
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
