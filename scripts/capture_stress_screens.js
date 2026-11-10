import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found');
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

const HAZARDS = [
  { id: 'heatwave', name: 'Heatwave', bn: 'তাপপ্রবাহ' },
  { id: 'drought', name: 'Drought', bn: 'খরা' },
  { id: 'flood', name: 'Flood', bn: 'বন্যা' },
  { id: 'coldwave', name: 'Coldwave', bn: 'শৈত্যপ্রবাহ' },
  { id: 'salinity', name: 'Salinity', bn: 'লবণাক্ততা' }
];

async function captureScreens() {
  const outDir = path.resolve('docs/screens/stress');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const chromeProc = spawn(findChrome(), [
    '--headless=new',
    '--remote-debugging-port=9485',
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
        const listRes = await fetch('http://127.0.0.1:9485/json/list');
        const tabs = await listRes.json();
        wsUrl = tabs[0]?.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome debugging endpoint');

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const lang of ['en', 'bn']) {
      console.log(`\nCapturing 5 hazards in ${lang.toUpperCase()}...`);
      await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
      await new Promise(r => setTimeout(r, 2000));
      await cdp.eval(`
        localStorage.setItem('fieldshift_lang', '${lang}');
        window.location.reload();
      `);
      await new Promise(r => setTimeout(r, 2500));

      // Navigate to Rotation Planner
      await cdp.eval(`
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Rotation Planner') || b.textContent.includes('পরিকল্পনা'))?.click();
      `);
      await new Promise(r => setTimeout(r, 1500));

      // Navigate to Stress Test
      await cdp.eval(`
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Stress') || b.textContent.includes('চাপ'))?.click();
      `);
      await new Promise(r => setTimeout(r, 1500));

      for (const h of HAZARDS) {
        // Click hazard card
        await cdp.eval(`
          (() => {
            const cards = Array.from(document.querySelectorAll('.climate-stress-workspace div[style*="cursor: pointer"]'));
            const hCard = cards.find(c => {
              const txt = c.textContent.toLowerCase();
              return txt.includes('${h.id}') || txt.includes('${h.bn}');
            });
            if (hCard) hCard.click();

            // Click Severe
            const intBtns = Array.from(document.querySelectorAll('button'));
            const sBtn = intBtns.find(b => {
              const txt = b.textContent.toLowerCase().trim();
              return txt === 'severe' || txt === 'তীব্র' || txt.includes('severe') || txt.includes('তীব্র');
            });
            if (sBtn) sBtn.click();

            // Click After
            const afterBtn = intBtns.find(b => b.textContent.includes('After') || b.textContent.includes('পরে'));
            if (afterBtn) afterBtn.click();
          })()
        `);

        // Wait for debounce + transition
        await new Promise(r => setTimeout(r, 1500));

        // Take screenshot
        const shot = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true
        });

        const filename = `${h.id}_severe_after_${lang}.png`;
        const filePath = path.join(outDir, filename);
        fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
        console.log(`Saved screenshot: ${filename} (${Math.round(shot.data.length / 1024)} KB)`);
      }
    }

    cdp.close();
    console.log('\nAll 10 screenshots captured successfully in docs/screens/stress/');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

captureScreens().catch(err => {
  console.error(err);
  process.exit(1);
});
