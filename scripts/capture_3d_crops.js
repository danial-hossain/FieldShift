// scripts/capture_3d_crops.js
// Captures close-up screenshots of each crop in docs/screens/3d_crops/<crop_name>.png

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9254;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CROPS = [
  { name: 'mustard', cropName: 'Mustard' },
  { name: 'boro_rice', cropName: 'Boro Rice' },
  { name: 'aman_rice', cropName: 'T. Aman Rice' },
  { name: 'mungbean', cropName: 'Mungbean' },
  { name: 'tomato', cropName: 'Tomato' },
  { name: 'sunflower', cropName: 'Sunflower' },
  { name: 'wheat', cropName: 'Wheat' },
  { name: 'potato', cropName: 'Potato' },
  { name: 'maize', cropName: 'Maize' },
  { name: 'lentil', cropName: 'Lentil' },
  { name: 'chickpea', cropName: 'Chickpea' },
  { name: 'sesame', cropName: 'Sesame' },
  { name: 'soybean', cropName: 'Soybean' },
  { name: 'fallow', cropName: 'Fallow' },
];

async function captureAllCrops() {
  console.log('Capturing close-up 3D crops...');
  const outDir = path.resolve(__dirname, '../docs/screens/3d_crops');
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

    // Authenticate
    await evaluate(`
      (async () => {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'evaluator@fieldshift.local', password: 'EvaluationPass2026!' })
        });
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

    // Wait for planner to be ready
    for (let wait = 0; wait < 60; wait++) {
      const ready = await evaluate(`
        (() => {
          const f3d = window.__farm3d;
          return !!(f3d && f3d.captureCropCloseUp && f3d.bedObjects && f3d.bedObjects.length >= 6);
        })()
      `);
      if (ready) break;
      await sleep(500);
    }

    for (const crop of CROPS) {
      console.log(`Capturing ${crop.name} (${crop.cropName})...`);
      const dataUrl = await evaluate(`window.__farm3d.captureCropCloseUp('${crop.cropName}')`);
      if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const filePath = path.join(outDir, `${crop.name}.png`);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        console.log(`Saved: docs/screens/3d_crops/${crop.name}.png`);
      } else {
        console.warn(`Could not capture dataUrl for ${crop.name}`);
      }
      await sleep(100);
    }

    console.log('ALL 3D CROPS CAPTURED SUCCESSFULLY!');
    ws.close();
    chrome.kill();
  } catch (err) {
    console.error('Error in captureAllCrops:', err);
    chrome.kill();
    process.exit(1);
  }
}

captureAllCrops();
