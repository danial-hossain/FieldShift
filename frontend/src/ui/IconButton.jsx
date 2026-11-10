import React from 'react';

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  title,
  variant = 'secondary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'sm' (32px) | 'md' (40px) | 'lg' (48px)
  className = '',
  style = undefined,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel || title}
      title={title || ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`ui-btn ui-btn-${variant} ui-icon-btn ui-icon-btn-${size} ${className}`}
      style={style}
      {...props}
    >
      {icon}
    </button>
  );
}

export default IconButton;
