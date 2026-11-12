const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
  });
  page.on('pageerror', err => {
    errors.push('PAGEERROR: ' + (err.stack || err.message));
  });
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('Title:', await page.title());
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log('Root innerHTML length:', rootHtml ? rootHtml.length : 'NULL');
    if (rootHtml) console.log('Root HTML snippet:', rootHtml.slice(0, 300));
  } catch (e) {
    console.log('Goto error:', e.message);
  }
  console.log('Captured errors count:', errors.length);
  errors.forEach(e => console.log(e));
  await browser.close();
})();
