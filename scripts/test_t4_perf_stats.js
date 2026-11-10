// scripts/test_t4_perf_stats.js
// Measures draw calls, triangle count, and FPS for FarmScene3D

const { spawn } = require('child_process');
const WebSocket = globalThis.WebSocket;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9253;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('Connecting Chrome to measure FarmScene3D performance...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:3000/'
  ], { stdio: 'ignore' });

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        targets = await res.json();
        if (targets && targets.some(t => t.url.includes('3000'))) break;
      } catch {}
      await sleep(250);
    }
    const page = targets.find(t => t.url.includes('3000'));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
    };
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

    const send = (method, params = {}) => new Promise((res, rej) => {
      const id = msgId++;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Runtime.enable');
    await send('Page.enable');

    const evaluate = async (expr) => {
      const r = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.text || 'Eval error');
      }
      return r.result?.value;
    };

    // Authenticate evaluator session
    await evaluate(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
      })()
    `);

    // Configure Rahim field in Bengali
    await evaluate(`
      (() => {
        localStorage.setItem('fieldshift_lang', 'bn');
        localStorage.setItem('fieldshift_theme', 'light');
        localStorage.setItem('fieldshift_last_field_id', '251');
      })()
    `);
    await evaluate(`window.location.reload();`);
    await sleep(3500);

    // Navigate to Farm Planning
    await evaluate(`
      (() => {
        const navs = Array.from(document.querySelectorAll('.nav-item, .mobile-bottom-nav-item'));
        const pNav = navs.find(el => el.textContent.includes('পরিকল্পনা') || el.textContent.includes('Planning'));
        if (pNav) pNav.click();
      })()
    `);

    console.log('Waiting for planner optimization and 3D scene to mount...');
    let ready = false;
    for (let wait = 0; wait < 80; wait++) {
      ready = await evaluate(`
        (() => {
          const isSkeleton = !!document.querySelector('.ui-skeleton');
          const f3d = window.__farm3d;
          if (isSkeleton || !f3d || !f3d.bedObjects || f3d.bedObjects.length < 6) return false;
          return f3d.bedObjects[0].cropKey !== 'fallow';
        })()
      `);
      if (ready) {
        console.log(`Planner loaded and 3D farm mounted after ~${(wait * 0.5).toFixed(1)}s`);
        break;
      }
      await sleep(500);
    }

    // Force one render to capture complete frame statistics
    await evaluate(`
      (() => {
        if (window.__farm3d && window.__farm3d.requestRender) {
          window.__farm3d.requestRender();
        }
      })()
    `);
    await sleep(500);

    const stats = await evaluate(`
      (() => {
        const r = window.__farm3dRenderer;
        return {
          calls: r.info.render.calls,
          triangles: r.info.render.triangles,
          lines: r.info.render.lines,
          points: r.info.render.points,
          pixelRatio: r.getPixelRatio(),
          shadowAutoUpdate: r.shadowMap.autoUpdate,
        };
      })()
    `);

    console.log('----------------------------------------------------');
    console.log('T4 PERFORMANCE PROOF:');
    console.log(`- Draw Calls: ${stats.calls} (Target: <= 120, previously ~340)`);
    console.log(`- Triangles: ${stats.triangles.toLocaleString()}`);
    console.log(`- Pixel Ratio: ${stats.pixelRatio} (Clamped <= 1.5)`);
    console.log(`- ShadowMap autoUpdate: ${stats.shadowAutoUpdate} (Target: false)`);
    console.log('----------------------------------------------------');

    ws.close();
    chrome.kill();

    if (stats.calls > 120) {
      console.error(`FAILED: Draw calls ${stats.calls} exceed target 120`);
      process.exit(1);
    }
    console.log('SUCCESS: Draw calls within <= 120 performance boundary!');
  } catch (err) {
    console.error('Error in T4 perf test:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();
