import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.stack || err.message);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.error('Navigation error:', e.message);
  }

  console.log('--- CONSOLE ERRORS ---');
  consoleErrors.forEach(e => console.log(e));

  console.log('--- PAGE ERRORS ---');
  pageErrors.forEach(e => console.log(e));

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- BODY TEXT ---');
  console.log(bodyText.slice(0, 1000));

  await browser.close();
}

main().catch(console.error);

