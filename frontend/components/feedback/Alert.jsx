import React from 'react';
import { CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon } from '../ui/Icons';

/**
 * Enterprise Alert Component
 * Supports types: info, success, warning, danger, error
 */
export default function Alert({
  title,
  children,
  message,
  type = 'info',
  action,
  className = '',
  style = {},
}) {
  const normType = type === 'error' ? 'danger' : type;

  const typeConfig = {
    info: {
      bg: 'var(--info-bg, #f0f9ff)',
      border: 'var(--info-border, #bae6fd)',
      text: 'var(--info-dark, #0369a1)',
      Icon: AlertCircleIcon,
    },
    success: {
      bg: 'var(--success-bg, #ecfdf5)',
      border: 'var(--success-border, #a7f3d0)',
      text: 'var(--success-dark, #065f46)',
      Icon: CheckCircleIcon,
    },
    warning: {
      bg: 'var(--warning-bg, #fffbeb)',
      border: 'var(--warning-border, #fde68a)',
      text: 'var(--warning-dark, #92400e)',
      Icon: AlertTriangleIcon,
    },
    danger: {
      bg: 'var(--danger-bg, #fef2f2)',
      border: 'var(--danger-border, #fecaca)',
      text: 'var(--danger-dark, #991b1b)',
      Icon: AlertCircleIcon,
    },
  };

  const current = typeConfig[normType] || typeConfig.info;
  const Icon = current.Icon;

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        borderRadius: 'var(--radius-md, 6px)',
        color: current.text,
        marginBottom: '16px',
        fontSize: '0.8125rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        lineHeight: 1.45,
        ...style,
      }}
      className={`alert alert-${normType} ${className}`}
      role="alert"
    >
      <span style={{ flexShrink: 0, marginTop: '2px' }}>
        <Icon size={16} color="currentColor" />
      </span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
        <div>{message || children}</div>
      </div>
      {action && <div style={{ flexShrink: 0, marginLeft: '8px' }}>{action}</div>}
    </div>
  );
}
