import React from 'react';

/**
 * Shared DatePicker Component
 * Owner: P1 (Core HR)
 */
export default function DatePicker({
  label,
  id,
  value,
  onChange,
  min,
  max,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--neutral-700, #334155)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{label}</span>
          {required && <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="date"
          value={value || ''}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: error
              ? '1px solid var(--danger, #ef4444)'
              : '1px solid var(--neutral-300, #cbd5e1)',
            outline: 'none',
            backgroundColor: disabled ? 'var(--neutral-100, #f1f5f9)' : '#ffffff',
            color: 'var(--neutral-900, #0f172a)',
            boxShadow: 'var(--shadow-xs)',
            ...style,
          }}
          className={`form-date-input ${className}`}
          {...props}
        />
      </div>

      {helperText && !error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500, #64748b)' }}>
          {helperText}
        </span>
      )}

      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger, #ef4444)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
