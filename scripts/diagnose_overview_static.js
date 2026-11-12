import { spawn } from 'node:child_process';
import http from 'node:http';

async function diagnose() {
  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    '--window-size=1920,1080',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const targets = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9226/json', res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve(JSON.parse(data)));
    });
  });
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const consoleMessages = [];
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const listener = (msg) => {
      const resp = JSON.parse(msg.data);
      if (resp.id === curId) { ws.removeEventListener('message', listener); resolve(resp.result); }
    };
    ws.addEventListener('message', listener);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  ws.addEventListener('message', (msg) => {
    const data = JSON.parse(msg.data);
    if (data.method === 'Console.messageAdded') {
      consoleMessages.push(data.params.message);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push(data.params);
    }
  });

  await send('Console.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:3000' });
  await new Promise(r => setTimeout(r, 3000));

  const diag = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const hasCanvas = !!document.querySelector('canvas');
        const canvasMount = !!document.querySelector('.orbit-to-field-canvas-mount');
        const hasFallbackSvg = !!document.querySelector('svg circle[fill="#1e5c38"]');
        const hasErrorBoundary = !!document.querySelector('.story-error-fallback') || !!document.querySelector('.app-error-boundary');
        const prefersMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        let webgl = false;
        try {
          const cv = document.createElement('canvas');
          webgl = !!(window.WebGLRenderingContext && (cv.getContext('webgl') || cv.getContext('experimental-webgl')));
        } catch(e) { webgl = false; }

        const storyContainer = document.querySelector('.story-scroll-container') || document.querySelector('.overview-story-stage');
        const renderer = window.__FS_STORY_RENDERER__;
        const rendererInfo = renderer ? {
          calls: renderer.info.render.calls,
          frame: renderer.info.render.frame,
          triangles: renderer.info.render.triangles,
        } : null;

        return {
          hasCanvas,
          canvasMount,
          hasFallbackSvg,
          hasErrorBoundary,
          prefersMotion,
          webgl,
          rendererInfo,
          activeNav: window.__ACTIVE_NAV__ || 'unknown',
          title: document.title,
        };
      })()
    `,
    returnByValue: true
  });

  console.log('--- DIAGNOSIS RESULT ---');
  console.log(JSON.stringify(diag.result?.value, null, 2));
  console.log('--- CONSOLE MESSAGES ---');
  console.log(consoleMessages.slice(-20));

  ws.close();
  chromeProc.kill();
}
diagnose();

