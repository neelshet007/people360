import React from 'react';

/**
 * Shared Button Component
 * Owner: P1 (Core HR)
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md', // sm, md, lg
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: 'var(--radius-md, 8px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.15s ease-in-out',
    border: '1px solid transparent',
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.8125rem' },
    md: { padding: '8px 16px', fontSize: '0.875rem' },
    lg: { padding: '10px 20px', fontSize: '1rem' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary-600, #4338ca)',
      color: '#ffffff',
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: 'var(--neutral-100, #f1f5f9)',
      color: 'var(--neutral-700, #334155)',
      borderColor: 'var(--neutral-200, #e2e8f0)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary-600, #4338ca)',
      borderColor: 'var(--primary-600, #4338ca)',
    },
    danger: {
      backgroundColor: 'var(--danger, #ef4444)',
      color: '#ffffff',
      borderColor: 'transparent',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      className={`btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
