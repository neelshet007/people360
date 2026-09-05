import React from 'react';

/**
 * Shared Badge Component
 * Owner: P1 (Core HR)
 */
export default function Badge({
  children,
  variant = 'neutral', // neutral, success, warning, danger, info
  className = '',
}) {
  const variantStyles = {
    neutral: {
      backgroundColor: 'var(--neutral-100, #f1f5f9)',
      color: 'var(--neutral-700, #334155)',
    },
    success: {
      backgroundColor: 'var(--success-bg, #ecfdf5)',
      color: 'var(--success, #10b981)',
    },
    warning: {
      backgroundColor: 'var(--warning-bg, #fffbeb)',
      color: 'var(--warning, #f59e0b)',
    },
    danger: {
      backgroundColor: 'var(--danger-bg, #fef2f2)',
      color: 'var(--danger, #ef4444)',
    },
    info: {
      backgroundColor: 'var(--info-bg, #eff6ff)',
      color: 'var(--info, #3b82f6)',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: '9999px',
        ...variantStyles[variant],
      }}
      className={`badge ${className}`}
    >
      {children}
    </span>
  );
}
