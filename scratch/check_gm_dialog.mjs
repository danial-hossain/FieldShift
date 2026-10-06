import { spawn } from 'node:child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9346',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const targets = await (await fetch('http://127.0.0.1:9346/json')).json();
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    let id = 0;
    const send = (method, params = {}) => new Promise(r => {
      const i = ++id;
      const h = ev => {
        const m = JSON.parse(ev.data);
        if (m.id === i) { ws.removeEventListener('message', h); r(m.result); }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 2500));
    await send('Runtime.evaluate', { expression: `(()=>{
      const b = [...document.querySelectorAll('.nav-item')].find(el => el.title && /profile|account|settings/i.test(el.title));
      if (b) b.click();
    })()` });
    await new Promise(r => setTimeout(r, 1000));
    await send('Runtime.evaluate', { expression: `(()=>{
      const b = [...document.querySelectorAll('button')].find(el => /quick demo sign in|demo sign in/i.test(el.textContent));
      if (b) b.click();
    })()` });
    await new Promise(r => setTimeout(r, 3000));
    const res = await send('Runtime.evaluate', { expression: `(()=>{
      const card = document.querySelector('.field-card-map-thumbnail');
      if (!card) return 'no card';
      const rootDiv = card.firstElementChild;
      const children = [...rootDiv.children];
      return children.map(c => ({
        tag: c.tagName,
        className: c.className,
        style: c.getAttribute('style')
      }));
    })()`, returnByValue: true });
    console.log('Root children:', JSON.stringify(res.result.value, null, 2));
    ws.close();
    chrome.kill();
    process.exit(0);
  } catch(e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
