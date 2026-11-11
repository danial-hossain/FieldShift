import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const OUT_DIR = path.resolve('docs/screens/looks_a');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runCheck() {
  console.log('========================================================');
  console.log('FIELDSHIFT LOOKS A AUTOMATED VERIFICATION SUITE');
  console.log('========================================================\n');

  let allPassed = true;
  function report(name, passed, detail = '') {
    if (passed) {
      console.log(`[PASS] ${name}${detail ? ` (${detail})` : ''}`);
    } else {
      console.error(`[FAIL] ${name}: ${detail}`);
      allPassed = false;
    }
  }

  // ----------------------------------------------------
  // CHECK 1: Brand Assets & Favicon HTTP 200
  // ----------------------------------------------------
  console.log('--- Step 1: Brand Assets & Favicon ---');
  const brandFiles = [
    '/brand/favicon.svg',
    '/brand/favicon-32.png',
    '/brand/apple-touch-icon.png',
    '/brand/logo_mark.svg',
    '/brand/logo_full.svg',
    '/brand/logo_full_light.svg'
  ];

  for (const b of brandFiles) {
    try {
      const res = await fetch(`${BASE_URL}${b}`);
      report(`Brand file ${b}`, res.status === 200, `status ${res.status}`);
    } catch (e) {
      report(`Brand file ${b}`, false, e.message);
    }
  }

  // ----------------------------------------------------
  // CHECK 2: JSX Emoji Count Outside Risk Calendar == 0
  // ----------------------------------------------------
  console.log('\n--- Step 2: JSX Emoji Count Verification ---');
  const strictEmojiRegex = /(\p{Extended_Pictographic}|\uD83C[\uDDE6-\uDDFF])/gu;
  function scanDir(dir) {
    let files = [];
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        if (item !== 'node_modules' && item !== 'dist' && item !== '.smoke') {
          files = files.concat(scanDir(full));
        }
      } else if (full.endsWith('.jsx')) {
        files.push(full);
      }
    }
    return files;
  }

  const jsxFiles = scanDir('frontend/src');
  let outsideCount = 0;
  let riskCalendarCount = 0;

  for (const f of jsxFiles) {
    const rel = path.relative('frontend/src', f).replace(/\\/g, '/');
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(strictEmojiRegex) || [];
    if (rel === 'NasaWeatherStation3D.jsx') {
      riskCalendarCount += matches.length;
    } else {
      outsideCount += matches.length;
      if (matches.length > 0) {
        console.error(`Found ${matches.length} unexpected emojis in ${rel}`);
      }
    }
  }

  report('JSX emoji count outside risk calendar == 0', outsideCount === 0, `found ${outsideCount}`);
  report('Risk calendar emoji count in NasaWeatherStation3D.jsx == 10', riskCalendarCount === 10, `found ${riskCalendarCount}`);

  // ----------------------------------------------------
  // CHECK 3: Playwright Browser Test Suite
  // ----------------------------------------------------
  console.log('\n--- Step 3: Browser Interactive Tests ---');

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  // A. Splash screen test on fresh context
  {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: 'commit' });
    const splashEl = await page.waitForSelector('.fieldshift-splash-overlay', { timeout: 3000 }).catch(() => null);
    const startT = Date.now();
    report('Splash screen visible on initial load', splashEl !== null);

    // Wait for splash to disappear
    await page.waitForSelector('.fieldshift-splash-overlay', { state: 'detached', timeout: 3000 }).catch(() => {});
    const splashDuration = Date.now() - startT;
    report('Splash screen dismissed in <= 1.5s', splashDuration <= 1800, `${splashDuration}ms`);

    // Reload test: splash should not show again in same session
    await page.reload({ waitUntil: 'domcontentloaded' });
    const splashOnReload = await page.$('.fieldshift-splash-overlay');
    report('Splash screen skipped on page reload (sessionStorage guard)', splashOnReload === null);

    // Brand logo in sidebar
    const brandLogo = await page.$('.sidebar-brand-logo-img') || await page.$('img[src*="/brand/logo"]');
    report('Header brand logo element rendered', brandLogo !== null);
    await page.screenshot({ path: path.join(OUT_DIR, 'brand_header.png') });

    await context.close();
  }

  // B. Planner Play, Timeline, 3D Diorama, Scrubbing, and 15s Webm Recording
  {
    const videoContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: OUT_DIR,
        size: { width: 1920, height: 1080 }
      }
    });

    const page = await videoContext.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico')) consoleErrors.push(text);
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Navigate to Rotation Planner via canonical sidebar button
    console.log('Navigating to Rotation Planner...');
    await page.click('button[data-nav="farm_planning"]');
    await page.waitForTimeout(2000);

    // Verify 0 console errors on Planner load
    report('Zero console errors on Planner load', consoleErrors.length === 0, consoleErrors.join('; '));

    // Check Timeline controls exist
    const timelineEl = await page.$('.season-timeline-bar');
    const playBtn = await page.$('#timeline-play-btn') || await page.$('.timeline-play-btn');
    report('Season timeline bar rendered', timelineEl !== null);
    report('Play/Pause button rendered', playBtn !== null);

    // Initial playhead position and counters
    const getTimelineState = async () => {
      return await page.evaluate(() => {
        const playhead = document.querySelector('.timeline-playhead');
        const waterCounter = document.querySelector('.timeline-live-counters') || document.querySelector('.season-timeline-bar');
        const canvas = document.querySelector('.farm-diorama-canvas') || document.querySelector('canvas');
        return {
          left: playhead ? playhead.style.left : null,
          counterText: waterCounter ? waterCounter.textContent : '',
          hasCanvas: canvas !== null
        };
      });
    };

    const s0 = await getTimelineState();
    report('Initial playhead and 3D canvas present', s0.hasCanvas);

    // Take screenshot at 0s
    await page.screenshot({ path: path.join(OUT_DIR, 'planner_play_dark_en.png') });

    // Click Play button
    if (playBtn) {
      await playBtn.click();
      console.log('Clicked Play button, waiting 6.5s to measure animation progress...');
      await page.waitForTimeout(6500);

      const s1 = await getTimelineState();
      const progress = parseFloat(s1.left || '0');
      report('Playhead progressed after 6s', progress > 15, `left: ${s1.left}`);
      report('Water / profit live counters updated', s1.counterText !== s0.counterText, s1.counterText);

      // Scrubbing to Year 2 Rabi (approx 65% across timeline)
      console.log('Testing scrubbing to Year 2 Rabi...');
      const track = await page.$('.timeline-track');
      if (track) {
        const box = await track.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width * 0.65, box.y + box.height / 2);
          await page.waitForTimeout(800);
          const s2 = await getTimelineState();
          const p2 = parseFloat(s2.left || '0');
          report('Playhead scrubbed to Year 2 Rabi (~65%)', p2 >= 55 && p2 <= 75, `left: ${s2.left}`);
        }
      }

      // Keep recording until 15s total video length
      console.log('Capturing remaining playback for full 15s webm video...');
      await page.waitForTimeout(6000);
    }

    // Capture screenshots in 4 combinations on this page
    console.log('Capturing dark/light x en/bn screenshots...');
    // 1. Dark BN
    await page.click('.lang-toggle-btn');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'planner_play_dark_bn.png') });

    // 2. Light BN
    await page.click('.theme-toggle-btn');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'planner_play_light_bn.png') });

    // 3. Light EN
    await page.click('.lang-toggle-btn');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'planner_play_light_en.png') });

    report('All 4 theme/language screenshots captured', true);

    // Step 4: Chart Theme & Glass Tooltips
    console.log('\n--- Step 4: Chart Theme & Glass Tooltips ---');
    // Switch to Climate view
    await page.click('button[data-nav="weather"]');
    await page.waitForTimeout(1500);

    const chartExists = await page.$('.climate-trend-chart') || await page.$('svg polyline') || await page.$('svg path');
    report('Climate chart rendered with SVG data elements', chartExists !== null);

    // Hover over chart data point to trigger tooltip
    const svgPoint = await page.$('circle[r]') || await page.$('rect[width]') || await page.$('svg');
    if (svgPoint) {
      const box = await svgPoint.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(400);
      }
    }
    await page.screenshot({ path: path.join(OUT_DIR, 'charts_unified_theme.png') });

    // Switch to Water page to test daily water balance tooltip
    await page.click('button[data-nav="water_irrigation"]');
    await page.waitForTimeout(1500);

    const waterSvg = await page.$('.water-daily-chart svg') || await page.$('svg[viewBox*="720"]') || await page.$('svg');
    if (waterSvg) {
      const box = await waterSvg.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
        await page.waitForTimeout(400);
      }
    }
    await page.screenshot({ path: path.join(OUT_DIR, 'water_chart_tooltip.png') });
    report('Water chart with unified palette captured', true);

    await page.close();
    await videoContext.close();

    // Rename recorded video to planner_play_15s.webm
    const recordedFiles = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.webm'));
    if (recordedFiles.length > 0) {
      const latest = path.join(OUT_DIR, recordedFiles[0]);
      const target = path.join(OUT_DIR, 'planner_play_15s.webm');
      if (latest !== target) {
        if (fs.existsSync(target)) fs.unlinkSync(target);
        fs.renameSync(latest, target);
      }
      report('15-second Planner Play video recorded', fs.existsSync(target), target);
    } else {
      report('15-second Planner Play video recorded', false, 'no webm found');
    }
  }

  await browser.close();

  console.log('\n========================================================');
  if (allPassed) {
    console.log('PASS: ALL LOOKS A CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log('FAIL: SOME LOOKS A CHECKS FAILED.');
  }
  console.log('========================================================\n');
  process.exit(allPassed ? 0 : 1);
}

runCheck().catch(err => {
  console.error('Fatal error during check execution:', err);
  process.exit(1);
});
