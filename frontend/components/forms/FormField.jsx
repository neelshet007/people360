import React from 'react';

/**
 * Shared FormField Component
 * Owner: P1 (Core HR)
 */
export default function FormField({
  label,
  htmlFor,
  required = false,
  error = null,
  helperText = null,
  children,
  className = '',
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '16px',
        ...style,
      }}
      className={`form-field ${className}`}
    >
      {label && (
        <label
          htmlFor={htmlFor}
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

      {children}

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
