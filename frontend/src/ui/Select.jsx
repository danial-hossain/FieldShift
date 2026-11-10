import React from 'react';

export function Select({
  value,
  onChange,
  children,
  options = [],
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`ui-select ${className}`}
      style={{
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style
      }}
      {...props}
    >
      {options && options.length > 0
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: 'var(--surface)', color: 'var(--text)' }}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
}

export default Select;
