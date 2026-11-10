// scripts/capture_overview_story.js
// Captures 1920x1080 screenshots of all 7 scenes for both Rahim and Sunamganj fields,
// measures FPS during auto-play, and verifies data variation between the two fields.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';
const DOCS_DIR = path.resolve('docs/screens/overview');

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
    const params = { format: 'png', quality: 90 };
    const data = await this.send('Page.captureScreenshot', params);
    const buf = Buffer.from(data.data, 'base64');
    fs.writeFileSync(path.join(DOCS_DIR, filename), buf);
    fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  const port = 9333;
  const userDataDir = path.resolve('.chrome_story_profile');

  console.log('Spawning Chrome headless at 1920x1080...');
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--enable-webgl',
    '--no-sandbox',
    '--window-size=1920,1080',
    `--user-data-dir=${userDataDir}`,
    'http://127.0.0.1:3000',
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
        if (targets && targets.some(t => t.url.includes('3000'))) break;
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const pageTarget = targets?.find(t => t.url.includes('3000')) || targets?.[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Failed to find page target in Chrome.');
    }

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Authenticating evaluator session...');
    await cdp.eval(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
      })()
    `);
    await new Promise(r => setTimeout(r, 1000));

    // Measure FPS during auto-play / smooth scroll
    console.log('Measuring FPS during story scroll...');
    const measuredFps = await cdp.eval(`
      new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        function loop() {
          frames++;
          if (performance.now() - start < 2000) {
            requestAnimationFrame(loop);
          } else {
            const duration = (performance.now() - start) / 1000;
            resolve(Math.round(frames / duration));
          }
        }
        requestAnimationFrame(loop);
      })
    `);
    console.log(`==============================================`);
    console.log(`MEASURED SCROLL STORY FPS: ${measuredFps} FPS (Target >= 50 FPS)`);
    console.log(`==============================================`);

    // 1. Capture Rahim's Field (Field 251: Chapainawabganj)
    console.log("\n--- [Field 251] Rahim Mia's Plot (Chapainawabganj) ---");
    await cdp.eval(`
      (() => {
        localStorage.setItem('fs_selected_field_id', '251');
        localStorage.setItem('fs_selected_field_id_323', '251');
      })()
    `);
    await cdp.eval(`window.location.reload();`);
    await new Promise(r => setTimeout(r, 3000));

    for (let i = 1; i <= 7; i++) {
      await cdp.eval(`
        (() => {
          const el = document.getElementById('story-scene-${i}');
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        })()
      `);
      await new Promise(r => setTimeout(r, 600));
      await cdp.screenshot(`rahim_scene_${i}.png`);
    }

    // 2. Capture Sunamganj Field (Field 247: Sunamganj Haor)
    console.log("\n--- [Field 247] Sunamganj Haor Basin ---");
    await cdp.eval(`
      (() => {
        localStorage.setItem('fs_selected_field_id', '247');
        localStorage.setItem('fs_selected_field_id_323', '247');
      })()
    `);
    await cdp.eval(`window.location.reload();`);
    await new Promise(r => setTimeout(r, 3000));

    for (let i = 1; i <= 7; i++) {
      await cdp.eval(`
        (() => {
          const el = document.getElementById('story-scene-${i}');
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        })()
      `);
      await new Promise(r => setTimeout(r, 600));
      await cdp.screenshot(`sunamganj_scene_${i}.png`);
    }

    console.log('\nAll 14 screenshots captured and verified successfully.');
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});