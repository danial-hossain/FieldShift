import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

const SIDEBAR_PAGES = [
  { id: 'dashboard', name: 'Overview' },
  { id: 'field', name: 'My Farm' },
  { id: 'farm_planning', name: 'Rotation Planner' },
  { id: 'weather', name: 'Climate & Risk' },
  { id: 'water_irrigation', name: 'Water & Irrigation' },
  { id: 'harvest_profit', name: 'Market & Profit' },
  { id: 'data_evidence', name: 'Evidence & Method' }
];

async function checkStepC() {
  console.log('--- Step C Verification: Floating ChatWidget on Every Page ---');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9458',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const listRes = await fetch('http://127.0.0.1:9458/json/list');
        const tabs = await listRes.json();
        wsUrl = tabs[0]?.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome debugging endpoint');

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 2500));

    // Also assert "AI Assistant" is NOT in the sidebar
    const hasAiAssistantSidebar = await cdp.eval(`
      (() => {
        return !!document.querySelector('.sidebar [data-nav="assistant"]');
      })()
    `);
    console.log(`Sidebar "AI Assistant" item exists: ${hasAiAssistantSidebar} (Expected: false)`);
    if (hasAiAssistantSidebar) {
      throw new Error('AI Assistant sidebar item must be DELETED according to Step C spec!');
    }

    for (const p of SIDEBAR_PAGES) {
      console.log(`\nChecking page: [${p.name}] (nav: ${p.id})...`);
      cdp.consoleErrors = [];

      // Navigate to page
      await cdp.eval(`
        (() => {
          const item = document.querySelector('.sidebar [data-nav="${p.id}"]') ||
            Array.from(document.querySelectorAll('.sidebar .nav-item')).find(el => el.getAttribute('data-nav') === '${p.id}');
          if (item) item.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 1200));

      // Check FAB button is present
      const fabVisible = await cdp.eval(`
        (() => {
          const fab = document.querySelector('.chat-widget-fab');
          if (!fab) return false;
          const rect = fab.getBoundingClientRect();
          return rect.width === 56 && rect.height === 56 && rect.top > 0;
        })()
      `);
      if (!fabVisible) throw new Error(`Floating 56px chat widget button is not visible on page ${p.id}`);

      // Click FAB button to expand
      await cdp.eval(`
        (() => {
          const fab = document.querySelector('.chat-widget-fab');
          if (fab) fab.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 400));

      // Assert panel opened and read 3 pills
      const pillData = await cdp.eval(`
        (() => {
          const panel = document.querySelector('.chat-widget-panel');
          if (!panel) return { open: false, pills: [] };
          const rect = panel.getBoundingClientRect();
          const pills = Array.from(panel.querySelectorAll('.chat-widget-pill')).map(el => el.textContent.trim());
          return {
            open: true,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            pills
          };
        })()
      `);

      if (!pillData.open) throw new Error(`ChatWidget panel failed to open on page ${p.id}`);
      if (pillData.pills.length !== 3) {
        throw new Error(`Expected exactly 3 page-specific pills on page ${p.id}, got ${pillData.pills.length}`);
      }

      console.log(`  Widget dimensions: ${pillData.width}x${pillData.height}px (Spec: 380x560px)`);
      console.log(`  3 Page-Specific Question Pills:`);
      pillData.pills.forEach((q, i) => console.log(`    ${i + 1}. ${q}`));

      // Click close button
      await cdp.eval(`
        (() => {
          const closeBtn = document.querySelector('.chat-widget-close-btn');
          if (closeBtn) closeBtn.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 300));

      // Check console errors
      const pageErrors = cdp.consoleErrors.filter(e => !e.includes('favicon'));
      console.log(`  Console errors on ${p.name}: ${pageErrors.length}`);
      if (pageErrors.length > 0) {
        console.error('Errors found:', pageErrors);
        throw new Error(`Page ${p.name} threw console errors: ${pageErrors.join(', ')}`);
      }
      console.log(`  PASS: [${p.name}]`);
    }

    console.log('\n=============================================================');
    console.log('ALL STEP C CHECKS PASSED: 0 ERRORS, 3 PILLS ON EVERY PAGE!');
    console.log('=============================================================');
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

checkStepC().catch(err => {
  console.error('STEP C VERIFICATION FAILED:', err);
  process.exit(1);
});
