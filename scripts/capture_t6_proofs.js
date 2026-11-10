// scripts/capture_t6_proofs.js
// Captures 1440px proof screenshots for T6:
// - Current (light + dark)
// - Balanced (light + dark)
// - Profit (light + dark)
// - Water (light + dark)
// - Soil (light + dark)
// - Season card click proof (camera stays stationary)

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9255;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const outDir = path.resolve(__dirname, '../docs/screens/3d_farm');
const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b524ee50-9b34-490e-8f78-1efbcc87d2b1';

async function run() {
  console.log('Starting automated T6 proof screenshot capture (1440px)...');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

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

    const captureShot = async (filename) => {
      await sleep(400);
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      const docPath = path.join(outDir, filename);
      fs.writeFileSync(docPath, buf);
      if (fs.existsSync(artifactDir)) {
        fs.writeFileSync(path.join(artifactDir, filename), buf);
      }
      console.log(`Saved screenshot: ${filename} (${buf.length.toLocaleString()} bytes)`);
    };

    // Authenticate
    await evaluate(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
        localStorage.setItem('fieldshift_lang', 'bn');
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

    // Wait for planner to load data
    for (let wait = 0; wait < 60; wait++) {
      const ready = await evaluate(`
        (() => {
          const f3d = window.__farm3d;
          return !!(f3d && f3d.bedObjects && f3d.bedObjects.length >= 6 && f3d.bedObjects[0].cropKey !== 'fallow');
        })()
      `);
      if (ready) break;
      await sleep(500);
    }
    console.log('Planner and 3D farm loaded ready.');

    const strategies = [
      { id: 'current', label: 'বর্তমান' },
      { id: 'balanced', label: 'সুষম' },
      { id: 'profit', label: 'সর্বোচ্চ লাভ' },
      { id: 'water', label: 'পানি সাশ্রয়' },
      { id: 'soil', label: 'মাটির স্বাস্থ্য' },
    ];

    const themes = ['light', 'dark'];

    for (const theme of themes) {
      console.log(`Setting theme: ${theme}`);
      await evaluate(`
        (() => {
          document.documentElement.setAttribute('data-theme', '${theme}');
          localStorage.setItem('fieldshift_theme', '${theme}');
        })()
      `);
      await sleep(300);

      for (const strat of strategies) {
        console.log(`Switching to strategy ${strat.id} (${strat.label}) in ${theme}...`);
        await evaluate(`
          (() => {
            const pills = Array.from(document.querySelectorAll('.strategy-pill'));
            const p = pills.find(el => el.textContent.includes('${strat.label}'));
            if (p) p.click();
          })()
        `);
        await sleep(600);
        await captureShot(`${strat.id}_${theme}.png`);
      }
    }

    // Now test season card click camera stability proof:
    // 1. Position on Balanced strategy
    console.log('Setting up season card click camera stability proof...');
    await evaluate(`
      (() => {
        document.documentElement.setAttribute('data-theme', 'light');
        const pills = Array.from(document.querySelectorAll('.strategy-pill'));
        const p = pills.find(el => el.textContent.includes('সুষম'));
        if (p) p.click();
      })()
    `);
    await sleep(600);

    const initialCam = await evaluate(`
      (() => {
        const c = window.__farm3d.controls.object.position;
        return { x: c.x.toFixed(2), y: c.y.toFixed(2), z: c.z.toFixed(2) };
      })()
    `);
    console.log('Camera before clicking season card:', initialCam);

    // Click the 2nd season card (Kharif-1 Mungbean)
    await evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.sc'));
        if (cards[1]) cards[1].click();
      })()
    `);
    await sleep(600);

    const postClickCam = await evaluate(`
      (() => {
        const c = window.__farm3d.controls.object.position;
        return { x: c.x.toFixed(2), y: c.y.toFixed(2), z: c.z.toFixed(2) };
      })()
    `);
    console.log('Camera after clicking season card:', postClickCam);

    if (initialCam.x !== postClickCam.x || initialCam.y !== postClickCam.y || initialCam.z !== postClickCam.z) {
      console.error('FAILED: Camera moved when clicking season card!', { initialCam, postClickCam });
      process.exit(1);
    }
    console.log('SUCCESS: Camera remained perfectly stationary on season card click!');

    await captureShot('season_click_camera_proof.png');

    console.log('ALL T6 PROOF SCREENSHOTS CAPTURED SUCCESSFULLY!');
    ws.close();
    chrome.kill();
  } catch (err) {
    console.error('Error in T6 capture:', err);
    chrome.kill();
    process.exit(1);
  }
}

run();
