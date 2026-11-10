import React from 'react';

export function Chip({
  children,
  icon,
  active = false,
  variant = 'glass', // 'glass' | 'accent' | 'water' | 'warn' | 'danger'
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const isClickable = Boolean(onClick);

  let bg = 'var(--glass-surface-bg)';
  let fg = 'var(--text)';
  let border = 'var(--glass-surface-border)';

  if (active || variant === 'accent') {
    bg = 'var(--accent)';
    fg = 'var(--accent-ink)';
    border = '1px solid var(--accent)';
  } else if (variant === 'water') {
    bg = 'rgba(56, 189, 248, 0.15)';
    fg = 'var(--water)';
    border = '1px solid rgba(56, 189, 248, 0.35)';
  } else if (variant === 'warn') {
    bg = 'rgba(245, 158, 11, 0.15)';
    fg = 'var(--warn)';
    border = '1px solid rgba(245, 158, 11, 0.35)';
  } else if (variant === 'danger') {
    bg = 'rgba(239, 68, 68, 0.15)';
    fg = 'var(--danger)';
    border = '1px solid rgba(239, 68, 68, 0.35)';
  }

  return (
    <span
      className={`ui-chip ui-chip-${variant} ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: 'var(--r-full, 9999px)',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.2,
        background: bg,
        color: fg,
        border: border,
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'var(--shadow-sm)',
        cursor: isClickable ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        transition: 'all 160ms ease-out',
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', fontSize: '13px' }}>{icon}</span>}
      {children}
    </span>
  );
}

export default Chip;
