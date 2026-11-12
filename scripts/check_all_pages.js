// scripts/check_all_pages.js
import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9334;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--window-size=1920,1080',
  '--disable-gpu',
  '--no-sandbox'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const curId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', handler);
            if (msg.error) rej(msg.error);
            else res(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    const errors = [];
    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const txt = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (!txt.includes('favicon') && !txt.includes('WebGL')) {
          errors.push(txt);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000' });
    await new Promise(r => setTimeout(r, 3000));

    const pages = ['dashboard', 'field', 'farm_planning', 'weather', 'water_irrigation', 'harvest_profit', 'data_evidence', 'account'];
    const results = {};

    for (const p of pages) {
      errors.length = 0;
      await send('Runtime.evaluate', {
        expression: `
          (function() {
            const btn = document.querySelector('[data-nav="${p}"]') || Array.from(document.querySelectorAll('.nav-item, .sidebar-user-mini')).find(el => el.textContent.toLowerCase().includes('${p === 'farm_planning' ? 'আবর্তন' : p}'));
            if (btn) btn.click();
            else if ('${p}' === 'account') {
              const u = document.querySelector('.sidebar-user-mini');
              if (u) u.click();
            }
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1500));
      const res = await send('Runtime.evaluate', {
        expression: `
          JSON.stringify({
            nav: '${p}',
            hasGlobalError: document.body.innerText.includes('Something went wrong') || document.body.innerText.includes('একটি সমস্যা দেখা দিয়েছে'),
            bodySnippet: document.body.innerText.slice(0, 150).replace(/\\n/g, ' ')
          })
        `
      });
      results[p] = {
        eval: JSON.parse(res.result.value),
        errors: [...errors]
      };
    }

    console.log('Results:', JSON.stringify(results, null, 2));

    ws.close();
    chromeProc.kill();
    process.exit(0);
  } catch (err) {
    console.error('CDP Error:', err);
    chromeProc.kill();
    process.exit(1);
  }
}, 1500);

