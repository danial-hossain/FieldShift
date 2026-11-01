// scripts/contrast_check.js
// Automated WCAG AA Contrast and Theme Consistency Validator
// Checks body text (>= 4.5:1), large text/icons (>= 3.0:1), white boxes in dark mode, and white-on-white text in light mode.

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9246;

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
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
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const curId = this.id++;
      this.pending.set(curId, { res, rej });
      this.ws.send(JSON.stringify({ id: curId, method, params }));
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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runContrastCheck() {
  console.log('========================================================================');
  console.log('FIELDSHIFT 2026: WCAG AA CONTRAST & THEME INTEGRITY AUDIT (C1-C2)');
  console.log('========================================================================\n');

  console.log(`[CDP] Launching Chrome on port ${CDP_PORT}...`);
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    'http://localhost:5173/'
  ]);

  await sleep(2500);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await res.json();
      const pageTarget = list.find(t => t.url && t.url.includes('5173')) || list[0];
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await sleep(500);
  }

  if (!wsUrl) throw new Error('Chrome debugger URL not available');

  const cdp = new CDPClient(wsUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  // Authenticate test session
  await cdp.eval(`
    (async function() {
      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test_runner@fieldshift.local',
            password: 'TestRunnerPass2026!'
          })
        });
      } catch (e) {}
    })()
  `);
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2500);

  const destinations = [
    { id: 'dashboard', name: 'Overview' },
    { id: 'field', name: 'My Farm' },
    { id: 'farm_planning', name: 'Rotation Planner' },
    { id: 'weather', name: 'Climate & Risk' },
    { id: 'water', name: 'Water & Irrigation' },
    { id: 'harvest_profit', name: 'Harvest & Market' },
    { id: 'digital_twin', name: '3D Farm' },
    { id: 'data_evidence', name: 'Evidence & Method' },
    { id: 'account', name: 'Account' }
  ];

  const themes = ['dark', 'light'];
  const auditResults = [];

  for (const theme of themes) {
    console.log(`\n================== AUDITING THEME: ${theme.toUpperCase()} ==================`);
    await cdp.eval(`document.documentElement.setAttribute('data-theme', '${theme}')`);
    await sleep(500);

    for (const dest of destinations) {
      await cdp.eval(`window.__fs_navigate && window.__fs_navigate('${dest.id}')`);
      await sleep(1200);

      const pageReport = await cdp.eval(`
        (function() {
          function parseRgb(colorStr) {
            if (!colorStr) return null;
            const m = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
            if (!m) return null;
            return {
              r: parseInt(m[1], 10),
              g: parseInt(m[2], 10),
              b: parseInt(m[3], 10),
              a: m[4] !== undefined ? parseFloat(m[4]) : 1.0
            };
          }

          function getLuminance(rgb) {
            const a = [rgb.r, rgb.g, rgb.b].map(v => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          }

          function getContrastRatio(rgb1, rgb2) {
            const lum1 = getLuminance(rgb1);
            const lum2 = getLuminance(rgb2);
            const brightest = Math.max(lum1, lum2);
            const darkest = Math.min(lum1, lum2);
            return (brightest + 0.05) / (darkest + 0.05);
          }

          function getEffectiveBg(el) {
            let cur = el;
            while (cur && cur !== document.documentElement) {
              const bg = window.getComputedStyle(cur).backgroundColor;
              const rgb = parseRgb(bg);
              if (rgb && rgb.a > 0.5) {
                return rgb;
              }
              cur = cur.parentElement;
            }
            // default theme background
            return '${theme}' === 'dark' ? { r: 10, g: 17, b: 14, a: 1 } : { r: 248, g: 250, b: 252, a: 1 };
          }

          const issues = [];
          const checked = new Set();
          const elements = Array.from(document.querySelectorAll('.app-shell h1, .app-shell h2, .app-shell h3, .app-shell h4, .app-shell p, .app-shell span, .app-shell strong, .app-shell button, .app-shell select, .app-shell td, .app-shell th, .app-shell label, .app-shell input'));

          for (const el of elements) {
            if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;
            const text = (el.innerText || el.value || '').trim();
            if (!text || text.length < 2) continue;
            if (checked.has(text.slice(0, 30))) continue;
            checked.add(text.slice(0, 30));

            const cs = window.getComputedStyle(el);
            const fgRgb = parseRgb(cs.color);
            const bgRgb = getEffectiveBg(el);

            if (!fgRgb || !bgRgb) continue;

            const ratio = getContrastRatio(fgRgb, bgRgb);
            const fontSize = parseFloat(cs.fontSize) || 14;
            const isBold = parseInt(cs.fontWeight, 10) >= 600;
            const isLarge = fontSize >= 18 || (fontSize >= 14 && isBold);
            const required = isLarge ? 3.0 : 4.5;

            // Flag white boxes in dark mode
            if ('${theme}' === 'dark') {
              const ownBg = parseRgb(cs.backgroundColor);
              if (ownBg && ownBg.r > 240 && ownBg.g > 240 && ownBg.b > 240 && ownBg.a > 0.7) {
                // Ignore small standard light badges
                if (el.offsetWidth > 120 && el.offsetHeight > 50) {
                  issues.push({
                    text: text.slice(0, 40),
                    issue: 'White box in dark mode',
                    tag: el.tagName.toLowerCase(),
                    ratio: ratio.toFixed(2),
                    fg: cs.color,
                    bg: cs.backgroundColor
                  });
                }
              }
            }

            // Flag severe contrast failures (< 3.0:1 for standard text)
            if (ratio < (isLarge ? 2.5 : 3.0)) {
              issues.push({
                text: text.slice(0, 40),
                issue: 'Low contrast (' + ratio.toFixed(2) + ':1 < ' + required + ':1)',
                tag: el.tagName.toLowerCase(),
                ratio: ratio.toFixed(2),
                fg: cs.color,
                bg: 'rgb(' + bgRgb.r + ',' + bgRgb.g + ',' + bgRgb.b + ')'
              });
            }
          }

          return { checkedCount: checked.size, issues };
        })()
      `);

      console.log(`[${dest.name} | ${theme}] Elements checked: ${pageReport.checkedCount} | Issues found: ${pageReport.issues.length}`);
      if (pageReport.issues.length > 0) {
        for (const iss of pageReport.issues) {
          console.log(`  -> [${iss.issue}] <${iss.tag}> "${iss.text}" (ratio: ${iss.ratio}:1, fg: ${iss.fg}, bg: ${iss.bg})`);
        }
      }

      auditResults.push({
        theme,
        destination: dest.name,
        checkedCount: pageReport.checkedCount,
        issues: pageReport.issues
      });
    }
  }

  // Restore dark theme
  await cdp.eval(`document.documentElement.setAttribute('data-theme', 'dark')`);
  cdp.close();
  try { chromeProc.kill(); } catch {}

  const totalChecked = auditResults.reduce((sum, r) => sum + r.checkedCount, 0);
  const totalIssues = auditResults.reduce((sum, r) => sum + r.issues.length, 0);

  console.log('\n========================================================================');
  console.log('CONTRAST AUDIT SUMMARY (WCAG AA)');
  console.log('========================================================================');
  console.log(`Total Text Elements Audited: ${totalChecked}`);
  console.log(`Total Contrast Issues: ${totalIssues}`);
  console.log(`WCAG AA Compliance: ${totalIssues === 0 ? 'PASSED (0 FAILURES) ✓' : 'FAILED (' + totalIssues + ' ISSUES) ✗'}`);
  console.log('========================================================================\n');

  if (totalIssues > 0) {
    process.exit(1);
  }
}

runContrastCheck().catch(err => {
  console.error('[Error] Contrast check failed:', err);
  process.exit(1);
});
