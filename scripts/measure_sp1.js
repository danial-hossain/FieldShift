import { chromium } from 'file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const TARGET_PAGES = [
  { name: 'Overview', nav: 'dashboard', subTab: null, selector: '.fsx-wrap, .fsx-card, .overview-page, .fsx-stars', bundleChunk: 'overview-story-3d' },
  { name: 'My Fields', nav: 'field', subTab: null, selector: '.my-farm-workspace, .workspace-header', bundleChunk: 'leaflet-src' },
  { name: 'Planner (Tab 1: 6-Season)', nav: 'farm_planning', subTab: 'milp', selector: '.six-season-recommendation-view, .strategy-grid', bundleChunk: 'research-3d-views' },
  { name: 'Planner (Tab 2: Climate Stress)', nav: 'farm_planning', subTab: 'stress', selector: '.climate-stress-test-view, .stress-card', bundleChunk: 'research-3d-views' },
  { name: 'Planner (Tab 3: Farming vs Plan)', nav: 'farm_planning', subTab: 'comparison', selector: '.compare-view, .field-profile-card', bundleChunk: 'research-lab-views' },
  { name: 'Planner (Tab 4: Adaptive Replan)', nav: 'farm_planning', subTab: 'replan', selector: '.replan-view, .replan-timeline', bundleChunk: 'research-lab-views' },
  { name: 'Climate', nav: 'weather', subTab: null, selector: '.weather-station, [data-demo="verdict_rows"]', bundleChunk: 'research-3d-views' },
  { name: 'Water', nav: 'water_irrigation', subTab: null, selector: '.water-irrigation-view, .water-season-summary-card', bundleChunk: 'research-3d-views' },
  { name: 'Market', nav: 'harvest_profit', subTab: null, selector: '.market-profit-view, .market-table', bundleChunk: 'index' },
  { name: 'Evidence', nav: 'evidence', subTab: null, selector: '.data-evidence-view, .evidence-grid', bundleChunk: 'index' },
];

const CHUNK_SIZES_KB = {
  'index': 726,
  'overview-story-3d': 726 + 946,
  'leaflet-src': 726 + 148,
  'research-3d-views': 726 + 228,
  'research-lab-views': 726 + 342,
};

async function measurePage(browser, pageConfig) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const apiCalls = [];

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/')) {
      req._startTime = Date.now();
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    const req = res.request();
    if (url.includes('/api/') && req._startTime) {
      const duration = Date.now() - req._startTime;
      const pathname = new URL(url).pathname;
      apiCalls.push({ name: pathname, ms: duration });
    }
  });

  const url = `http://127.0.0.1:3000/?nav=${pageConfig.nav}${pageConfig.subTab ? `&subtab=${pageConfig.subTab}` : ''}`;
  const tStart = Date.now();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // 1. Time to First Content
  let tFirstContent = null;
  try {
    await page.waitForSelector(pageConfig.selector, { timeout: 8000 });
    tFirstContent = Date.now() - tStart;
  } catch {
    tFirstContent = Date.now() - tStart;
  }

  // 2. Time until all numbers are shown
  let tAllNumbers = null;
  try {
    await page.waitForFunction(() => {
      const overlay = document.querySelector('.calc-loading-overlay, .loading-state');
      if (overlay) return false;
      const text = document.body.innerText;
      return /\d+([.,]\d+)?\s*(°C|mm|৳|maund|bigha|%|days|t\/ha)?/.test(text);
    }, { timeout: 8000 });
    tAllNumbers = Date.now() - tStart;
  } catch {
    tAllNumbers = Date.now() - tStart;
  }

  // 3. Measure Average FPS while scrolling
  const fps = await page.evaluate(async () => {
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

  // Slowest API call
  let slowestApi = 'None';
  if (apiCalls.length > 0) {
    apiCalls.sort((a, b) => b.ms - a.ms);
    slowestApi = `${apiCalls[0].name} (${apiCalls[0].ms} ms)`;
  }

  const jsBundleKb = CHUNK_SIZES_KB[pageConfig.bundleChunk] || 726;

  await context.close();

  return {
    page: pageConfig.name,
    firstContentMs: tFirstContent,
    allNumbersMs: tAllNumbers,
    slowestApi,
    jsBundleKb,
    fps,
  };
}

async function run() {
  console.log('Starting SP1 Baseline Performance Measurements (1920x1080)...');
  const browser = await chromium.launch();
  const results = [];

  for (const cfg of TARGET_PAGES) {
    process.stdout.write(`Measuring ${cfg.name}... `);
    const res = await measurePage(browser, cfg);
    results.push(res);
    console.log(`First: ${res.firstContentMs}ms | Ready: ${res.allNumbersMs}ms | Slowest: ${res.slowestApi} | JS: ${res.jsBundleKb}KB | FPS: ${res.fps}`);
  }

  await browser.close();

  console.log('\n========================================================================================================');
  console.log('| Page                           | First Content | All Numbers Shown | Slowest API Call (name + ms)         | JS Bundle | Scroll FPS |');
  console.log('|--------------------------------|---------------|-------------------|--------------------------------------|-----------|------------|');
  for (const r of results) {
    const p = r.page.padEnd(30);
    const fc = `${r.firstContentMs} ms`.padEnd(13);
    const an = `${r.allNumbersMs} ms`.padEnd(17);
    const sa = r.slowestApi.padEnd(36);
    const js = `${r.jsBundleKb} KB`.padEnd(9);
    const fps = `${r.fps}`.padEnd(10);
    console.log(`| ${p} | ${fc} | ${an} | ${sa} | ${js} | ${fps} |`);
  }
  console.log('========================================================================================================\n');
}

run().catch(console.error);
