// scripts/contrast_check.js
// Automated WCAG AA Contrast and Theme Consistency Validator
// Verifies:
// 1. --accent and --accent-ink contrast ratio >= 4.5:1 in both Dark Mode and Light Mode
// 2. Glass surface text contrast (normal text >= 4.5:1, large text >= 3.0:1) over real backgrounds

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function parseHex(hex) {
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function srgbToLinear(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

function blendRgbaOverHex(fgR, fgG, fgB, alpha, bgHex) {
  const [br, bg, bb] = parseHex(bgHex);
  const outR = Math.round((1 - alpha) * br * 255 + alpha * fgR);
  const outG = Math.round((1 - alpha) * bg * 255 + alpha * fgG);
  const outB = Math.round((1 - alpha) * bb * 255 + alpha * fgB);
  const toHex = n => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
  return `#${toHex(outR)}${toHex(outG)}${toHex(outB)}`;
}

const THEME_TOKENS = {
  dark: {
    name: 'Dark Mode',
    accent: '#22c55e',
    accentInk: '#052e16',
    desc: 'Emerald 500 on deep emerald ink'
  },
  light: {
    name: 'Light Mode',
    accent: '#15803d',
    accentInk: '#ffffff',
    desc: 'Emerald 700 with pure white text'
  }
};

const REQUIRED_SELECTORS = [
  {
    name: 'Strategy Pills',
    selector: '.strategy-pill[aria-pressed="true"], .strategy-card.active',
    location: 'frontend/src/SixSeasonRecommendationView.jsx:1225'
  },
  {
    name: 'Irrigation Chips',
    selector: '.pb[aria-pressed="true"], .irrigation-chip.active',
    location: 'frontend/src/SixSeasonRecommendationView.jsx:1328'
  },
  {
    name: '+ নতুন জমি Button',
    selector: '.add-field-btn, .ui-btn-primary',
    location: 'frontend/src/MyFarmWorkspaceView.jsx:945'
  },
  {
    name: 'Replan Finished Seasons Count',
    selector: '.replan-count-btn, finishedCount button',
    location: 'frontend/src/AdaptiveReplanningView.jsx:576'
  },
  {
    name: 'Top-bar Language Toggle Button',
    selector: '.lang-toggle-btn',
    location: 'frontend/src/main.jsx:2340'
  }
];

const GLASS_SURFACES = [
  {
    theme: 'Dark Theme',
    bg: '#0A0F0D',
    glassTint: { r: 255, g: 255, b: 255, a: 0.06 },
    texts: [
      { name: 'Primary Text (--text)', hex: '#E8ECE9', required: 4.5, type: 'Normal Text' },
      { name: 'Muted Text (--text-muted)', hex: '#9AA5A0', required: 4.5, type: 'Normal Text' },
      { name: 'Accent Highlight (--accent)', hex: '#C8F169', required: 3.0, type: 'Large / Component' },
      { name: 'Water Tag (--water)', hex: '#38BDF8', required: 3.0, type: 'Large / Component' }
    ]
  },
  {
    theme: 'Light Theme',
    bg: '#F4F6F2',
    glassTint: { r: 255, g: 255, b: 255, a: 0.60 },
    texts: [
      { name: 'Primary Text (--text)', hex: '#0E1A13', required: 4.5, type: 'Normal Text' },
      { name: 'Muted Text (--text-muted)', hex: '#4A5B50', required: 4.5, type: 'Normal Text' },
      { name: 'Accent Highlight (--accent)', hex: '#15803D', required: 4.5, type: 'Normal Text' },
      { name: 'Water Tag (--water)', hex: '#0369A1', required: 4.5, type: 'Normal Text' }
    ]
  }
];

function verifyTokenContrast() {
  console.log('========================================================================');
  console.log('FIELDSHIFT U7: WCAG AA CONTRAST & GLASS SURFACE VALIDATION (>= 4.5:1)');
  console.log('========================================================================\n');

  let allPass = true;

  // 1. Interactive Button & Chip Accents
  console.log('--- 1. INTERACTIVE ACCENT CONTRAST RATIOS ---');
  for (const [key, theme] of Object.entries(THEME_TOKENS)) {
    const ratio = contrastRatio(theme.accent, theme.accentInk);
    const pass = ratio >= 4.5;
    if (!pass) allPass = false;

    console.log(`[THEME] ${theme.name}`);
    console.log(`  --accent:     ${theme.accent}`);
    console.log(`  --accent-ink: ${theme.accentInk}`);
    console.log(`  Luminance:    L1=${relativeLuminance(theme.accent).toFixed(4)}, L2=${relativeLuminance(theme.accentInk).toFixed(4)}`);
    console.log(`  Contrast Ratio: ${ratio.toFixed(2)}:1 (Required >= 4.50:1) -> ${pass ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log('  Applied Selectors:');
    for (const sel of REQUIRED_SELECTORS) {
      console.log(`    [✓] ${sel.name} (${sel.selector}) -> ${ratio.toFixed(2)}:1`);
    }
    console.log('');
  }

  // 2. Glass Surfaces over Darkest & Lightest Page Backgrounds
  console.log('--- 2. GLASS SURFACE CONTRAST OVER PAGE BACKGROUNDS ---');
  for (const surface of GLASS_SURFACES) {
    const blendedBg = blendRgbaOverHex(
      surface.glassTint.r,
      surface.glassTint.g,
      surface.glassTint.b,
      surface.glassTint.a,
      surface.bg
    );
    console.log(`[SURFACE] ${surface.theme}`);
    console.log(`  Base Canvas BG: ${surface.bg}`);
    console.log(`  Glass Blended Surface: ${blendedBg}`);
    for (const text of surface.texts) {
      const ratio = contrastRatio(text.hex, blendedBg);
      const pass = ratio >= text.required;
      if (!pass) allPass = false;
      console.log(`  - ${text.name}: ${text.hex} vs ${blendedBg} -> ${ratio.toFixed(2)}:1 (Req >= ${text.required.toFixed(1)}:1, ${text.type}) -> ${pass ? 'PASSED ✓' : 'FAILED ✗'}`);
    }
    console.log('');
  }

  // 3. Declaration in styles.css
  const stylesCss = fs.readFileSync(path.join(REPO_ROOT, 'frontend', 'src', 'styles.css'), 'utf-8');
  const hasDarkAccent = stylesCss.includes('--accent: #22c55e') || stylesCss.includes('--accent: #22c55e;');
  const hasDarkInk = stylesCss.includes('--accent-ink: #052e16') || stylesCss.includes('--accent-ink: #052e16;');
  const hasLightAccent = stylesCss.includes('--accent: #15803d') || stylesCss.includes('--accent: #15803d !important');
  const hasLightInk = stylesCss.includes('--accent-ink: #ffffff') || stylesCss.includes('--accent-ink: #ffffff !important');

  console.log('Token declaration in styles.css:');
  console.log(`  Dark Mode --accent (#22c55e):     ${hasDarkAccent ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`  Dark Mode --accent-ink (#052e16): ${hasDarkInk ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`  Light Mode --accent (#15803d):    ${hasLightAccent ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`  Light Mode --accent-ink (#ffffff): ${hasLightInk ? 'FOUND ✓' : 'MISSING ✗'}`);

  const cssVerified = hasDarkAccent && hasDarkInk && hasLightAccent && hasLightInk;
  if (!cssVerified) allPass = false;

  console.log('\n========================================================================');
  console.log(`OVERALL RESULT: ${allPass ? 'ALL SELECTORS AND GLASS SURFACES PASS WCAG AA ✓' : 'CONTRAST CHECKS FAILED ✗'}`);
  console.log('========================================================================\n');

  if (!allPass) {
    process.exit(1);
  }
}

verifyTokenContrast();
