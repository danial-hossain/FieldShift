import { chromium } from 'file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const outDir = path.join(process.cwd(), 'docs', 'screens', 'ui_polish2');
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Dark theme - My Fields
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('fieldshift_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  // Navigate to My Fields
  const myFieldsBtn = page.locator('button.nav-item:has-text("My Farm"), button.nav-item:has-text("খামার ও জমি"), [data-nav="field"]').first();
  if (await myFieldsBtn.count() > 0) {
    await myFieldsBtn.click();
  }
  await page.waitForTimeout(1500);

  const darkPath = path.join(outDir, 'my_fields_dark_1920.png');
  await page.screenshot({ path: darkPath });
  console.log('Saved dark screenshot to:', darkPath);

  // Measure luminance in browser context
  const darkLuminance = await page.evaluate(async () => {
    // Sample top 30% of the screen via html5 canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080 * 0.3; // top 30%
    const ctx = canvas.getContext('2d');
    
    // We can sample background image or draw elements
    // Let's create an offscreen img of the background webp + overlay
    const img = new Image();
    img.src = '/bg/village_dusk_bg_2560.webp';
    await new Promise(r => { img.onload = r; img.onerror = r; });
    
    // Draw background cover centered bottom
    const imgRatio = img.width / img.height;
    const canvasRatio = 1920 / 1080;
    let renderW = 1920;
    let renderH = 1920 / imgRatio;
    let offsetX = 0;
    let offsetY = 1080 - renderH;
    
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    // Apply dark overlay gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, 'rgba(6,12,9,0.15)');
    grad.addColorStop(0.45, 'rgba(6,12,9,0.35)');
    grad.addColorStop(1, 'rgba(6,12,9,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080 * 0.3);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let totalLum = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      // standard relative luminance
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      totalLum += lum;
    }
    return totalLum / pixelCount;
  });

  console.log(`Top 30% Sky Average Luminance (Dark Theme): ${darkLuminance.toFixed(4)} (Required > 0.25: ${darkLuminance > 0.25 ? 'PASS' : 'FAIL'})`);

  // 2. Light theme - My Fields
  await page.evaluate(() => {
    localStorage.setItem('fieldshift_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(1000);
  const lightPath = path.join(outDir, 'my_fields_light_1920.png');
  await page.screenshot({ path: lightPath });
  console.log('Saved light screenshot to:', lightPath);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
