// scripts/overview_check.js
// Automated Visual & Functional Audit for Overview 3D Story (OS7)
// Checks: 10 sections luminance > 25%, 0 console errors, no forbidden texts, no fallback errors.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];

const SCREENSHOT_DIR = path.resolve('docs/screens/overview_final');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found on host.');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.consoleErrors = [];
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
        } else if (msg.method) {
          if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            const errText = msg.params.args.map(a => a.value || a.description || '').join(' ');
            if (!errText.includes('favicon')) {
              this.consoleErrors.push(errText);
            }
          }
          if (msg.method === 'Runtime.exceptionThrown') {
            this.consoleErrors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
          }
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

async function auditMode(cdp, lang = 'en') {
  console.log(`\n============================================================`);
  console.log(`RUNNING OVERVIEW AUDIT IN [${lang.toUpperCase()}] MODE`);
  console.log(`============================================================`);

  // Switch language via localStorage if needed
  await cdp.send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('fieldshift_lang', '${lang}');
      location.reload();
    `
  });
  await new Promise(r => setTimeout(r, 3500));

  // Check forbidden text
  const FORBIDDEN = [
    'NASA POWER CLIMATOLOGY',
    'MONITORED DISTRICTS',
    'Recent 7 Days',
    'Manage Parcel',
    'Play story'
  ];

  const pageCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      (function() {
        const text = document.body.innerText;
        const forbidden = ${JSON.stringify(FORBIDDEN)}.filter(t => text.includes(t));
        const hasStoryFallback = text.includes('3D story could not load') || text.includes('থ্রিডি দৃশ্য লোড হতে পারেনি');
        const hasGlobalError = text.includes('Something went wrong') || text.includes('একটি সমস্যা দেখা দিয়েছে');
        const renderer = window.__FS_STORY_RENDERER__;
        const info = renderer ? {
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures
        } : null;
        return { forbidden, hasStoryFallback, hasGlobalError, info };
      })()
    `,
    returnByValue: true
  });

  const checkVal = pageCheck.result.value;
  if (checkVal.forbidden.length > 0) {
    throw new Error(`Forbidden dashboard texts found on Overview: ${checkVal.forbidden.join(', ')}`);
  }
  if (checkVal.hasStoryFallback) {
    throw new Error(`Fallback text "3D story could not load" was displayed!`);
  }
  if (checkVal.hasGlobalError) {
    throw new Error(`Global ErrorBoundary caught an error on Overview!`);
  }

  console.log(`✓ Forbidden texts check: NONE found`);
  console.log(`✓ Story error boundary check: CLEAN (0 fallbacks)`);
  if (checkVal.info) {
    console.log(`✓ Three.js Renderer info: ${checkVal.info.calls} calls, ${checkVal.info.triangles} triangles, ${checkVal.info.geometries} geometries, ${checkVal.info.textures} textures`);
  }

  // Measure 10 sections
  const sectionResults = [];
  const totalScenes = 10;

  for (let s = 0; s < totalScenes; s++) {
    // Scroll to the middle of this section
    await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const totalH = document.body.scrollHeight - window.innerHeight;
          const targetY = ((${s} + 0.5) / ${totalScenes}) * totalH;
          window.scrollTo(0, targetY);
        })()
      `
    });

    await new Promise(r => setTimeout(r, 850));

    // Measure luminance
    const lumRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const canvas = document.querySelector('canvas');
          if (!canvas) return { error: 'No canvas found' };
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          if (!gl) return { error: 'No WebGL context' };
          const w = gl.drawingBufferWidth;
          const h = gl.drawingBufferHeight;
          const pixels = new Uint8Array(w * h * 4);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          let nonDark = 0;
          let sampled = 0;
          for (let i = 0; i < pixels.length; i += 16) {
            const r = pixels[i] / 255;
            const g = pixels[i + 1] / 255;
            const b = pixels[i + 2] / 255;
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (lum > 0.12) nonDark++;
            sampled++;
          }
          const pct = Math.round((nonDark / sampled) * 1000) / 10;
          return { pct, w, h };
        })()
      `,
      returnByValue: true
    });

    const lumVal = lumRes.result.value;
    const pct = lumVal.pct ?? 0;

    // Capture screenshot
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(SCREENSHOT_DIR, `s${s}${lang === 'bn' ? '_bn' : ''}.png`);
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

    console.log(`  Section ${s} (s${s}.png): ${pct}% non-dark pixels (lum > 0.12) -> ${pct >= 25 ? 'PASS' : 'FAIL'}`);

    if (pct < 25) {
      throw new Error(`Section ${s} failed luminance requirement: only ${pct}% non-dark pixels (required >= 25%)`);
    }

    sectionResults.push({ section: s, pct, shotPath });
  }

  return { checkVal, sectionResults };
}

async function runCheck() {
  const chromePath = findChrome();
  const port = 9555;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1920,1080',
    '--use-gl=angle',
    '--enable-webgl',
    '--no-sandbox',
  ]);

  await new Promise(r => setTimeout(r, 1500));

  let cdp = null;
  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;

    cdp = new CDPClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3000));

    // Audit English
    const enRes = await auditMode(cdp, 'en');

    // Audit Bengali
    const bnRes = await auditMode(cdp, 'bn');

    // Check console errors
    if (cdp.consoleErrors.length > 0) {
      throw new Error(`Console errors recorded during audit: \n${cdp.consoleErrors.join('\n')}`);
    }

    console.log(`\n============================================================`);
    console.log(`ALL OS7 AUTOMATED CHECKS PASSED PERFECTLY!`);
    console.log(`0 console errors, 0 forbidden texts, all sections >= 25% lum`);
    console.log(`============================================================`);
    process.exit(0);

  } catch (err) {
    console.error(`\n❌ OVERVIEW AUDIT FAILED:`, err.message);
    if (cdp && cdp.consoleErrors.length > 0) {
      console.error(`Recorded Console Errors:\n`, cdp.consoleErrors);
    }
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
  }
}

runCheck();
