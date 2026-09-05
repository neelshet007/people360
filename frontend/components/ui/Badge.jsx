import React from 'react';

/**
 * Shared Badge Component
 * Owner: P1 (Core HR)
 */
export default function Badge({
  children,
  variant = 'neutral', // neutral, success, warning, danger, info
  dot = false,
  outline = false,
  className = '',
  style = {},
}) {
  const variantStyles = {
    neutral: {
      backgroundColor: outline ? 'transparent' : 'var(--neutral-100, #f1f5f9)',
      color: 'var(--neutral-700, #334155)',
      border: `1px solid ${outline ? 'var(--neutral-300, #cbd5e1)' : 'transparent'}`,
      dotColor: 'var(--neutral-500, #64748b)',
    },
    success: {
      backgroundColor: outline ? 'transparent' : 'var(--success-bg, #ecfdf5)',
      color: 'var(--success-dark, #047857)',
      border: `1px solid ${outline ? 'var(--success-border, #a7f3d0)' : 'transparent'}`,
      dotColor: 'var(--success, #10b981)',
    },
    warning: {
      backgroundColor: outline ? 'transparent' : 'var(--warning-bg, #fffbeb)',
      color: 'var(--warning-dark, #b45309)',
      border: `1px solid ${outline ? 'var(--warning-border, #fde68a)' : 'transparent'}`,
      dotColor: 'var(--warning, #f59e0b)',
    },
    danger: {
      backgroundColor: outline ? 'transparent' : 'var(--danger-bg, #fef2f2)',
      color: 'var(--danger-dark, #b91c1c)',
      border: `1px solid ${outline ? 'var(--danger-border, #fecaca)' : 'transparent'}`,
      dotColor: 'var(--danger, #ef4444)',
    },
    info: {
      backgroundColor: outline ? 'transparent' : 'var(--info-bg, #eff6ff)',
      color: 'var(--info-dark, #1d4ed8)',
      border: `1px solid ${outline ? 'var(--info-border, #bfdbfe)' : 'transparent'}`,
      dotColor: 'var(--info, #3b82f6)',
    },
  };

  const current = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full, 9999px)',
        backgroundColor: current.backgroundColor,
        color: current.color,
        border: current.border,
        lineHeight: 1.25,
        ...style,
      }}
      className={`badge badge-${variant} ${className}`}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: current.dotColor,
          }}
        />
      )}
      {children}
    </span>
  );
}
