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
          if (res.url.includes('/api/')) {
            console.log('[NETWORK RESPONSE]', res.status, res.url);
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

async function capture() {
  const chromePath = findChrome();
  const tmpProfile = path.join(REPO_ROOT, 'scratch', 'chrome_m1_profile');
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
    await cdp.send('Network.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to origin to login...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1500);

    const loginRes = await cdp.send('Runtime.evaluate', {
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
          const data = await res.json();
          return { status: res.status, data };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Auth login result:', loginRes.result?.value);

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/?lang=bn' });
    await sleep(2500);

    // Navigate to My Farm (আমার জমি)
    console.log('Navigating to My Farm...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const items = Array.from(document.querySelectorAll('.nav-item'));
        const f = items.find(el => el.textContent.includes('আমার জমি') || el.textContent.includes('My Farm'));
        if (f) f.click();
      })()`
    });
    await sleep(1000);

    // Switch to Parcels sub-tab (জমির তালিকা / 2. Parcels)
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button, .tab-btn, .pill-btn, [role="tab"]'));
        const p = tabs.find(b => b.textContent.includes('জমির তালিকা') || b.textContent.includes('Parcels'));
        if (p) p.click();
      })()`
    });
    await sleep(1000);

    // Click "+ Add New Field" button
    console.log('Clicking "+ Add New Field" on My Farm...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('.btn-add-field, button'));
        const b = btns.find(el => el.textContent.includes('Add New Field') || el.textContent.includes('নতুন জমি'));
        if (b) b.click();
      })()`
    });
    await sleep(1000);

    // Screenshot empty add field modal
    const s1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm1_add_field_empty.png'), Buffer.from(s1.data, 'base64'));
    console.log('Saved screenshot: m1_add_field_empty.png');

    // Fill form
    console.log('Filling form...');
    const fillRes = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const setVal = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const modal = document.querySelector('.modal-dialog');
        if (!modal) return { ok: false, error: 'no modal' };

        const nameInput = modal.querySelector('input[placeholder*="উত্তর মাঠ"], input[placeholder*="North Plot"]');
        if (nameInput) setVal(nameInput, 'M1 Verified Test Parcel');

        // Set distinct coordinates: 24.3636, 88.6241
        const latInput = modal.querySelector('input[placeholder*="ম্যাপে পিন"], input[placeholder*="Pin location"]');
        const numInputs = Array.from(modal.querySelectorAll('input[type="number"]'));
        // The first two number inputs are lat and lon
        if (numInputs[0]) setVal(numInputs[0], '24.3636');
        if (numInputs[1]) setVal(numInputs[1], '88.6241');

        // Area input (3rd number input)
        if (numInputs[2]) setVal(numInputs[2], '2.5');

        // Crop input
        const cropInput = modal.querySelector('input[placeholder*="বোরো ধান"], input[placeholder*="Boro Rice"]');
        if (cropInput) setVal(cropInput, 'Mustard');

        const submitBtn = modal.querySelector('button[type="submit"]');
        return {
          ok: true,
          name: nameInput?.value,
          lat: numInputs[0]?.value,
          lon: numInputs[1]?.value,
          area: numInputs[2]?.value,
          crop: cropInput?.value,
          btnDisabled: submitBtn?.disabled,
          btnText: submitBtn?.textContent?.trim()
        };
      })()`,
      returnByValue: true
    });
    console.log('Fill result:', fillRes.result?.value);
    await sleep(800);

    // Screenshot filled form
    const s2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm1_add_field_filled.png'), Buffer.from(s2.data, 'base64'));
    console.log('Saved screenshot: m1_add_field_filled.png');

    // Click submit
    console.log('Submitting form...');
    const submitTrigger = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.modal-dialog');
        const form = modal?.querySelector('form');
        const submitBtn = modal?.querySelector('button[type="submit"]');
        console.log('Form validity before submit:', form?.checkValidity());
        if (form) {
          const inv = Array.from(form.elements).filter(e => !e.checkValidity());
          console.log('Invalid elements json:', JSON.stringify(inv.map(e => ({ tag: e.tagName, name: e.name, type: e.type, placeholder: e.placeholder, val: e.value, msg: e.validationMessage }))));
        }
        if (submitBtn && !submitBtn.disabled) {
          form.requestSubmit();
          return { clicked: true };
        }
        return { clicked: false, disabled: submitBtn?.disabled };
      })()`,
      returnByValue: true
    });
    console.log('Submit trigger result:', submitTrigger.result?.value);
    await sleep(4000);

    // Check modal or error
    const postSubmitCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.modal-dialog');
        const errorEl = modal?.querySelector('p[style*="c0392b"]');
        const toast = document.querySelector('.ui-toast, [class*="toast"]');
        return {
          modalOpen: Boolean(modal),
          error: errorEl ? errorEl.textContent : null,
          toast: toast ? toast.textContent : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Post-submit check:', postSubmitCheck.result?.value);

    // Screenshot after saving
    const s3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, 'm1_add_field_saved.png'), Buffer.from(s3.data, 'base64'));
    console.log('Saved screenshot: m1_add_field_saved.png');

    cdp.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

capture().catch(err => {
  console.error('M1 capture failed:', err);
  process.exit(1);
});
