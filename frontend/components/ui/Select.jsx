import React from 'react';

/**
 * Shared Select Component
 * Owner: P1 (Core HR)
 */
export default function Select({
  label,
  id,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--neutral-700, #334155)' }}
        >
          {label} {required && <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{
          padding: '8px 12px',
          fontSize: '0.875rem',
          borderRadius: 'var(--radius-md, 8px)',
          border: error
            ? '1px solid var(--danger, #ef4444)'
            : '1px solid var(--neutral-300, #cbd5e1)',
          outline: 'none',
          backgroundColor: disabled ? 'var(--neutral-100, #f1f5f9)' : '#ffffff',
          color: 'var(--neutral-900, #0f172a)',
        }}
        className={`form-select ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger, #ef4444)' }}>{error}</span>
      )}
    </div>
  );
}
