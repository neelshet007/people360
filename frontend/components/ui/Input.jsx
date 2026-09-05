import React from 'react';

/**
 * Enterprise Form Input Component
 * Supports left/right icons, validation error states, focus rings, and helper text
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
    <div className="pp-form-group">
      {label && (
        <label htmlFor={id} className="pp-label">
          <span>{label}</span>
          {required && <span style={{ color: 'var(--danger, #dc2626)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '11px',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 1,
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
            paddingLeft: leftIcon ? '32px' : '10px',
            paddingRight: rightIcon ? '32px' : '10px',
            ...style,
          }}
          className={`pp-input ${error ? 'pp-input-error' : ''} ${className}`}
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '11px',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {helperText && !error && <span className="pp-helper-text">{helperText}</span>}
      {error && <span className="pp-error-text">{error}</span>}
    </div>
  );
}
