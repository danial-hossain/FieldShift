import React from 'react';

/**
 * Shared SourceChip Component (P2 / M7)
 * Displays honest data provenance chips:
 * "আপনার দেওয়া" | "SoilGrids" | "NASA POWER" | "GPM IMERG" | "ধরে নেওয়া" | "হিসাবকৃত (Saxton-Rawls)"
 */
export function SourceChip({
  source = 'user',
  lang = 'bn',
  size = 'sm',
  style = {},
  className = ''
}) {
  let label = source;
  let bg = 'rgba(255, 255, 255, 0.06)';
  let color = 'var(--text-dim, #94a3b8)';
  let border = '1px solid rgba(255, 255, 255, 0.12)';

  const s = String(source).toLowerCase();

  if (s.includes('user') || s.includes('আপনার') || s.includes('কৃষক')) {
    label = lang === 'bn' ? 'আপনার দেওয়া' : 'User Input';
    bg = 'rgba(34, 197, 94, 0.12)';
    color = '#4ade80';
    border = '1px solid rgba(34, 197, 94, 0.28)';
  } else if (s.includes('soilgrids') || s.includes('isric')) {
    label = 'SoilGrids';
    bg = 'rgba(245, 158, 11, 0.12)';
    color = '#fbbf24';
    border = '1px solid rgba(245, 158, 11, 0.28)';
  } else if (s.includes('saxton') || s.includes('rawls')) {
    label = lang === 'bn' ? 'হিসাবকৃত (Saxton-Rawls)' : 'Computed (Saxton-Rawls)';
    bg = 'rgba(168, 85, 247, 0.12)';
    color = '#c084fc';
    border = '1px solid rgba(168, 85, 247, 0.28)';
  } else if (s.includes('power') || s.includes('nasa power')) {
    label = 'NASA POWER';
    bg = 'rgba(56, 189, 248, 0.12)';
    color = '#38bdf8';
    border = '1px solid rgba(56, 189, 248, 0.28)';
  } else if (s.includes('imerg') || s.includes('gpm')) {
    label = 'GPM IMERG';
    bg = 'rgba(14, 165, 233, 0.12)';
    color = '#0284c7';
    border = '1px solid rgba(14, 165, 233, 0.28)';
  } else if (s.includes('class') || s.includes('গড় মান') || s.includes('মাপা নয়')) {
    label = lang === 'bn' ? 'এই মাটির ধরনের গড় মান (মাপা নয়)' : 'Class Average (Not Measured)';
    bg = 'rgba(148, 163, 184, 0.1)';
    color = '#94a3b8';
    border = '1px solid rgba(148, 163, 184, 0.2)';
  } else if (s.includes('offline') || s.includes('অফলাইন')) {
    label = lang === 'bn' ? 'SoilGrids তথ্য পাওয়া যায়নি (অফলাইন)' : 'SoilGrids unavailable (offline)';
    bg = 'rgba(239, 68, 68, 0.1)';
    color = '#f87171';
    border = '1px solid rgba(239, 68, 68, 0.2)';
  } else if (s.includes('assumed') || s.includes('ধরে নেওয়া') || s.includes('default')) {
    label = lang === 'bn' ? 'ধরে নেওয়া' : 'Assumed';
    bg = 'rgba(148, 163, 184, 0.1)';
    color = '#94a3b8';
    border = '1px solid rgba(148, 163, 184, 0.2)';
  }

  return (
    <span
      className={`source-chip ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: size === 'xs' ? 10 : 11,
        fontWeight: 600,
        padding: size === 'xs' ? '1px 6px' : '2px 8px',
        borderRadius: 6,
        background: bg,
        color,
        border,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

export default SourceChip;
