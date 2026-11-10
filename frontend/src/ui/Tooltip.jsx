import React, { useState } from 'react';

export function Tooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom'
  className = '',
  style = {}
}) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  return (
    <span
      className={`ui-tooltip-wrapper ${className}`}
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="ui-tooltip-bubble"
          style={{
            position: 'absolute',
            ...(position === 'bottom'
              ? { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }
              : { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }),
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: 'var(--glass-surface-border)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--r-sm, 8px)',
            padding: '4px 8px',
            fontSize: '11.5px',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

export default Tooltip;
