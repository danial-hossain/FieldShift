import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9254;
const OUT_DIR = 'h:\\FieldShift2026\\docs\\screens\\climate';
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

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
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

    async function setupAndNavigate({ fieldId = '251', lang = 'bn', theme = 'dark', width = 1440, height = 1100 }) {
      await cdp.setViewport(width, height);
      await cdp.eval(`
        (() => {
          localStorage.setItem('fieldshift_lang', '${lang}');
          localStorage.setItem('fieldshift_theme', '${theme}');
          localStorage.setItem('fieldshift_last_field_id', '${fieldId}');
          localStorage.setItem('fs_selected_field_id', '${fieldId}');
          localStorage.setItem('fs_selected_field_id_323', '${fieldId}');
          document.documentElement.setAttribute('data-theme', '${theme}');
        })()
      `);
      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
      await sleep(2000);

      // Click weather nav item
      await cdp.eval(`
        (() => {
          const btn = document.querySelector('button[data-nav="weather"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('আবহাওয়া') || b.textContent.includes('Weather'));
          if (btn) btn.click();
        })()
      `);
      await sleep(1500);

      // If the field switcher exists, we can also ensure the field is selected directly:
      await cdp.eval(`
        (() => {
          const selects = Array.from(document.querySelectorAll('select'));
          const fSelect = selects.find(s => Array.from(s.options).some(o => o.value === '${fieldId}'));
          if (fSelect && fSelect.value !== '${fieldId}') {
            fSelect.value = '${fieldId}';
            fSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        })()
      `);
      await sleep(1500);

      // Ensure data is loaded
      for (let i = 0; i < 20; i++) {
        const isLoaded = await cdp.eval(`
          (() => {
            const h = document.querySelector('.climate-risk-view h2');
            return !!h;
          })()
        `);
        if (isLoaded) break;
        await sleep(300);
      }
      await sleep(1000);

      const title = await cdp.eval(`document.querySelector('.climate-risk-view h1')?.textContent`);
      console.log('Rendered view heading:', title);
    }

    console.log('\n--- 1. Rahim Dark Bn 1440 ---');
    await setupAndNavigate({ fieldId: '251', lang: 'bn', theme: 'dark', width: 1440, height: 1100 });
    await cdp.captureScreenshot('climate_rahim_dark_bn_1440.png');

    console.log('\n--- 2. Rahim Light Bn 1440 ---');
    await setupAndNavigate({ fieldId: '251', lang: 'bn', theme: 'light', width: 1440, height: 1100 });
    await cdp.captureScreenshot('climate_rahim_light_bn_1440.png');

    console.log('\n--- 3. Rahim Light En 1440 ---');
    await setupAndNavigate({ fieldId: '251', lang: 'en', theme: 'light', width: 1440, height: 1100 });
    await cdp.captureScreenshot('climate_rahim_light_en_1440.png');

    console.log('\n--- 4. Rahim Dark Bn 390 ---');
    await setupAndNavigate({ fieldId: '251', lang: 'bn', theme: 'dark', width: 390, height: 844 });
    await cdp.captureScreenshot('climate_rahim_dark_bn_390.png');

    console.log('\n--- 5. Sunamganj Dark Bn 1440 ---');
    await setupAndNavigate({ fieldId: '247', lang: 'bn', theme: 'dark', width: 1440, height: 1100 });
    await cdp.captureScreenshot('climate_sunamganj_dark_bn_1440.png');

    console.log('\n--- 6. Sunamganj Light Bn 1440 ---');
    await setupAndNavigate({ fieldId: '247', lang: 'bn', theme: 'light', width: 1440, height: 1100 });
    await cdp.captureScreenshot('climate_sunamganj_light_bn_1440.png');

    console.log('\n--- 7. Sunamganj Light En 1440 ---');
    await setupAndNavigate({ fieldId: '247', lang: 'en', theme: 'light', width: 1440, height: 1100 });
    await cdp.captureScreenshot('climate_sunamganj_light_en_1440.png');

    console.log('\n--- 8. Sunamganj Dark Bn 390 ---');
    await setupAndNavigate({ fieldId: '247', lang: 'bn', theme: 'dark', width: 390, height: 844 });
    await cdp.captureScreenshot('climate_sunamganj_dark_bn_390.png');

    console.log('\nAll 8 climate screenshots captured successfully!');
    cdp.close();
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main();

