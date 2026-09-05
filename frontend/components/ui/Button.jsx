import React from 'react';

/**
 * Shared Button Component
 * Owner: P1 (Core HR)
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 500,
    borderRadius: 'var(--radius-md, 8px)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all var(--transition-fast, 150ms ease)',
    border: '1px solid transparent',
    userSelect: 'none',
    textDecoration: 'none',
    lineHeight: 1.25,
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.8125rem' },
    md: { padding: '8px 16px', fontSize: '0.875rem' },
    lg: { padding: '10px 20px', fontSize: '1rem' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary-600, #4f46e5)',
      color: '#ffffff',
      borderColor: 'var(--primary-600, #4f46e5)',
      boxShadow: 'var(--shadow-xs)',
    },
    secondary: {
      backgroundColor: 'var(--neutral-100, #f1f5f9)',
      color: 'var(--neutral-700, #334155)',
      borderColor: 'var(--neutral-300, #cbd5e1)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary-600, #4f46e5)',
      borderColor: 'var(--primary-600, #4f46e5)',
    },
    danger: {
      backgroundColor: 'var(--danger, #ef4444)',
      color: '#ffffff',
      borderColor: 'var(--danger, #ef4444)',
      boxShadow: 'var(--shadow-xs)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--neutral-600, #475569)',
      borderColor: 'transparent',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && <span>{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span>{icon}</span>}
    </button>
  );
}
