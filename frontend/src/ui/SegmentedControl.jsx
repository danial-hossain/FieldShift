import React from 'react';

export function SegmentedControl({
  options = [], // [{ value: 'A', label: 'Option A' }]
  value,
  onChange,
  size = 'md', // 'sm' | 'md'
  className = '',
  style = {}
}) {
  const isSm = size === 'sm';

  return (
    <div
      className={`ui-segmented-control ${className}`}
      style={style}
      role="group"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: isSm ? '4px 10px' : '6px 14px',
              fontSize: isSm ? '12px' : '13.5px',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? 'var(--accent-ink)' : 'var(--text-muted)',
              background: isSelected ? 'var(--accent)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--r-sm, 8px)',
              cursor: 'pointer',
              transition: 'all 160ms ease',
              boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
