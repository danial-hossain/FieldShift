import fs from 'fs';
import path from 'path';

const bgDir = path.resolve('frontend/public/bg/layers');
const skySvg = fs.readFileSync(path.join(bgDir, '0_sky.svg'), 'utf8');
const farSvg = fs.readFileSync(path.join(bgDir, '1_far.svg'), 'utf8');
const midSvg = fs.readFileSync(path.join(bgDir, '3_mid.svg'), 'utf8');
const foreSvg = fs.readFileSync(path.join(bgDir, '4_fore.svg'), 'utf8');

// 1. Stars in 0_sky.svg: <circle cx="..." cy="..." r="..." fill="#fff" opacity="..."/>
const starRegex = /<circle\s+cx="([^"]+)"\s+cy="([^"]+)"\s+r="([^"]+)"\s+fill="#fff"\s+opacity="([^"]+)"\s*\/>/g;
const stars = [];
let m;
while ((m = starRegex.exec(skySvg)) !== null) {
  const cx = parseFloat(m[1]);
  const cy = parseFloat(m[2]);
  const r = parseFloat(m[3]);
  const op = parseFloat(m[4]);
  // percentage of 1600x1000 frame: cx/16, cy/10
  stars.push({
    cx,
    cy,
    r,
    opacity: op,
    xPct: Number((cx / 16).toFixed(2)),
    yPct: Number((cy / 10).toFixed(2))
  });
}

// 2. Fireflies in 4_fore.svg: <circle cx="..." cy="..." r="..." fill="#ffe58a".../>
const flyRegex = /<circle\s+cx="([^"]+)"\s+cy="([^"]+)"\s+r="([^"]+)"\s+fill="#ffe58a"[^>]*\/>/g;
const fireflies = [];
while ((m = flyRegex.exec(foreSvg)) !== null) {
  const cx = parseFloat(m[1]);
  const cy = parseFloat(m[2]);
  const r = parseFloat(m[3]);
  fireflies.push({
    cx,
    cy,
    r,
    xPct: Number((cx / 16).toFixed(2)),
    yPct: Number((cy / 10).toFixed(2))
  });
}

// 3. Hut windows (rect fill="#ffb24d" in 1_far.svg and 3_mid.svg)
const winRegex = /<rect\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"\s+fill="#ffb24d"[^>]*\/>/g;
const windows = [];
while ((m = winRegex.exec(farSvg)) !== null) {
  const x = parseFloat(m[1]);
  const y = parseFloat(m[2]);
  const w = parseFloat(m[3]);
  const h = parseFloat(m[4]);
  windows.push({
    layer: 'far',
    x, y, w, h,
    xPct: Number((x / 16).toFixed(2)),
    yPct: Number((y / 10).toFixed(2)),
    wPct: Number((w / 16).toFixed(2))
  });
}
while ((m = winRegex.exec(midSvg)) !== null) {
  const x = parseFloat(m[1]);
  const y = parseFloat(m[2]);
  const w = parseFloat(m[3]);
  const h = parseFloat(m[4]);
  windows.push({
    layer: 'mid',
    x, y, w, h,
    xPct: Number((x / 16).toFixed(2)),
    yPct: Number((y / 10).toFixed(2)),
    wPct: Number((w / 16).toFixed(2))
  });
}

console.log(`Parsed ${stars.length} stars, ${fireflies.length} fireflies, ${windows.length} windows`);

const bgSparkles = {
  stars,
  fireflies,
  windows
};

fs.writeFileSync(path.resolve('frontend/src/bgSparkles.json'), JSON.stringify(bgSparkles, null, 2));
console.log('Saved frontend/src/bgSparkles.json');
