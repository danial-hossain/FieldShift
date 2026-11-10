// scripts/capture_evidence_scenarios.js
// Captures high-res screenshots of the new Evidence & Method page:
// 1. 3D System Map (bn & en)
// 2. Hover GPM Path (bn & en)
// 3. Click Side Panel (bn & en)
// 4. "Follow 718 mm" Path Animation (bn & en)
// 5. NASA Data Cards (bn & en)

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';
const DOCS_DIR = path.resolve('docs/screens/evidence');

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

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
    const { WebSocket } = await import('node:http').then(() => globalThis);
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
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result?.result?.value;
  }

  async screenshot(filename) {
    const data = await this.send('Page.captureScreenshot', { format: 'png', quality: 90 });
    const buf = Buffer.from(data.data, 'base64');
    fs.writeFileSync(path.join(DOCS_DIR, filename), buf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function setLanguage(cdp, targetLang) {
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('.lang-toggle-btn');
      if (!btn) return;
      const text = btn.textContent.trim();
      // If button says 'English', currently it is 'bn'
      const currentLang = text.includes('English') ? 'bn' : 'en';
      if (currentLang !== '${targetLang}') {
        btn.click();
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
}

async function run() {
  console.log('Spawning Chrome headless for evidence screenshots...');
  const port = 9333;
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,960',
    '--disable-gpu',
    'about:blank',
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
      if (targets && targets.length > 0) break;
    } catch {}
  }

  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Navigating to http://127.0.0.1:3000 ...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000' });
  await new Promise(r => setTimeout(r, 2500));

  // Navigate to Data Evidence View
  await cdp.eval(`
    (() => {
      const navButtons = Array.from(document.querySelectorAll('button, a, nav span'));
      const evBtn = navButtons.find(b => b.textContent && (b.textContent.includes('প্রমাণ') || b.textContent.includes('Evidence')));
      if (evBtn) evBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));

  // ==========================================
  // 1. BANGLA MODE SCREENSHOTS
  // ==========================================
  console.log('Capturing Bangla mode screenshots...');
  await setLanguage(cdp, 'bn');

  // Screenshot 1: 3D System Map (bn)
  await cdp.eval(`window.scrollTo(0, 0);`);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_3d_system_map_bn.png');

  // Screenshot 2: Hover GPM Path (bn)
  await cdp.eval(`
    (() => {
      const node = Array.from(document.querySelectorAll('.system-map-3d-wrapper div')).find(d => d.textContent && d.textContent.includes('GPM'));
      if (node) {
        node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_3d_hover_gpm_bn.png');

  // Screenshot 3: Click Side Panel (bn)
  await cdp.eval(`
    (() => {
      const node = Array.from(document.querySelectorAll('.system-map-3d-wrapper div')).find(d => d.textContent && d.textContent.includes('GPM'));
      if (node) node.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_3d_click_panel_bn.png');

  // Screenshot 4: Follow 718 mm (bn)
  await cdp.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('৭১৮'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1600));
  await cdp.screenshot('evidence_3d_follow_number_bn.png');

  // Screenshot 5: NASA Data Cards (bn)
  await cdp.eval(`
    (() => {
      const cards = document.querySelector('.nasa-data-cards-section');
      if (cards) cards.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 720);
    })()
  `);
  await new Promise(r => setTimeout(r, 700));
  await cdp.screenshot('evidence_nasa_cards_bn.png');

  // ==========================================
  // 2. ENGLISH MODE SCREENSHOTS
  // ==========================================
  console.log('Capturing English mode screenshots...');
  await setLanguage(cdp, 'en');

  // Reset side panel & scroll to top
  await cdp.eval(`
    (() => {
      window.scrollTo(0, 0);
      const closeBtn = document.querySelector('.system-node-glass-panel button');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 6: 3D System Map (en)
  await cdp.screenshot('evidence_3d_system_map_en.png');

  // Screenshot 7: Hover GPM Path (en)
  await cdp.eval(`
    (() => {
      const node = Array.from(document.querySelectorAll('.system-map-3d-wrapper div')).find(d => d.textContent && d.textContent.includes('GPM'));
      if (node) {
        node.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_3d_hover_gpm_en.png');

  // Screenshot 8: Click Side Panel (en)
  await cdp.eval(`
    (() => {
      const node = Array.from(document.querySelectorAll('.system-map-3d-wrapper div')).find(d => d.textContent && d.textContent.includes('GPM'));
      if (node) node.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('evidence_3d_click_panel_en.png');

  // Screenshot 9: Follow 718 mm (en)
  await cdp.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('718'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1600));
  await cdp.screenshot('evidence_3d_follow_number_en.png');

  // Screenshot 10: NASA Data Cards (en)
  await cdp.eval(`
    (() => {
      const cards = document.querySelector('.nasa-data-cards-section');
      if (cards) cards.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 720);
    })()
  `);
  await new Promise(r => setTimeout(r, 700));
  await cdp.screenshot('evidence_nasa_cards_en.png');

  cdp.close();
  chrome.kill();
  console.log('Finished capturing all evidence screenshots successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
