import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.resolve('docs/screens/text_reduction');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

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
  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 90 });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  }
  close() {
    if (this.ws) this.ws.close();
  }
}

async function captureScreenshots(stage = 'before') {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9456',
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
        const listRes = await fetch('http://127.0.0.1:9456/json/list');
        const tabs = await listRes.json();
        wsUrl = tabs[0]?.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch {}
    }

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 2500));

    const TARGETS = [
      { id: 'planner', nav: 'farm_planning' },
      { id: 'climate', nav: 'weather' },
      { id: 'market', nav: 'harvest_profit' }
    ];

    for (const lang of ['en', 'bn']) {
      await cdp.eval(`
        (() => {
          localStorage.setItem('fieldshift_lang', '${lang}');
          location.reload();
        })()
      `);
      await new Promise(r => setTimeout(r, 2500));

      for (const t of TARGETS) {
        await cdp.eval(`
          (() => {
            const item = Array.from(document.querySelectorAll('.sidebar .nav-item'))
              .find(el => el.getAttribute('data-nav') === '${t.nav}');
            if (item) item.click();
          })()
        `);
        await new Promise(r => setTimeout(r, 1500));
        await cdp.screenshot(path.join(OUT_DIR, `${stage}_${t.id}_${lang}.png`));
      }
    }

    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

const stageArg = process.argv[2] || 'before';
captureScreenshots(stageArg).catch(err => {
  console.error(err);
  process.exit(1);
});
