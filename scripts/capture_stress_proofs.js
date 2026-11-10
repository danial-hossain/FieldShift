import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9253;
const OUT_DIR = 'h:\\FieldShift2026\\docs\\screens\\stress';
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';

fs.mkdirSync(OUT_DIR, { recursive: true });

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

  async captureScreenshot(filename) {
    const outPath = path.join(OUT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    const res = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outPath, buffer);
    fs.writeFileSync(artifactPath, buffer);
    const sizeKb = (buffer.length / 1024).toFixed(1);
    console.log(`Saved screenshot: ${filename} (${sizeKb} KB)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Launching headless Chrome on port', CDP_PORT);
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
    const pageTarget = targets?.find(t => t.url.includes('3000'));
    if (!pageTarget) throw new Error('Page target not found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Authenticating...');
    await cdp.eval(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
      })()
    `);

    // Helper to setup page state and navigate to stress tab
    async function setupAndNavigate({ lang = 'bn', theme = 'light' }) {
      await cdp.eval(`
        (() => {
          localStorage.setItem('fieldshift_lang', '${lang}');
          localStorage.setItem('fieldshift_theme', '${theme}');
          localStorage.setItem('fieldshift_last_field_id', '251');
          localStorage.setItem('fs_selected_field_id', '251');
          document.documentElement.setAttribute('data-theme', '${theme}');
        })()
      `);
      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
      await sleep(2500);

      // Click farm_planning nav
      await cdp.eval(`
        (() => {
          const btn = document.querySelector('button[data-nav="farm_planning"]');
          if (btn) btn.click();
        })()
      `);
      await sleep(2000);

      // Click stress sub-tab
      await cdp.eval(`
        (() => {
          const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
          const stressTab = tabs.find(t => t.textContent.includes('চাপ') || t.textContent.includes('Stress'));
          if (stressTab) stressTab.click();
        })()
      `);
      await sleep(2500);
    }

    // 1. Heatwave Before (Light, Bn)
    console.log('\n--- 1. Heatwave Before (Light, Bn) ---');
    await setupAndNavigate({ lang: 'bn', theme: 'light' });
    // Click 'আগে' button
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const beforeBtn = btns.find(b => b.textContent.trim() === 'আগে' || b.textContent.includes('দুর্যোগের আগে') || b.textContent.includes('Before Shock'));
        if (beforeBtn) beforeBtn.click();
      })()
    `);
    await sleep(1500);
    await cdp.captureScreenshot('heatwave_before_light_bn.png');

    // 2. Heatwave After (Light, Bn)
    console.log('\n--- 2. Heatwave After (Light, Bn) ---');
    // Click 'পরে' button
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const afterBtn = btns.find(b => b.textContent.trim() === 'পরে' || b.textContent.includes('দুর্যোগের পরে') || b.textContent.includes('After Shock'));
        if (afterBtn) afterBtn.click();
      })()
    `);
    await sleep(1500);
    await cdp.captureScreenshot('heatwave_after_light_bn.png');

    // 3. Heatwave After (Dark, Bn)
    console.log('\n--- 3. Heatwave After (Dark, Bn) ---');
    await setupAndNavigate({ lang: 'bn', theme: 'dark' });
    await sleep(1500);
    await cdp.captureScreenshot('heatwave_after_dark_bn.png');

    // 4. Heatwave After (Light, En)
    console.log('\n--- 4. Heatwave After (Light, En) ---');
    await setupAndNavigate({ lang: 'en', theme: 'light' });
    await sleep(1500);
    await cdp.captureScreenshot('heatwave_after_light_en.png');

    // 5. Drought After (Light, Bn)
    console.log('\n--- 5. Drought After (Light, Bn) ---');
    await setupAndNavigate({ lang: 'bn', theme: 'light' });
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const dBtn = btns.find(b => b.textContent.includes('খরা') || b.textContent.includes('Drought'));
        if (dBtn) dBtn.click();
      })()
    `);
    await sleep(2500);
    await cdp.captureScreenshot('drought_after_light_bn.png');

    // 6. Flood After (Light, Bn)
    console.log('\n--- 6. Flood After (Light, Bn) ---');
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const fBtn = btns.find(b => b.textContent.includes('বন্যা') || b.textContent.includes('Flood'));
        if (fBtn) fBtn.click();
      })()
    `);
    await sleep(2500);
    await cdp.captureScreenshot('flood_after_light_bn.png');

    // 7. Coldwave After (Light, Bn)
    console.log('\n--- 7. Coldwave After (Light, Bn) ---');
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const cBtn = btns.find(b => b.textContent.includes('শৈত্যপ্রবাহ') || b.textContent.includes('Coldwave'));
        if (cBtn) cBtn.click();
      })()
    `);
    await sleep(2500);
    await cdp.captureScreenshot('coldwave_after_light_bn.png');

    // 8. Salinity After (Light, Bn)
    console.log('\n--- 8. Salinity After (Light, Bn) ---');
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const sBtn = btns.find(b => b.textContent.includes('লবণাক্ততা') || b.textContent.includes('Salinity'));
        if (sBtn) sBtn.click();
      })()
    `);
    await sleep(2500);
    await cdp.captureScreenshot('salinity_after_light_bn.png');

    console.log('\nAll 8 screenshots captured successfully!');
    cdp.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(err => {
  console.error('Error running capture script:', err);
  process.exit(1);
});
