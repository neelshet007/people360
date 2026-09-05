import React from 'react';
import { ChevronDownIcon } from './Icons';

/**
 * Enterprise Select Dropdown Component
 * Features custom vector chevron, focus states, and validation alerts
 */
export default function Select({
  label,
  id,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  helperText,
  disabled = false,
  required = false,
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

      <div style={{ position: 'relative' }}>
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          style={{
            paddingRight: '32px',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            ...style,
          }}
          className={`pp-select ${error ? 'pp-input-error' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Vector Chevron Indicator */}
        <div
          style={{
            position: 'absolute',
            right: '11px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDownIcon size={14} />
        </div>
      </div>

      {helperText && !error && <span className="pp-helper-text">{helperText}</span>}
      {error && <span className="pp-error-text">{error}</span>}
    </div>
  );
}
