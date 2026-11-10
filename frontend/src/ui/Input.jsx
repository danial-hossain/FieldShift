import React from 'react';

export function Input({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`ui-input ${className}`}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
      {...props}
    />
  );
}

export default Input;
