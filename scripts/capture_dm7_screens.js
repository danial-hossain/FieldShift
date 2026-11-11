const { chromium } = require('H:/FieldShift2026/frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // 1. Overview Section 0 with Play story button
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/screens/demo/overview_section_0_play.png' });
  console.log('Saved overview_section_0_play.png');

  // 2. Overview Section 2
  await page.evaluate(() => {
    window.scrollTo(0, window.innerHeight * 2);
    const scroller = document.querySelector('.story-scroll-container');
    if (scroller) scroller.scrollTop = window.innerHeight * 2;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/screens/demo/overview_section_2.png' });
  console.log('Saved overview_section_2.png');

  // 3. Overview Section 9
  await page.evaluate(() => {
    window.scrollTo(0, window.innerHeight * 9);
    const scroller = document.querySelector('.story-scroll-container');
    if (scroller) scroller.scrollTop = window.innerHeight * 9;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/screens/demo/overview_section_9.png' });
  console.log('Saved overview_section_9.png');

  // 4. Planner header padding
  const plannerNav = await page.$('[data-nav="planner"]');
  if (plannerNav) await plannerNav.click({ force: true });
  await page.waitForTimeout(2000);
  const headerCard = await page.$('.farm-planning-header-card');
  if (headerCard) {
    await headerCard.screenshot({ path: 'docs/screens/demo/planner_header_padding.png' });
  } else {
    await page.screenshot({ path: 'docs/screens/demo/planner_header_padding.png' });
  }
  console.log('Saved planner_header_padding.png');

  // 5. Water details table open
  const waterNav = await page.$('[data-nav="water"]');
  if (waterNav) await waterNav.click({ force: true });
  await page.waitForTimeout(2000);
  // Click accordion to open water balance details
  const accHeader = await page.$('.wp-accordion-header') || await page.$('[data-demo="water_balance_details"]');
  if (accHeader) {
    await accHeader.click({ force: true });
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: 'docs/screens/demo/water_details_table_open.png' });
  console.log('Saved water_details_table_open.png');

  await browser.close();
  console.log('All DM7 screenshots captured successfully!');
})();
