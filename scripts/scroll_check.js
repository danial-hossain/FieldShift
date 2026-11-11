// scripts/scroll_check.js
// Measures scroll FPS on My Fields, Planner, Climate, Water, Market, Evidence
import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const BEFORE_FPS = {
  'My Fields': 40,
  'Planner': 23,
  'Climate': 41,
  'Water': 18,
  'Market': 20,
  'Evidence': 40,
};

const PAGES = [
  { name: 'My Fields', nav: 'field' },
  { name: 'Planner', nav: 'farm_planning' },
  { name: 'Climate', nav: 'weather' },
  { name: 'Water', nav: 'water_irrigation' },
  { name: 'Market', nav: 'harvest_profit' },
  { name: 'Evidence', nav: 'data_evidence' },
];

async function measureScrollFps(page) {
  return await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      let scrollY = 0;
      let dir = 1;

      function onFrame(now) {
        frames++;
        scrollY += dir * 20;
        if (scrollY > 500) dir = -1;
        if (scrollY < 0) dir = 1;
        window.scrollTo(0, scrollY);

        if (now - start < 1500) {
          requestAnimationFrame(onFrame);
        } else {
          const elapsed = (now - start) / 1000;
          resolve(Math.round(frames / elapsed));
        }
      }
      requestAnimationFrame(onFrame);
    });
  });
}

async function run() {
  console.log('===============================================================');
  console.log('FIELDSHIFT SCROLL FPS BENCHMARK (1920x1080 Viewport)');
  console.log('===============================================================');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const p of PAGES) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const url = `http://127.0.0.1:3000/?nav=${p.nav}`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('.workspace-header, .six-season-recommendation-view, .weather-station, .water-irrigation-view, .market-profit-view, .data-evidence-view', { timeout: 8000 }).catch(() => {});
      await page.waitForFunction(() => {
        const overlay = document.querySelector('.calc-loading-overlay, .loading-state');
        if (overlay) return false;
        const text = document.body.innerText;
        return /\d+([.,]\d+)?\s*(°C|mm|৳|maund|bigha|%|days|t\/ha)?/.test(text);
      }, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(400);

      const afterFps = await measureScrollFps(page);
      const beforeFps = BEFORE_FPS[p.name];
      const diff = afterFps - beforeFps;
      const pct = Math.round((diff / beforeFps) * 100);

      results.push({
        page: p.name,
        beforeFps,
        afterFps,
        change: `${diff >= 0 ? '+' : ''}${diff} fps (${pct >= 0 ? '+' : ''}${pct}%)`,
      });
      console.log(`✓ ${p.name.padEnd(12)} -> Before: ${beforeFps} FPS | After: ${afterFps} FPS (${diff >= 0 ? '+' : ''}${pct}%)`);
    } catch (e) {
      console.error(`Error measuring ${p.name}:`, e.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n===============================================================');
  console.log('| Page         | Before FPS | After FPS | Speedup / Change      |');
  console.log('|--------------|------------|-----------|-----------------------|');
  for (const r of results) {
    console.log(`| ${r.page.padEnd(12)} | ${String(r.beforeFps).padEnd(10)} | ${String(r.afterFps).padEnd(9)} | ${r.change.padEnd(21)} |`);
  }
  console.log('===============================================================\n');
}

run().catch(console.error);
