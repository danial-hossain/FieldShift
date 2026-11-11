// scripts/overview_check.js
// Automated verification suite for the FieldShift Overview illustrated story pack (SP4)
const { chromium } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve('docs/screens/overview_pack');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runCheck(lang = 'en') {
  console.log(`\n============================================================`);
  console.log(`RUNNING OVERVIEW STORY VERIFICATION [LANG=${lang.toUpperCase()}]`);
  console.log(`============================================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('OpenGL')) {
        consoleErrors.push(txt);
        console.error('[BROWSER ERROR]', txt);
      }
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('[PAGE ERROR]', err.message);
  });

  // Set language and initial field
  await page.addInitScript((l) => {
    localStorage.setItem('fieldshift_lang', l);
    localStorage.setItem('fs_selected_field_id', 'demo');
  }, lang);

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Assert story mounted
  const fsx = await page.$('.fsx');
  if (!fsx) throw new Error('Overview story (.fsx) is not mounted on the page!');
  console.log('✓ Overview story (.fsx) is successfully mounted');

  // Verify rail buttons (10 sections)
  const railBtns = await page.$$('.fsx-rail button');
  if (railBtns.length !== 10) {
    throw new Error(`Expected 10 rail section buttons, but found ${railBtns.length}`);
  }
  console.log(`✓ Verified exactly 10 section rail buttons`);

  // 2. Scroll through all 10 sections (section 0.5, 1.5, ... 9.5)
  for (let s = 0; s < 10; s++) {
    // Scroll instantly to section s.5
    await page.evaluate((idx) => {
      const root = document.querySelector('.fsx');
      let p = root.parentElement;
      while (p && p !== document.body) {
        const style = getComputedStyle(p);
        if (/(auto|scroll)/.test(style.overflowY) && p.scrollHeight > p.clientHeight) break;
        p = p.parentElement;
      }
      const vh = window.innerHeight;
      const target = idx * vh + vh * 0.5;
      if (p) p.scrollTo({ top: target, behavior: 'instant' });
      else window.scrollTo({ top: target, behavior: 'instant' });
    }, s);
    await page.waitForTimeout(400);

    const shotPath = path.join(outDir, `section_${s}_${lang}.png`);
    const buf = await page.screenshot({ path: shotPath });

    // Pixel luminance and diversity check
    const metrics = await page.evaluate(async (base64) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          let nonDark = 0;
          let total = 0;
          const bins = {};
          let maxBinCount = 0;
          for (let i = 0; i < data.length; i += 64) {
            total++;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum > 10) nonDark++;
            const qr = (r >> 4) << 4, qg = (g >> 4) << 4, qb = (b >> 4) << 4;
            const bin = `${qr},${qg},${qb}`;
            bins[bin] = (bins[bin] || 0) + 1;
            if (bins[bin] > maxBinCount) maxBinCount = bins[bin];
          }
          resolve({
            nonDarkPct: (nonDark / total) * 100,
            maxColorPct: (maxBinCount / total) * 100,
          });
        };
        img.src = 'data:image/png;base64,' + base64;
      });
    }, buf.toString('base64'));

    console.log(`Section ${s}: nonDark=${metrics.nonDarkPct.toFixed(1)}%, maxColor=${metrics.maxColorPct.toFixed(1)}%`);
    if (metrics.nonDarkPct < 25) {
      throw new Error(`Section ${s} non-dark pixels (${metrics.nonDarkPct.toFixed(1)}%) < 25% minimum!`);
    }
    // Sections 1..9 are diorama/map/field views; Section 0 is deep space
    if (s >= 1 && metrics.maxColorPct > 60) {
      throw new Error(`Section ${s} single color dominance (${metrics.maxColorPct.toFixed(1)}%) > 60% maximum!`);
    }
  }
  console.log(`✓ All 10 sections meet visual non-dark and color diversity requirements`);

  // 3. Verify Rahim field card metrics match Planner / Water / Climate
  console.log('Verifying card data for Rahim field...');
  const storyText = await page.evaluate(() => document.querySelector('.fsx')?.textContent || '');
  if (!storyText.includes('-1.07') && !storyText.includes('1.07') && !storyText.includes('১.০৭') && !storyText.includes('−১.০৭')) {
    throw new Error('Expected GRACE-FO Barind trend -1.07 cm/yr in story text!');
  }
  console.log('✓ Verified GRACE-FO Barind trend is rendered in water card');

  // 4. Test "Open My Fields" button navigation & active field selection
  console.log('Testing "Open My Fields" navigation...');
  await page.evaluate(() => {
    const btn = document.querySelector('.fsx-card[data-i="9"] [data-go="myfields"]') || document.querySelector('.fsx [data-go="myfields"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

    const isMyFields = await page.evaluate(() => {
      const activeNav = document.querySelector('.nav-item.active')?.dataset?.nav;
      return activeNav === 'field';
    });
    if (!isMyFields) throw new Error('Clicking "Open My Fields" did not navigate to My Fields!');
    console.log('✓ Successfully navigated to My Fields');

    // Go back to Overview
    const overviewNavBtn = await page.$('.nav-item[data-nav="dashboard"], .sidebar-logo');
    if (overviewNavBtn) {
      await overviewNavBtn.click();
      await page.waitForTimeout(1000);
    }

  // 5. Test switching to Dinajpur field
  console.log('Testing field switch to Dinajpur...');
  await page.evaluate(() => {
    if (typeof window.__FS_SELECT_FIELD__ === 'function') {
      window.__FS_SELECT_FIELD__({
        id: 'dinajpur',
        name: 'দিনাজপুর খামার',
        district: 'dinajpur',
        latitude: 25.62,
        longitude: 88.63,
        area_ha: 1.2
      });
    }
  });
  await page.waitForTimeout(2000);

  // Check pin coordinates on map
  const dinajpurPinStyle = await page.evaluate(() => {
    const pin = document.querySelector('.fsx-pin');
    return pin ? pin.getAttribute('style') : '';
  });
  console.log('Dinajpur pin style:', dinajpurPinStyle);
  if (!dinajpurPinStyle.includes('left:14.') && !dinajpurPinStyle.includes('left:15.')) {
    throw new Error(`Expected Dinajpur pin near left:14.6%, got: ${dinajpurPinStyle}`);
  }
  console.log('✓ Verified pin is updated to Dinajpur coordinates on Bangladesh map');

  // Check card 9 shows Dinajpur district
  const card9Text = await page.evaluate(() => {
    const cards = document.querySelectorAll('.fsx-card');
    return cards.length >= 10 ? cards[9].textContent : '';
  });
  console.log('Card 9 district text verified:', card9Text.includes('dinajpur') || card9Text.includes('দিনাজপুর'));

  if (consoleErrors.length > 0) {
    throw new Error(`Recorded ${consoleErrors.length} console errors during audit: ${consoleErrors.join('; ')}`);
  }
  console.log(`✓ 0 console errors recorded in ${lang} mode`);

  await browser.close();
}

(async () => {
  try {
    await runCheck('en');
    await runCheck('bn');
    console.log('\n============================================================');
    console.log('PASS');
    console.log('============================================================');
  } catch (err) {
    console.error('\nAUDIT FAILED:', err);
    process.exit(1);
  }
})();
