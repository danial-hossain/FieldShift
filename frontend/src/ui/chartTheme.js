// frontend/src/ui/chartTheme.js
// Shared Chart Theme across Climate, Water, Market, Planner/Compare, and Evidence charts (LA3)
import React from 'react';

export const CHART_PALETTE = {
  dark: {
    lime: '#C8F169',
    cyan: '#5BE3FF',
    amber: '#F5B04C',
    coral: '#FF7A6B',
    violet: '#A78BFA',
    grid: 'rgba(255, 255, 255, 0.06)',
    axisText: '#8FA394',
    cardBg: 'rgba(8, 14, 11, 0.85)',
    cardBorder: 'rgba(255, 255, 255, 0.10)',
    tooltipBg: 'rgba(8, 14, 11, 0.92)',
    tooltipBorder: 'rgba(255, 255, 255, 0.15)',
    crosshair: 'rgba(200, 241, 105, 0.45)',
  },
  light: {
    lime: '#2E7D32',
    cyan: '#0284C7',
    amber: '#D97706',
    coral: '#E11D48',
    violet: '#7C3AED',
    grid: 'rgba(0, 0, 0, 0.08)',
    axisText: '#4B5563',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    cardBorder: 'rgba(0, 0, 0, 0.10)',
    tooltipBg: 'rgba(255, 255, 255, 0.96)',
    tooltipBorder: 'rgba(0, 0, 0, 0.15)',
    crosshair: 'rgba(46, 125, 50, 0.45)',
  },
};

export function getChartTheme(theme = 'dark') {
  return CHART_PALETTE[theme === 'light' ? 'light' : 'dark'];
}

export function toBanglaDigits(val) {
  if (val == null) return '';
  const digits = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return String(val).replace(/[0-9]/g, (c) => digits[c] || c);
}

export function formatChartNumber(num, dec = 0, lang = 'en') {
  if (num == null || isNaN(Number(num))) return '—';
  const val = Number(num).toFixed(dec);
  return lang === 'bn' ? toBanglaDigits(val) : val;
}

export function computeTrendTakeaway(vals = [], unit = '', lang = 'en') {
  if (!vals || vals.length < 3) return null;
  const n = vals.length;
  const xMean = (n - 1) / 2;
  const yMean = vals.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (vals[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  const slopePerYear = den !== 0 ? num / den : 0;
  const slopePerDecade = Math.round(slopePerYear * 10);
  const sign = slopePerDecade > 0 ? '+' : slopePerDecade < 0 ? '−' : '';
  const absVal = Math.abs(slopePerDecade);

  const isSignificant = Math.abs(slopePerDecade) > (yMean * 0.08);

  if (lang === 'bn') {
    const digits = toBanglaDigits(absVal);
    const sigStr = isSignificant ? 'তাৎপর্যপূর্ণ প্রবণতা' : 'তাৎপর্যপূর্ণ নয়';
    return `প্রতি দশকে ${sign}${digits} ${unit}, ${sigStr}`;
  }

  const sigStr = isSignificant ? 'significant trend' : 'not significant';
  return `${sign}${absVal} ${unit} per decade, ${sigStr}`;
}

export function ChartTooltip({
  visible = false,
  x = 0,
  y = 0,
  title = '',
  value = '',
  unit = '',
  theme = 'dark',
}) {
  if (!visible) return null;
  const colors = getChartTheme(theme);
  return React.createElement(
    'div',
    {
      className: 'chart-glass-tooltip',
      style: {
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -120%)',
        pointerEvents: 'none',
        zIndex: 50,
        padding: '6px 12px',
        borderRadius: 8,
        background: colors.tooltipBg,
        border: `1px solid ${colors.tooltipBorder}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        fontSize: 12,
        fontWeight: 600,
        color: theme === 'light' ? '#111827' : '#F4F7F4',
        whiteSpace: 'nowrap',
      },
    },
    title ? React.createElement('div', { style: { fontSize: 10.5, color: colors.axisText, marginBottom: 2 } }, title) : null,
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 5 } },
      React.createElement('span', { style: { fontVariantNumeric: 'tabular-nums', fontWeight: 700 } }, value),
      unit ? React.createElement('span', { style: { fontSize: 11, color: colors.axisText } }, unit) : null
    )
  );
}

export default {
  CHART_PALETTE,
  getChartTheme,
  toBanglaDigits,
  formatChartNumber,
  computeTrendTakeaway,
  ChartTooltip,
};
