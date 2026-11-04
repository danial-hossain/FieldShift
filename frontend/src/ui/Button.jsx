import React from 'react';

export function Button({
  children,
  icon,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'xs' | 'sm' | 'md'
  className = '',
  style = {},
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  let sizeStyle = {};
  if (size === 'xs') {
    sizeStyle = {
      padding: '4px 10px',
      fontSize: 11.5,
      height: 26,
      minHeight: 26,
      borderRadius: 6,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5
    };
  }

  let variantStyle = {};
  if (variant === 'danger') {
    variantStyle = {
      background: 'rgba(239, 68, 68, 0.12)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    };
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`}
      style={{
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...sizeStyle,
        ...variantStyle,
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', fontSize: size === 'xs' ? 11 : (size === 'sm' ? 12 : 14) }}>{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
