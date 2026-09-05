import React from 'react';

/**
 * Shared Radio Component
 * Owner: P1 (Core HR)
 */
export default function Radio({
  id,
  name,
  label,
  description,
  value,
  checked = false,
  onChange,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        marginBottom: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      className={`form-radio-wrapper ${className}`}
    >
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '16px',
          height: '16px',
          marginTop: '3px',
          accentColor: 'var(--primary-600, #4f46e5)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        {...props}
      />
      {(label || description) && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.875rem',
            color: disabled ? 'var(--neutral-400, #94a3b8)' : 'var(--neutral-700, #334155)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
          }}
        >
          {label && <span style={{ fontWeight: 500, display: 'block' }}>{label}</span>}
          {description && (
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)', display: 'block' }}>
              {description}
            </span>
          )}
        </label>
      )}
    </div>
  );
}
