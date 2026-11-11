// scripts/verify_overview_playwright.js
const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../docs/screens/overview_pack');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[BROWSER ERROR]', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('[PAGE ERROR]', err.message);
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Verify Overview Story loads
  const fsx = await page.$('.fsx');
  console.log('Overview Story .fsx container found:', Boolean(fsx));

  // Screenshot Section 0 (Orbit)
  const track = await page.$('.fsx-track');
  const stage = await page.$('.fsx-stage');
  console.log('Stage found:', Boolean(stage));

  // Section 0
  await page.screenshot({ path: path.join(outDir, 'section_0_orbit.png') });
  console.log('Saved section_0_orbit.png');

  // Scroll to Section 2 (Regions) - roughly 2.5 * vh
  await page.evaluate(() => {
    const root = document.querySelector('.fsx');
    function scrollParent(el) {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight) return p;
        p = p.parentElement;
      }
      return null;
    }
    const sp = scrollParent(root);
    const vh = window.innerHeight;
    const target = 2.5 * vh;
    if (sp) sp.scrollTo({ top: target, behavior: 'instant' });
    else window.scrollTo({ top: target, behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'section_2_regions.png') });
  console.log('Saved section_2_regions.png');

  // Scroll to Section 9 (Start / Action) - roughly 9.5 * vh
  await page.evaluate(() => {
    const root = document.querySelector('.fsx');
    function scrollParent(el) {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight) return p;
        p = p.parentElement;
      }
      return null;
    }
    const sp = scrollParent(root);
    const vh = window.innerHeight;
    const target = 9.5 * vh;
    if (sp) sp.scrollTo({ top: target, behavior: 'instant' });
    else window.scrollTo({ top: target, behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'section_9_start.png') });
  console.log('Saved section_9_start.png');

  // 2. Test Sidebar Pages Navigation
  const navItems = [
    { nav: 'field', label: 'My Fields' },
    { nav: 'farm_planning', label: 'Rotation Planner' },
    { nav: 'water_irrigation', label: 'Water' },
    { nav: 'weather', label: 'Climate' },
    { nav: 'harvest_profit', label: 'Market' },
    { nav: 'data_evidence', label: 'Evidence' },
  ];

  for (const item of navItems) {
    console.log(`Testing sidebar navigation to ${item.label} (${item.nav})...`);
    const btn = await page.$(`[data-nav="${item.nav}"]`);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(1000);
    } else {
      console.warn(`Sidebar item [data-nav="${item.nav}"] not found`);
    }
  }

  // Navigate back to Dashboard (Overview)
  console.log('Navigating back to Overview...');
  const dashBtn = await page.$('[data-nav="dashboard"]');
  if (dashBtn) {
    await dashBtn.click();
    await page.waitForTimeout(1000);
  }

  console.log('Total console errors recorded:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }

  await browser.close();
  if (consoleErrors.length === 0) {
    console.log('PLAYWRIGHT VERIFICATION PASS');
  } else {
    process.exit(1);
  }
})();
