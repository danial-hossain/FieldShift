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
            this.consoleErrors.push(errText);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const msgId = this.id++;
      this.pending.set(msgId, { res, rej });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('Exception Details:', JSON.stringify(res.exceptionDetails, null, 2));
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const chromePath = findChrome();
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--use-gl=angle',
    'about:blank'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const listRes = await fetch('http://127.0.0.1:9444/json/list');
        const tabs = await listRes.json();
        wsUrl = tabs[0]?.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome debugging endpoint');

    const client = new CDPClient(wsUrl);
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Page.enable');

    console.log('--- Checking Step A: Sidebar Sticky & Position Integrity ---');

    await client.send('Page.navigate', { url: 'http://127.0.0.1:3000' });
    await new Promise(r => setTimeout(r, 2000));

    // Test on Climate page
    console.log('Testing Climate page...');
    await client.eval(`
      (() => {
        const navItem = Array.from(document.querySelectorAll('.sidebar .nav-item'))
          .find(el => el.textContent.includes('Climate') || el.textContent.includes('আবহাওয়া') || el.getAttribute('data-nav') === 'weather');
        if (navItem) navItem.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    const climateTopState = await client.eval(`
      (() => {
        const sidebar = document.querySelector('.sidebar');
        const sRect = sidebar.getBoundingClientRect();
        const items = Array.from(document.querySelectorAll('.sidebar .nav-item')).map(el => {
          const r = el.getBoundingClientRect();
          return { label: el.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
        });
        const mainWrapper = document.querySelector('.main-wrapper');
        return {
          sidebarRect: { x: Math.round(sRect.x), y: Math.round(sRect.y), width: Math.round(sRect.width), height: Math.round(sRect.height) },
          items,
          scrollTopBefore: mainWrapper ? mainWrapper.scrollTop : -1,
          scrollHeight: mainWrapper ? mainWrapper.scrollHeight : -1,
          clientHeight: mainWrapper ? mainWrapper.clientHeight : -1
        };
      })()
    `);

    // Scroll to bottom of main-wrapper
    await client.eval(`
      (() => {
        const mw = document.querySelector('.main-wrapper');
        if (mw) mw.scrollTop = mw.scrollHeight;
      })()
    `);
    await new Promise(r => setTimeout(r, 500));

    const climateBottomState = await client.eval(`
      (() => {
        const sidebar = document.querySelector('.sidebar');
        const sRect = sidebar.getBoundingClientRect();
        const items = Array.from(document.querySelectorAll('.sidebar .nav-item')).map(el => {
          const r = el.getBoundingClientRect();
          return { label: el.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
        });
        const mainWrapper = document.querySelector('.main-wrapper');
        return {
          sidebarRect: { x: Math.round(sRect.x), y: Math.round(sRect.y), width: Math.round(sRect.width), height: Math.round(sRect.height) },
          items,
          scrollTopAfter: mainWrapper ? mainWrapper.scrollTop : -1
        };
      })()
    `);

    console.log(`Climate page scroll before: ${climateTopState.scrollTopBefore}px, after: ${climateBottomState.scrollTopAfter}px (scrollHeight: ${climateTopState.scrollHeight}px)`);
    console.log(`Sidebar top pos: x=${climateTopState.sidebarRect.x}, y=${climateTopState.sidebarRect.y}, bottom pos: x=${climateBottomState.sidebarRect.x}, y=${climateBottomState.sidebarRect.y}`);
    if (climateTopState.sidebarRect.x !== climateBottomState.sidebarRect.x || climateTopState.sidebarRect.y !== climateBottomState.sidebarRect.y) {
      throw new Error('Sidebar shifted position on Climate page when main content was scrolled!');
    }
    for (let i = 0; i < climateTopState.items.length; i++) {
      const topItem = climateTopState.items[i];
      const botItem = climateBottomState.items[i];
      if (topItem.x !== botItem.x || topItem.y !== botItem.y) {
        throw new Error(`Sidebar item "${topItem.label}" moved from (${topItem.x}, ${topItem.y}) to (${botItem.x}, ${botItem.y})`);
      }
    }
    console.log(`PASS: Climate page - All ${climateTopState.items.length} sidebar items stayed at identical (x, y) coordinates!`);

    // Test on Market page
    console.log('\nTesting Market page...');
    await client.eval(`
      (() => {
        const navItem = Array.from(document.querySelectorAll('.sidebar .nav-item'))
          .find(el => el.textContent.includes('Market') || el.textContent.includes('বাজার') || el.getAttribute('data-nav') === 'harvest_profit');
        if (navItem) navItem.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    const marketTopState = await client.eval(`
      (() => {
        const sidebar = document.querySelector('.sidebar');
        const sRect = sidebar.getBoundingClientRect();
        const items = Array.from(document.querySelectorAll('.sidebar .nav-item')).map(el => {
          const r = el.getBoundingClientRect();
          return { label: el.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
        });
        const mainWrapper = document.querySelector('.main-wrapper');
        return {
          sidebarRect: { x: Math.round(sRect.x), y: Math.round(sRect.y), width: Math.round(sRect.width), height: Math.round(sRect.height) },
          items,
          scrollTopBefore: mainWrapper ? mainWrapper.scrollTop : -1,
          scrollHeight: mainWrapper ? mainWrapper.scrollHeight : -1,
          clientHeight: mainWrapper ? mainWrapper.clientHeight : -1
        };
      })()
    `);

    // Scroll to bottom of main-wrapper
    await client.eval(`
      (() => {
        const mw = document.querySelector('.main-wrapper');
        if (mw) mw.scrollTop = mw.scrollHeight;
      })()
    `);
    await new Promise(r => setTimeout(r, 500));

    const marketBottomState = await client.eval(`
      (() => {
        const sidebar = document.querySelector('.sidebar');
        const sRect = sidebar.getBoundingClientRect();
        const items = Array.from(document.querySelectorAll('.sidebar .nav-item')).map(el => {
          const r = el.getBoundingClientRect();
          return { label: el.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
        });
        const mainWrapper = document.querySelector('.main-wrapper');
        return {
          sidebarRect: { x: Math.round(sRect.x), y: Math.round(sRect.y), width: Math.round(sRect.width), height: Math.round(sRect.height) },
          items,
          scrollTopAfter: mainWrapper ? mainWrapper.scrollTop : -1
        };
      })()
    `);

    console.log(`Market page scroll before: ${marketTopState.scrollTopBefore}px, after: ${marketBottomState.scrollTopAfter}px (scrollHeight: ${marketTopState.scrollHeight}px)`);
    console.log(`Sidebar top pos: x=${marketTopState.sidebarRect.x}, y=${marketTopState.sidebarRect.y}, bottom pos: x=${marketBottomState.sidebarRect.x}, y=${marketBottomState.sidebarRect.y}`);
    if (marketTopState.sidebarRect.x !== marketBottomState.sidebarRect.x || marketTopState.sidebarRect.y !== marketBottomState.sidebarRect.y) {
      throw new Error('Sidebar shifted position on Market page when main content was scrolled!');
    }
    for (let i = 0; i < marketTopState.items.length; i++) {
      const topItem = marketTopState.items[i];
      const botItem = marketBottomState.items[i];
      if (topItem.x !== botItem.x || topItem.y !== botItem.y) {
        throw new Error(`Sidebar item "${topItem.label}" moved from (${topItem.x}, ${topItem.y}) to (${botItem.x}, ${botItem.y})`);
      }
    }
    console.log(`PASS: Market page - All ${marketTopState.items.length} sidebar items stayed at identical (x, y) coordinates!`);

    // Test collapse toggle
    console.log('\nTesting sidebar collapse toggle...');
    await client.eval(`
      (() => {
        const btn = document.querySelector('.sidebar-collapse-toggle');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));
    const isCollapsed = await client.eval(`
      (() => {
        return document.querySelector('.sidebar').classList.contains('collapsed') &&
          localStorage.getItem('fieldshift_sidebar_collapsed') === 'true';
      })()
    `);
    console.log(`Sidebar collapse toggle state in localStorage and DOM class: ${isCollapsed}`);
    if (!isCollapsed) throw new Error('Sidebar collapse toggle failed!');

    // Toggle back
    await client.eval(`
      (() => {
        const btn = document.querySelector('.sidebar-collapse-toggle');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    console.log('\nALL STEP A CHECKS PASSED PERFECTLY!');
    client.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
