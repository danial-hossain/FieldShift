import { spawn } from 'node:child_process';

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
    return res.result?.value;
  }
  close() {
    if (this.ws) this.ws.close();
  }
}

async function inspect() {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9457',
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
        const listRes = await fetch('http://127.0.0.1:9457/json/list');
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
    await new Promise(r => setTimeout(r, 2000));

    // Inspect weather
    await cdp.eval(`
      (() => {
        const item = Array.from(document.querySelectorAll('.sidebar .nav-item'))
          .find(el => el.getAttribute('data-nav') === 'weather');
        if (item) item.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    const weatherText = await cdp.eval(`
      (() => {
        const main = document.querySelector('.main-wrapper') || document.body;
        return main.innerText;
      })()
    `);
    console.log('=== WEATHER INNER TEXT ===\n', weatherText.slice(0, 1500));

    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

inspect();

