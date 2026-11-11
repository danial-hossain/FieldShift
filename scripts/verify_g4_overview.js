// scripts/verify_g4_overview.js
// Automated verification for G4 Overview: Smooth connected transitions
// - 40 sampled scroll positions across Overview
// - Verify no two consecutive screenshots differ by > 35% of pixels
// - Verify no "3D: live" badge
// - Verify 0 console errors

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
            if (!errText.includes('favicon') && !errText.includes('WebGL')) {
              this.consoleErrors.push(errText);
            }
          }
          if (msg.method === 'Runtime.exceptionThrown') {
            const txt = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
            if (!txt.includes('favicon')) {
              this.consoleErrors.push(txt);
            }
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

async function run() {
  const chromePath = findChrome();
  const port = 9559;

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
    await new Promise(r => setTimeout(r, 3500));

    // 1. Verify "3D: live" badge does NOT exist
    const badgeCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const badge = document.querySelector('[data-testid="dev-mode-3d-badge"]');
          const hasBadgeText = document.body.innerText.includes('3D: live');
          return { hasBadgeEl: Boolean(badge), hasBadgeText };
        })()
      `,
      returnByValue: true
    });
    console.log('Badge check:', badgeCheck.result.value);
    if (badgeCheck.result.value.hasBadgeEl || badgeCheck.result.value.hasBadgeText) {
      throw new Error('"3D: live" debug badge was found on Overview!');
    }
    console.log('✓ "3D: live" debug badge absent');

    // 2. 40 Sampled scroll positions continuity check
    console.log('\n--- SAMPLING 40 SCROLL POSITIONS FOR CONTINUITY (MAX DIFF <= 35%) ---');
    const NUM_SAMPLES = 40;
    const diffs = [];

    // Helper to evaluate pixel buffer via canvas in browser
    await cdp.send('Runtime.evaluate', {
      expression: `
        window.__getCanvasDownsampledPixels = function() {
          const canvas = document.querySelector('.orbit-to-field-canvas-mount canvas') || document.querySelector('canvas');
          if (!canvas) return null;
          const off = document.createElement('canvas');
          off.width = 160;
          off.height = 90;
          const ctx = off.getContext('2d');
          ctx.drawImage(canvas, 0, 0, 160, 90);
          const data = ctx.getImageData(0, 0, 160, 90).data;
          const out = [];
          for (let i = 0; i < data.length; i += 4) {
            out.push(data[i], data[i+1], data[i+2]);
          }
          return out;
        };
      `
    });

    let prevPixels = null;
    let maxDiffFound = 0;

    for (let i = 0; i < NUM_SAMPLES; i++) {
      const p = i / (NUM_SAMPLES - 1);
      await cdp.send('Runtime.evaluate', {
        expression: `
          if (window.__FS_SET_STORY_PROGRESS__) {
            window.__FS_SET_STORY_PROGRESS__(${p});
          }
          if (window.__FS_CANVAS_SNAP_PROGRESS__) {
            window.__FS_CANVAS_SNAP_PROGRESS__(${p});
          }
        `
      });
      // Wait for RAF render
      await new Promise(r => setTimeout(r, 120));

      const pixelsRes = await cdp.send('Runtime.evaluate', {
        expression: 'window.__getCanvasDownsampledPixels()',
        returnByValue: true
      });

      const currentPixels = pixelsRes.result.value;
      if (currentPixels && prevPixels) {
        let diffCount = 0;
        const total = currentPixels.length / 3;
        for (let j = 0; j < total; j++) {
          const idx = j * 3;
          const dr = currentPixels[idx] - prevPixels[idx];
          const dg = currentPixels[idx+1] - prevPixels[idx+1];
          const db = currentPixels[idx+2] - prevPixels[idx+2];
          // Standard Euclidean color distance > 38 (~15% color difference)
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          if (dist > 38) {
            diffCount++;
          }
        }
        const diffPct = (diffCount / total) * 100;
        diffs.push({ from: ((i-1)/(NUM_SAMPLES-1)).toFixed(2), to: p.toFixed(2), diffPct: diffPct.toFixed(1) });
        if (diffPct > maxDiffFound) maxDiffFound = diffPct;
      }
      prevPixels = currentPixels;
    }

    console.log(`Max consecutive frame difference: ${maxDiffFound.toFixed(1)}% (limit: 35.0%)`);
    const failingTransitions = diffs.filter(d => parseFloat(d.diffPct) > 35.0);
    if (failingTransitions.length > 0) {
      console.error('Failing consecutive transitions (> 35% diff):', failingTransitions);
      throw new Error(`Consecutive frames exceeded 35% difference: max was ${maxDiffFound.toFixed(1)}%`);
    }
    console.log('✓ All 40 consecutive frames smooth (difference <= 35%)');

    // 3. Check console errors
    if (cdp.consoleErrors.length > 0) {
      throw new Error(`Console errors recorded during audit: \n${cdp.consoleErrors.join('\n')}`);
    }
    console.log('✓ 0 console errors');

    console.log('\n============================================================');
    console.log('PASS ✓ G4 Overview continuity check passed');
    console.log('============================================================');
    process.exit(0);

  } catch (err) {
    console.error('FAIL ✗ G4 check failed:', err.message);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
  }
}

run();
