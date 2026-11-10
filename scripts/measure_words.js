import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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
  close() {
    if (this.ws) this.ws.close();
  }
}

const PAGES = [
  { id: 'dashboard', nav: 'dashboard' },
  { id: 'field', nav: 'field' },
  { id: 'crop_advice', nav: 'crop_advice' },
  { id: 'weather', nav: 'weather' },
  { id: 'farm_planning', nav: 'farm_planning' },
  { id: 'water_irrigation', nav: 'water_irrigation' },
  { id: 'research', nav: 'research' },
  { id: 'harvest_profit', nav: 'harvest_profit' },
  { id: 'data_evidence', nav: 'data_evidence' }
];

async function measure() {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9455',
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
        const listRes = await fetch('http://127.0.0.1:9455/json/list');
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

    const results = {};
    for (const p of PAGES) {
      await cdp.eval(`
        (() => {
          const item = Array.from(document.querySelectorAll('.sidebar .nav-item'))
            .find(el => el.getAttribute('data-nav') === '${p.nav}');
          if (item) item.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 1200));

      const count = await cdp.eval(`
        (() => {
          const main = document.querySelector('.main-wrapper') || document.body;
          const text = main.innerText || '';
          const words = text.trim().split(/\\s+/).filter(Boolean);
          return words.length;
        })()
      `);
      results[p.id] = count;
      console.log(`Page ${p.id}: ${count} words`);
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`TOTAL WORDS: ${total}`);
    fs.writeFileSync('scripts/baseline_words.json', JSON.stringify({ results, total }, null, 2));
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

measure().catch(err => {
  console.error(err);
  process.exit(1);
});
