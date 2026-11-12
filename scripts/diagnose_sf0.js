import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9556;

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.requests = [];
    this.responses = [];
    this.consoleLogs = [];
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
          if (msg.method === 'Network.requestWillBeSent') {
            if (msg.params.request.url.includes('/api/planning/stress')) {
              this.requests.push(msg.params);
            }
          }
          if (msg.method === 'Network.responseReceived') {
            if (msg.params.response.url.includes('/api/planning/stress')) {
              this.responses.push(msg.params);
            }
          }
          if (msg.method === 'Runtime.consoleAPICalled') {
            this.consoleLogs.push({ type: msg.params.type, args: msg.params.args.map(a => a.value || a.description || '') });
          }
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Runtime.evaluate exception');
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox',
    'http://127.0.0.1:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  let cdp = null;
  try {
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    cdp = new CDPClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    console.log('--- Navigating to app ---');
    await cdp.eval(`
      (() => {
        localStorage.setItem('fieldshift_lang', 'en');
        localStorage.setItem('fieldshift_theme', 'dark');
        localStorage.setItem('fieldshift_last_field_id', '251');
        localStorage.setItem('fs_selected_field_id', '251');
      })()
    `);

    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('--- Clicking Rotation Planner ---');
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('button[data-nav="farm_planning"]');
        if (btn) btn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 2500));

    console.log('--- Clicking Climate Stress Test Tab ---');
    await cdp.eval(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
        const stressTab = tabs.find(t => t.textContent.includes('Stress') || t.textContent.includes('চাপ'));
        if (stressTab) stressTab.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 3000));

    console.log('--- Inspecting Stress Test View DOM ---');
    const domState = await cdp.eval(`
      (() => {
        const table = document.querySelector('table');
        const rows = table ? Array.from(table.querySelectorAll('tbody tr')).map(r => r.innerText.trim()) : [];
        const bedBadges = Array.from(document.querySelectorAll('.bed-badge, .bed-label, text, span')).filter(el => el.textContent && el.textContent.includes('mm')).map(el => el.textContent.trim());
        const mitigations = Array.from(document.querySelectorAll('h3')).filter(h => h.textContent.includes('Mitigation') || h.textContent.includes('করতে পারেন')).map(h => h.parentElement ? h.parentElement.innerText : '');
        const summaryCards = Array.from(document.querySelectorAll('.ui-card, .glass-card')).map(c => c.innerText.trim().slice(0, 100));
        return {
          tableFound: !!table,
          rowCount: rows.length,
          rows: rows,
          bedBadges: bedBadges.slice(0, 10),
          mitigations: mitigations,
          requestsCount: ${cdp.requests.length}
        };
      })()
    `);
    console.log('DOM State:', JSON.stringify(domState, null, 2));

    console.log('\n--- Captured Network Requests for /api/planning/stress ---');
    console.log('Requests count:', cdp.requests.length);
    for (const req of cdp.requests) {
      console.log('Request URL:', req.request.url);
      console.log('Request Method:', req.request.method);
      console.log('Request PostData:', req.request.postData);
    }

    console.log('\n--- Captured Network Responses for /api/planning/stress ---');
    console.log('Responses count:', cdp.responses.length);
    for (const res of cdp.responses) {
      console.log('Response Status:', res.response.status, res.response.statusText);
      try {
        const bodyObj = await cdp.send('Network.getResponseBody', { requestId: res.requestId });
        console.log('Response Body (first 40 lines):');
        const lines = bodyObj.body.split('\n');
        console.log(lines.slice(0, 40).join('\n'));
        if (lines.length > 40) {
          console.log(`... (${lines.length - 40} more lines)`);
        }
      } catch (e) {
        console.log('Could not get response body:', e.message);
      }
    }

    console.log('\n--- Relevant Console Logs ---');
    const stressLogs = cdp.consoleLogs.filter(l => JSON.stringify(l).includes('Stress') || JSON.stringify(l).includes('stress') || l.type === 'error');
    console.log(JSON.stringify(stressLogs, null, 2));

  } catch (err) {
    console.error('Error during diagnosis:', err);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
  }
}

run();

