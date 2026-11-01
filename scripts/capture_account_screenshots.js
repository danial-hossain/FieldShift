// scripts/capture_account_screenshots.js
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
      const curId = this.id++;
      this.pending.set(curId, { res, rej });
      this.ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function capture() {
  const chromePath = findChrome();
  const port = 9333;
  console.log('Spawning Chrome at', chromePath);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  await new Promise(r => setTimeout(r, 1800));

  const targetsRes = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Authenticating as evaluator...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  await cdp.send('Runtime.evaluate', {
    expression: `
      (async function() {
        localStorage.setItem('fieldshift_lang', 'bn');
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

  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Dinajpur Sadar (ID 303)
  console.log('Selecting Dinajpur Sadar (303)...');
  await cdp.send('Runtime.evaluate', {
    expression: `
      (function() {
        const sel = document.querySelector('select[aria-label="Active field parcel"]');
        if (sel) {
          sel.value = '303';
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1200));

  // Navigate to Account
  console.log('Navigating to Account page...');
  await cdp.send('Runtime.evaluate', {
    expression: `
      (function() {
        const mini = document.querySelector('.sidebar-user-mini');
        if (mini) mini.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // Capture Dinajpur
  console.log('Capturing Dinajpur screenshot...');
  const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const dinajpurPath = path.join(OUT_DIR, 'account_dinajpur.png');
  fs.writeFileSync(dinajpurPath, Buffer.from(shot1.data, 'base64'));
  console.log('Saved:', dinajpurPath);

  // 2. Bogura Demo (ID 304)
  console.log('Selecting Bogura Demo (304)...');
  await cdp.send('Runtime.evaluate', {
    expression: `
      (function() {
        const sel = document.querySelector('select[aria-label="Active field parcel"]');
        if (sel) {
          sel.value = '304';
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  console.log('Capturing Bogura screenshot...');
  const shot2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const boguraPath = path.join(OUT_DIR, 'account_bogura.png');
  fs.writeFileSync(boguraPath, Buffer.from(shot2.data, 'base64'));
  console.log('Saved:', boguraPath);

  cdp.close();
  chromeProc.kill();
  console.log('Account page screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
