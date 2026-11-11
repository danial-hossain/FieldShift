/**
 * Automated Demo Mode Verification Script (DM5)
 * Runs headless Playwright at 1920x1080 in EN and BN across every page and sub-tab.
 */

const { chromium } = require('H:/FieldShift2026/frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../docs/screens/demo');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const PAGES_AND_TABS = [
  { name: 'overview', nav: 'dashboard', subTab: null },
  { name: 'myfields', nav: 'field', subTab: null },
  { name: 'planner_milp', nav: 'farm_planning', subTab: 'milp' },
  { name: 'planner_replan', nav: 'farm_planning', subTab: 'replan' },
  { name: 'planner_stress', nav: 'farm_planning', subTab: 'stress' },
  { name: 'planner_compare', nav: 'farm_planning', subTab: 'comparison' },
  { name: 'climate', nav: 'weather', subTab: null },
  { name: 'water', nav: 'water_irrigation', subTab: null },
  { name: 'market', nav: 'harvest_profit', subTab: null },
  { name: 'evidence', nav: 'data_evidence', subTab: null },
];

function rectsIntersect(r1, r2) {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
}

(async () => {
  console.log('====================================================');
  console.log('FIELDSHIFT DEMO MODE PLAYWRIGHT VERIFICATION (DM5)');
  console.log('====================================================');

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`[HTTP ${resp.status()}] ${resp.url()}`);
      try {
        console.log('REQ POST DATA:', resp.request().postData());
      } catch (e) {}
    }
  });

  let totalChecksPassed = 0;
  let totalChecksFailed = 0;

  for (const lang of ['en', 'bn']) {
    console.log(`\n--- TESTING LANGUAGE: ${lang.toUpperCase()} ---`);

    // Set language in localStorage
    await page.addInitScript((l) => {
      localStorage.setItem('fieldshift_lang', l);
    }, lang);

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    for (const item of PAGES_AND_TABS) {
      process.stdout.write(`Testing [${item.name}] (${lang})... `);

      // Navigate to sidebar route
      const navBtn = await page.$(`[data-nav="${item.nav}"]`);
      if (navBtn) {
        await navBtn.click({ force: true });
        await page.waitForTimeout(800);
      }

      // If sub-tab in planner, click sub-tab
      if (item.subTab) {
        const subBtn = await page.$(`button[role="tab"]:has-text("${item.subTab === 'milp' ? '1.' : item.subTab === 'replan' ? '2.' : item.subTab === 'stress' ? '3.' : '4.'}")`)
          || await page.$(`.ui-tab-item:nth-child(${item.subTab === 'milp' ? 1 : item.subTab === 'replan' ? 2 : item.subTab === 'stress' ? 3 : 4})`);
        if (subBtn) {
          await subBtn.click({ force: true });
          await page.waitForTimeout(600);
        }
      }

      // Turn on Demo Mode via clicking top-bar button if not active
      const isDemoActive = await page.$('.demo-mode-overlay');
      if (!isDemoActive) {
        const demoBtn = await page.$('.demo-mode-toggle-btn');
        if (demoBtn) {
          await demoBtn.click({ force: true });
          await page.waitForTimeout(500);
        }
      }

      // Evaluate overlay
      const evalResult = await page.evaluate(() => {
        const overlay = document.querySelector('.demo-mode-overlay');
        if (!overlay) return { success: false, reason: 'Demo overlay element not found' };

        const rects = Array.from(document.querySelectorAll('.demo-target-box')).map(el => {
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        });

        const bubbles = Array.from(document.querySelectorAll('.demo-bubble-card')).map(el => {
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height, text: el.innerText };
        });

        return {
          success: true,
          rectCount: rects.length,
          bubbleCount: bubbles.length,
          rects,
          bubbles
        };
      });

      if (!evalResult.success) {
        console.log(`FAIL: ${evalResult.reason}`);
        totalChecksFailed++;
        continue;
      }

      // Check 1: Target rectangles > 0 and width/height > 0
      let passed = true;
      let failureReason = '';

      if (evalResult.rectCount === 0) {
        passed = false;
        failureReason = 'No target rectangles rendered';
      }

      for (const r of evalResult.rects) {
        if (r.width <= 0 || r.height <= 0) {
          passed = false;
          failureReason = 'One or more target rectangles has zero dimensions';
          break;
        }
      }

      // Check 2: No bubble placed off screen (within 1920x1080)
      for (const b of evalResult.bubbles) {
        if (b.left < 0 || b.right > 1920 || b.top < 0 || b.bottom > 1080) {
          passed = false;
          failureReason = `Bubble off-screen: [${b.left}, ${b.top}, ${b.right}, ${b.bottom}]`;
          break;
        }
      }

      // Check 3: No bubble overlap
      for (let i = 0; i < evalResult.bubbles.length; i++) {
        for (let j = i + 1; j < evalResult.bubbles.length; j++) {
          if (rectsIntersect(evalResult.bubbles[i], evalResult.bubbles[j])) {
            passed = false;
            failureReason = `Bubbles intersect: #${i+1} and #${j+1}`;
            break;
          }
        }
        if (!passed) break;
      }

      // Save screenshot
      const screenPath = path.join(OUT_DIR, `${item.name}_${lang}.png`);
      await page.screenshot({ path: screenPath });

      if (passed) {
        console.log(`PASS (${evalResult.rectCount} targets, ${evalResult.bubbleCount} bubbles)`);
        totalChecksPassed++;
      } else {
        console.log(`FAIL: ${failureReason}`);
        totalChecksFailed++;
      }

      // Check Esc key exits Demo mode on last item of run
      if (item.name === 'evidence' && lang === 'bn') {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const stillOpen = await page.$('.demo-mode-overlay');
        if (stillOpen) {
          console.log('Esc check FAIL: overlay still open');
          totalChecksFailed++;
        } else {
          console.log('Esc check PASS: Demo mode closed on Escape key');
          totalChecksPassed++;
        }
      }
    }
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${totalChecksPassed} PASSED, ${totalChecksFailed} FAILED`);
  console.log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log(consoleErrors.join('\n'));
  }
  console.log('====================================================');

  await browser.close();
  process.exit(totalChecksFailed === 0 && consoleErrors.length === 0 ? 0 : 1);
})();
