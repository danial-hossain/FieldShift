import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://127.0.0.1:3000/?nav=farm_planning', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const res = await page.evaluate(() => {
    function getStyles(el) {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        backgroundColor: cs.backgroundColor,
        border: cs.border,
        boxShadow: cs.boxShadow,
      };
    }

    // (a) the outer page card (the "Multi-Season Farm Rotation Planning" header card)
    const headerCard = document.querySelector('.farm-planning-header-card') ||
      Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Multi-Season Farm Rotation Planning') || d.textContent.includes('ঘূর্ণন পরিকল্পনা'));

    // (b) the strategy bar
    const strategyBar = document.querySelector('.seg[data-demo="strategy_picker"]') || document.querySelector('.seg');

    // (c) a KPI tile
    const kpiTile = document.querySelector('.ba .calc-card-fly-in') || document.querySelector('.calc-card-fly-in');

    // (d) a season card
    const seasonCard = document.querySelector('.sc.calc-card-fly-in') || document.querySelector('.sc');

    return {
      headerCard: {
        foundSelector: headerCard ? headerCard.className : null,
        styles: getStyles(headerCard)
      },
      strategyBar: {
        foundSelector: strategyBar ? strategyBar.className : null,
        styles: getStyles(strategyBar)
      },
      kpiTile: {
        foundSelector: kpiTile ? kpiTile.className : null,
        styles: getStyles(kpiTile)
      },
      seasonCard: {
        foundSelector: seasonCard ? seasonCard.className : null,
        styles: getStyles(seasonCard)
      }
    };
  });

  console.log(JSON.stringify(res, null, 2));
  await browser.close();
}

main().catch(console.error);
