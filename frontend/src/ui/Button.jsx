import React from 'react';

export function Button({
  children,
  icon,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  loading = false,
  className = '',
  style = undefined,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <span className="ui-btn-spinner" aria-hidden="true">⏳</span>
      ) : icon ? (
        <span className="ui-btn-icon" aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export default Button;
