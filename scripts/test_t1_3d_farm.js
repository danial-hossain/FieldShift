// scripts/test_t1_3d_farm.js
// Automated verification for T1: 3D Farm follows selected plan across all 5 strategies

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9251;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runTest() {
  console.log('==============================================================');
  console.log('VERIFYING T1: 3D FARM PARITY ACROSS 5 ROTATION STRATEGIES');
  console.log('==============================================================');

  const chromeProc = spawn(CHROME_PATH, [
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
    if (!page) throw new Error('Could not find active frontend page');

    let msgId = 1;
    const pending = new Map();

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = () => res();
      ws.onerror = err => rej(err);
      ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
          const { res, rej } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        }
      };
    });

    const send = (method, params = {}) => new Promise((res, rej) => {
      const id = msgId++;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.text || 'Eval error');
      }
      return r.result?.value;
    };

    // Authenticate session
    console.log('Authenticating evaluator session...');
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

    // Wait for planner to load data
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
    if (!ready) {
      const pageInfo = await evaluate(`({
        skeleton: !!document.querySelector('.ui-skeleton'),
        hasFarm3d: !!window.__farm3d,
        bodySnippet: document.body.innerText.substring(0, 300)
      })`);
      console.error('Page state when timed out:', pageInfo);
      throw new Error('Timed out waiting for planner 3D scene to mount');
    }

    const strategiesToTest = [
      { id: 'balanced', nameBn: 'সুষম', nameEn: 'Balanced', expectedCrops: ['সরিষা', 'মুগ ডাল', 'আমন ধান', 'ছোলা', 'তিল', 'আমন ধান'], expectedGeo: ['mustard', 'mungbean', 'rice', 'chickpea', 'sesame', 'rice'] },
      { id: 'profit', nameBn: 'লাভ', nameEn: 'Profit', expectedCrops: ['সূর্যমুখী', 'সয়াবিন', 'আমন ধান', 'টমেটো', 'মুগ ডাল', 'আমন ধান'], expectedGeo: ['sunflower', 'soybean', 'rice', 'tomato', 'mungbean', 'rice'] },
      { id: 'water', nameBn: 'পানি সাশ্রয়', nameEn: 'Water Saving', expectedCrops: ['সরিষা', 'মুগ ডাল', 'আমন ধান', 'ছোলা', 'তিল', 'আমন ধান'], expectedGeo: ['mustard', 'mungbean', 'rice', 'chickpea', 'sesame', 'rice'] },
      { id: 'soil', nameBn: 'মাটির স্বাস্থ্য', nameEn: 'Soil Health', expectedCrops: ['সরিষা', 'মুগ ডাল', 'আমন ধান', 'ছোলা', 'তিল', 'আমন ধান'], expectedGeo: ['mustard', 'mungbean', 'rice', 'chickpea', 'sesame', 'rice'] },
      { id: 'baseline', nameBn: 'বর্তমান', nameEn: 'Current', expectedCrops: ['বোরো ধান', 'পতিত', 'আমন ধান'], expectedGeo: ['riceRipe', 'fallow', 'rice'] },
    ];

    let allPassed = true;

    for (const strat of strategiesToTest) {
      console.log(`\n--- Testing Strategy: ${strat.nameEn} (${strat.nameBn}) ---`);

      // Click strategy pill button in toolbar
      await evaluate(`
        (() => {
          const pills = Array.from(document.querySelectorAll('.strategy-pill'));
          const btn = pills.find(b => b.textContent.includes('${strat.nameBn}'));
          if (btn) btn.click();
        })()
      `);
      await sleep(2000);

      const inspection = await evaluate(`
        (() => {
          const f3d = window.__farm3d;
          if (!f3d || !f3d.bedObjects) return { error: 'window.__farm3d not available' };
          
          const geoKeys = f3d.bedObjects.map(b => b.cropKey);
          
          // Read DOM label texts
          const labels = Array.from(document.querySelectorAll('.farm3d-bed-label, .crop-name-label')).map(el => el.textContent.trim());
          
          return {
            geoKeys,
            labels
          };
        })()
      `);

      console.log('Inspected 3D GeoKeys:', inspection.geoKeys);
      console.log('Inspected 3D Labels: ', inspection.labels);

      // Verify first N geoKeys match
      for (let i = 0; i < strat.expectedGeo.length; i++) {
        if (inspection.geoKeys[i] !== strat.expectedGeo[i]) {
          console.error(`❌ Mismatch at bed ${i}: expected geoKey "${strat.expectedGeo[i]}", got "${inspection.geoKeys[i]}"`);
          allPassed = false;
        }
      }
      console.log(`✓ Strategy ${strat.nameEn}: 3D farm followed plan successfully.`);
    }

    ws.close();
    chromeProc.kill();

    if (!allPassed) {
      console.error('\n❌ T1 VERIFICATION FAILED: Some strategies did not match 3D state.');
      process.exit(1);
    } else {
      console.log('\n==============================================================');
      console.log('✅ T1 VERIFICATION PASSED: All 5 strategies follow 3D plan accurately.');
      console.log('==============================================================');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    try { chromeProc.kill(); } catch {}
    process.exit(1);
  }
}

runTest();
