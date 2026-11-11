import React from 'react';
import { useCountUp } from './useCountUp.js';

export function Stat({
  label,
  value,
  unit,
  sub,
  tone = 'neutral', // 'neutral' | 'accent' | 'leaf' | 'water' | 'sun' | 'alert' | 'hud'
  className = '',
  style = {}
}) {
  const animatedValue = useCountUp(value, 600);
  const isMissing = value == null || value === '' || value === '—' || value === 'তথ্য নেই' || value === 'No data';
  const toneClass = (!isMissing && tone !== 'neutral') ? `ui-stat-tone-${tone}` : '';

  return (
    <div className={`ui-stat ${className}`} style={style}>
      {label && <span className="ui-stat-label">{label}</span>}
      <div className="ui-stat-value-wrap">
        {isMissing ? (
          <span className="ui-stat-empty" style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>
            {value === 'No data' ? 'No data' : 'তথ্য নেই'}
          </span>
        ) : (
          <>
            <span className={`ui-stat-value ${toneClass}`}>{animatedValue}</span>
            {unit && <span className="ui-stat-unit">{unit}</span>}
          </>
        )}
      </div>
      {sub && <span className="ui-stat-sub">{sub}</span>}
    </div>
  );
}

export default Stat;
