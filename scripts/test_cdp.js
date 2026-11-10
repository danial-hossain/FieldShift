// scripts/test_cdp.js
import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9333;
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
    console.log('WS URL:', wsUrl);

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
    await new Promise(r => setTimeout(r, 4000));

    const checkRes = await send('Runtime.evaluate', {
      expression: `
        ({
          title: document.title,
          hasStoryFallback: document.body.innerText.includes('3D story could not load') || document.body.innerText.includes('থ্রিডি দৃশ্য লোড হয়নি'),
          hasGlobalError: document.body.innerText.includes('Something went wrong'),
          canvasCount: document.querySelectorAll('canvas').length,
          cardCount: document.querySelectorAll('.story-glass-card').length,
          forbiddenFound: ['NASA POWER CLIMATOLOGY', 'MONITORED DISTRICTS', 'Recent 7 Days', 'Manage Parcel', 'Play story'].filter(t => document.body.innerText.includes(t))
        })
      `,
      returnByValue: true
    });
    console.log('Evaluation:', JSON.stringify(checkRes.result.value, null, 2));
    console.log('Errors caught:', errors);
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    chromeProc.kill();
    process.exit(0);
  }
}, 1500);
