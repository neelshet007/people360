import React from 'react';

/**
 * Shared Alert Component
 * Owner: P1 (Core HR)
 */
export default function Alert({ title, children, type = 'info', className = '' }) {
  const stylesMap = {
    info: { bg: 'var(--info-bg, #eff6ff)', border: '#bfdbfe', text: '#1e40af' },
    success: { bg: 'var(--success-bg, #ecfdf5)', border: '#a7f3d0', text: '#065f46' },
    warning: { bg: 'var(--warning-bg, #fffbeb)', border: '#fde68a', text: '#92400e' },
    danger: { bg: 'var(--danger-bg, #fef2f2)', border: '#fecaca', text: '#991b1b' },
  };

  const current = stylesMap[type] || stylesMap.info;

  return (
    <div
      style={{
        padding: '14px 16px',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        borderRadius: 'var(--radius-md, 8px)',
        color: current.text,
        marginBottom: '16px',
        fontSize: '0.875rem',
      }}
      className={`alert alert-${type} ${className}`}
    >
      {title && <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>}
      <div>{children}</div>
    </div>
  );
}
