import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

async function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found on host.');
}

async function fetchJson(url) {
  const res = await fetch(url);
  return await res.json();
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

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
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

async function main() {
  const chromePath = await findChrome();
  const port = 9226;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,1200',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/'
  ], { stdio: 'ignore' });

  try {
    let targets = null;
    for (let i = 0; i < 25; i++) {
      try {
        targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
        if (targets && targets.some(t => t.url.includes('5173'))) break;
      } catch {}
      await sleep(250);
    }
    const pageTarget = targets.find(t => t.url.includes('5173'));
    if (!pageTarget) throw new Error('Target not found');
    console.log('Connecting to:', pageTarget.url);

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Logging in as evaluator@fieldshift.local...');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async () => {
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
    await sleep(3500);

    // Navigate to Farm Planning
    console.log('Navigating to Farm Planning...');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('[data-nav="farm_planning"]');
          if (btn) btn.click();
        })()
      `
    });
    await sleep(3500);

    const outDir = path.resolve('docs/visual_test/screenshots');
    fs.mkdirSync(outDir, { recursive: true });

    async function captureScreen(fileName) {
      const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(outDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(snap.data, 'base64'));
      console.log('Saved screenshot:', fileName);
    }

    async function setTheme(themeName) {
      await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            if (currentTheme !== '${themeName}') {
              const btn = document.querySelector('.theme-toggle-btn');
              if (btn) btn.click();
            }
          })()
        `
      });
      await sleep(1500);
    }

    async function selectFieldByPattern(pattern) {
      const res = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const select = document.querySelector('select[aria-label="Active field parcel"]');
            if (!select) return { error: 'select not found' };
            const options = Array.from(select.options);
            const match = options.find(o => o.text.toLowerCase().includes('${pattern.toLowerCase()}') || o.value === '${pattern}');
            if (match) {
              select.value = match.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              return { success: true, value: match.value, text: match.text };
            }
            return { error: 'pattern not matched', available: options.map(o => o.text) };
          })()
        `,
        returnByValue: true
      });
      console.log('Selected field:', res.result.value);
      await sleep(4000); // Wait for plan to load
    }

    // 1. DEMO FIELD (Bogura, 10 ha)
    console.log('--- Capturing Demo Field (Bogura) ---');
    await selectFieldByPattern('demo');
    await setTheme('dark');
    await captureScreen('r4_planner_demo_dark.png');
    await setTheme('light');
    await captureScreen('r4_planner_demo_light.png');

    // 2. BARIND FIELD (Rajshahi, 5 ha)
    console.log('--- Capturing Barind Field (Rajshahi) ---');
    await selectFieldByPattern('rajshahi');
    await setTheme('dark');
    await captureScreen('r4_planner_barind_dark.png');
    await setTheme('light');
    await captureScreen('r4_planner_barind_light.png');

    // 3. SUNAMGANJ FIELD (Haor, 1 ha)
    console.log('--- Capturing Sunamganj Field (Haor) ---');
    await selectFieldByPattern('sunamganj');
    await setTheme('dark');
    await captureScreen('r4_planner_sunamganj_dark.png');
    await setTheme('light');
    await captureScreen('r4_planner_sunamganj_light.png');

    cdp.close();
  } finally {
    try {
      chromeProc.kill('SIGKILL');
    } catch {}
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
