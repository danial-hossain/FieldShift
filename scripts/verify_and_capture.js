// scripts/verify_and_capture.js
import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs/screens/glass_unification');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const PAGES = [
  { name: 'planner', nav: 'farm_planning' },
  { name: 'my_fields', nav: 'field' },
  { name: 'climate', nav: 'weather' },
  { name: 'water', nav: 'water_irrigation' },
  { name: 'market', nav: 'harvest_profit' },
  { name: 'evidence', nav: 'data_evidence' },
];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-gl=angle', '--use-angle=d3d11']
  });

  for (const p of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`http://127.0.0.1:3000/?nav=${p.nav}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const screenshotPath = path.join(outDir, `${p.name}_1080p.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: ${screenshotPath}`);

    if (p.name === 'market') {
      const texts = await page.evaluate(() => {
        const body = document.body.innerText;
        return {
          hasBalanced: body.includes('Balanced') || body.includes('সুষম'),
          hasProfit: body.includes('Profit') || body.includes('লাভজনক'),
          hasProfitFocused: body.includes('Profit-focused'),
          hasWaterSaving: body.includes('Water saving') || body.includes('পানি সাশ্রয়ী'),
          hasWaterSavingHyphen: body.includes('Water-saving'),
          hasAmanRice: body.includes('Aman rice') || body.includes('আমন ধান'),
          hasPlainRice: body.includes(' Rice ') || body.includes(' Rice\n'),
          hasY1_S1: body.includes('Y1_S1'),
          hasYear1Rabi: body.includes('Year 1 · Rabi') || body.includes('১ম বছর · রবি')
        };
      });
      console.log('Market checks:', texts);
    }

    if (p.name === 'climate') {
      const texts = await page.evaluate(() => {
        const body = document.body.innerText;
        return {
          hasWaterStorageTrend: body.includes('water storage (GRACE-FO)') || body.includes('পানি সঞ্চয় (GRACE-FO)'),
          hasGroundwaterStorage: body.includes('Key trend: Groundwater storage')
        };
      });
      console.log('Climate checks:', texts);
    }

    if (p.name === 'planner') {
      const texts = await page.evaluate(() => {
        const body = document.body.innerText;
        return {
          hasLowWater: body.includes('Low water') || body.includes('কম পানি'),
          hasMustard: body.includes('Mustard') || body.includes('সরিষা')
        };
      });
      console.log('Planner checks:', texts);
    }

    await page.close();
  }

  await browser.close();
  console.log('All captures and verifications complete.');
}

main().catch(console.error);

