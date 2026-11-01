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
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        }
        if (msg.method === 'Network.responseReceived') {
          const res = msg.params.response;
          if (res.url.includes('/api/fields')) {
            console.log('[NETWORK FIELDS]', res.status, res.url);
          }
        }
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

async function testDuplicate() {
  const chromePath = findChrome();
  const tmpProfile = path.join(REPO_ROOT, 'scratch', 'chrome_m2_profile');
  if (!fs.existsSync(tmpProfile)) fs.mkdirSync(tmpProfile, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
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
        const res = await fetch('http://localhost:9224/json');
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
    await cdp.send('Network.enable');

    console.log('1. Authenticating...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1500);

    await cdp.send('Runtime.evaluate', {
      expression: `
        (async function() {
          localStorage.setItem('fieldshift_lang', 'bn');
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'evaluator@fieldshift.local',
              password: 'EvaluationPass2026!'
            })
          });
          return res.status;
        })()
      `,
      awaitPromise: true
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/?lang=bn' });
    await sleep(2500);

    // Navigate to My Farm
    console.log('2. Navigating to My Farm...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const items = Array.from(document.querySelectorAll('.nav-item'));
        const f = items.find(el => el.textContent.includes('আমার জমি') || el.textContent.includes('My Farm'));
        if (f) f.click();
      })()`
    });
    await sleep(1000);

    // Switch to Parcels subtab
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button, .tab-btn, .pill-btn, [role="tab"]'));
        const p = tabs.find(b => b.textContent.includes('জমির তালিকা') || b.textContent.includes('Parcels'));
        if (p) p.click();
      })()`
    });
    await sleep(800);

    // CREATE FIRST FIELD
    console.log('3. Creating first field "M2 Unique Field Test"...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('.btn-add-field, button'));
        const b = btns.find(el => el.textContent.includes('Add New Field') || el.textContent.includes('নতুন জমি'));
        if (b) b.click();
      })()`
    });
    await sleep(800);

    const fill1 = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const setVal = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const modal = document.querySelector('.modal-dialog');
        const nameInput = modal.querySelector('input[placeholder*="উত্তর মাঠ"], input[placeholder*="North Plot"]');
        if (nameInput) setVal(nameInput, 'M2 Unique Field Test');
        const numInputs = Array.from(modal.querySelectorAll('input[type="number"]'));
        if (numInputs[0]) setVal(numInputs[0], '25.1234');
        if (numInputs[1]) setVal(numInputs[1], '89.5678');
        if (numInputs[2]) setVal(numInputs[2], '1.8');
        const submitBtn = modal.querySelector('button[type="submit"]');
        return { name: nameInput?.value, disabled: submitBtn?.disabled };
      })()`,
      returnByValue: true
    });
    console.log('Filled field 1:', fill1.result?.value);
    await sleep(500);

    // Submit first field
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.modal-dialog');
        const submitBtn = modal?.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) submitBtn.click();
      })()`
    });
    await sleep(4000);
    console.log('First field submission finished.');

    // ATTEMPT TO CREATE DUPLICATE FIELD WITH SAME NAME
    console.log('4. Attempting to create duplicate field with exact same name "M2 Unique Field Test"...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('.btn-add-field, button'));
        const b = btns.find(el => el.textContent.includes('Add New Field') || el.textContent.includes('নতুন জমি'));
        if (b) b.click();
      })()`
    });
    await sleep(1000);

    // Fill identical name and coordinates
    const warningCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const setVal = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const modal = document.querySelector('.modal-dialog');
        if (!modal) return { error: 'no modal' };
        const nameInput = modal.querySelector('input[placeholder*="উত্তর মাঠ"], input[placeholder*="North Plot"]');
        if (nameInput) setVal(nameInput, 'M2 Unique Field Test');
        const numInputs = Array.from(modal.querySelectorAll('input[type="number"]'));
        if (numInputs[0]) setVal(numInputs[0], '25.1234');
        if (numInputs[1]) setVal(numInputs[1], '89.5678');
        if (numInputs[2]) setVal(numInputs[2], '1.8');

        const warnEl = modal.querySelector('div[style*="ef4444"], div[style*="f59e0b"]');
        const submitBtn = modal.querySelector('button[type="submit"]');
        return {
          warningVisible: Boolean(warnEl),
          warningText: warnEl ? warnEl.textContent.trim() : null,
          btnDisabled: submitBtn?.disabled
        };
      })()`,
      returnByValue: true
    });
    console.log('Inline duplicate warning detected:', warningCheck.result?.value);

    // Screenshot the duplicate warning in UI
    const sDup = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm2_duplicate_warning.png'), Buffer.from(sDup.data, 'base64'));
    console.log('Saved screenshot: m2_duplicate_warning.png');

    // Try submitting duplicate anyway
    const dupSubmitResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.modal-dialog');
        const submitBtn = modal?.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          return { clicked: true };
        }
        return { clicked: false, disabled: submitBtn?.disabled };
      })()`,
      returnByValue: true
    });
    console.log('Duplicate submit attempt:', dupSubmitResult.result?.value);
    await sleep(2000);

    const postDupError = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.modal-dialog');
        const errEl = modal?.querySelector('p[style*="c0392b"]');
        return {
          modalStillOpen: Boolean(modal),
          errorDisplayed: errEl ? errEl.textContent.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Duplicate submission blocked report:', postDupError.result?.value);

    cdp.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

testDuplicate().catch(err => {
  console.error('M2 test error:', err);
  process.exit(1);
});
