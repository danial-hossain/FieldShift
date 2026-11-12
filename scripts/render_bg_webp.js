import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const bgDir = path.resolve('frontend/public/bg/layers');

async function renderLayers() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2400, height: 1500 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  const layers = [
    { file: '0_sky.svg', out: '0_sky.webp', isRgb: true, stripStars: true },
    { file: '1_far.svg', out: '1_far.webp', isRgb: false },
    { file: '2_land.svg', out: '2_land.webp', isRgb: false },
    { file: '3_mid.svg', out: '3_mid.webp', isRgb: false },
    { file: '4_fore.svg', out: '4_fore.webp', isRgb: false, stripFlies: true }
  ];

  for (const l of layers) {
    let svg = fs.readFileSync(path.join(bgDir, l.file), 'utf8');
    if (l.stripStars) {
      svg = svg.replace(/<circle\s+cx="[^"]+"\s+cy="[^"]+"\s+r="[^"]+"\s+fill="#fff"\s+opacity="[^"]+"\s*\/>/g, '');
    }
    if (l.stripFlies) {
      svg = svg.replace(/<circle\s+cx="[^"]+"\s+cy="[^"]+"\s+r="[^"]+"\s+fill="#ffe58a"[^>]*\/>/g, '');
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<style>
  html, body { margin: 0; padding: 0; width: 2400px; height: 1500px; overflow: hidden; background: ${l.isRgb ? '#0b1630' : 'transparent'}; }
  svg { width: 2400px; height: 1500px; display: block; }
</style>
</head>
<body>
  ${svg}
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'load' });
    const outPath = path.join(bgDir, l.out);
    await page.screenshot({
      path: outPath,
      type: 'webp',
      quality: 84,
      omitBackground: !l.isRgb
    });
    const stat = fs.statSync(outPath);
    console.log(`Rendered ${l.out}: ${Math.round(stat.size / 1024)} KB`);
  }

  await browser.close();
}

renderLayers().catch(console.error);
