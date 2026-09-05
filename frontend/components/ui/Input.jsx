import React from 'react';

/**
 * Shared Input Component
 * Owner: P1 (Core HR)
 */
export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  leftIcon = null,
  rightIcon = null,
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

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--neutral-400, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: '8px 12px',
            paddingLeft: leftIcon ? '36px' : '12px',
            paddingRight: rightIcon ? '36px' : '12px',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: error
              ? '1px solid var(--danger, #ef4444)'
              : '1px solid var(--neutral-300, #cbd5e1)',
            outline: 'none',
            backgroundColor: disabled ? 'var(--neutral-100, #f1f5f9)' : '#ffffff',
            color: 'var(--neutral-900, #0f172a)',
            transition: 'border-color var(--transition-fast)',
            boxShadow: 'var(--shadow-xs)',
            ...style,
          }}
          className={`form-input ${className}`}
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              color: 'var(--neutral-400, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {rightIcon}
          </span>
        )}
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
