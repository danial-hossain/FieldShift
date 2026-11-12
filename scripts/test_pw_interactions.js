import { chromium } from 'file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });

  // 1. Check top search box count
  const searchInputs = await page.locator('.global-top-bar input, header input, input[placeholder*="Search parcels" i]').count();
  console.log('Search inputs count in topbar:', searchInputs);

  // 2. Check Help button and modal
  const helpBtn = page.locator('button.help-guide-btn').first();
  console.log('Help button count:', await helpBtn.count());
  await helpBtn.click();
  await page.waitForTimeout(400);
  const helpPanel = page.locator('.help-guide-panel');
  const helpPanelVisible = await helpPanel.isVisible();
  console.log('Help panel visible after click:', helpPanelVisible);
  
  // Count the 5 steps in the help panel
  const stepsCount = await page.locator('.help-guide-panel div[style*="border-radius: 12px"]').count();
  console.log('Help panel step cards count:', stepsCount);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const helpVisibleAfterEsc = await helpPanel.isVisible().catch(() => false);
  console.log('Help modal visible after Esc:', helpVisibleAfterEsc);

  // 3. Check Bell button and alerts panel
  const bellBtn = page.locator('button.notification-bell-btn').first();
  console.log('Bell button count:', await bellBtn.count());
  const alertBadge = bellBtn.locator('.notification-badge-count').first();
  const alertBadgeCount = await alertBadge.count();
  console.log('Alert badge present:', alertBadgeCount > 0);
  if (alertBadgeCount > 0) {
    const alertCountText = await alertBadge.textContent();
    console.log('Bell alert badge text:', alertCountText);
  }
  await bellBtn.click();
  await page.waitForTimeout(400);
  const alertsVisible = await page.locator('.notification-popover-panel').isVisible();
  console.log('Alerts panel visible after click:', alertsVisible);
  await bellBtn.click(); // close it
  await page.waitForTimeout(200);

  await browser.close();
  console.log('PASS');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
