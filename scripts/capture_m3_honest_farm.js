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
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture() {
  const chromePath = findChrome();
  const tmpProfile = path.join(REPO_ROOT, 'scratch', 'chrome_m3_profile');
  if (!fs.existsSync(tmpProfile)) fs.mkdirSync(tmpProfile, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${tmpProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900'
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      try {
        const res = await fetch('http://localhost:9223/json');
        const list = await res.json();
        if (list.length > 0 && list[0].webSocketDebuggerUrl) {
          wsUrl = list[0].webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }
    if (!wsUrl) throw new Error('Could not connect to Chrome debugging port');

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1500);

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

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/?lang=bn' });
    await sleep(2500);

    // Navigate to My Farm
    console.log('Navigating to My Farm...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const items = Array.from(document.querySelectorAll('.nav-item'));
        const f = items.find(el => el.textContent.includes('আমার জমি') || el.textContent.includes('My Farm'));
        if (f) f.click();
      })()`
    });
    await sleep(1000);

    // Switch to Parcels tab
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button, .tab-btn, .pill-btn, [role="tab"]'));
        const p = tabs.find(b => b.textContent.includes('জমির তালিকা') || b.textContent.includes('Parcels'));
        if (p) p.click();
      })()`
    });
    await sleep(1500);

    // Screenshot honest parcel view
    const s = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm3_honest_field_parcel_view.png'), Buffer.from(s.data, 'base64'));
    console.log('Saved screenshot: m3_honest_field_parcel_view.png');

    cdp.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

capture().catch(err => {
  console.error('M3 capture error:', err);
  process.exit(1);
});
