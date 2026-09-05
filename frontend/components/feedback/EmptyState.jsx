import React from 'react';
import { FileTextIcon } from '../ui/Icons';

/**
 * Enterprise EmptyState Component
 * Contextual zero-data illustration with title, explanation, and clear call-to-action
 */
export default function EmptyState({
  title = 'No records available',
  description = 'There are currently no items to display in this view.',
  icon = null,
  action = null,
  className = '',
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '44px 24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px dashed var(--border-default, #cbd5e1)',
        margin: '16px 0',
        ...style,
      }}
      className={`pp-empty-state ${className}`}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '8px',
          backgroundColor: 'var(--neutral-100, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          color: 'var(--text-muted, #64748b)',
        }}
      >
        {icon || <FileTextIcon size={22} />}
      </div>
      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', margin: 0 }}>
        {title}
      </h4>
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text-muted, #64748b)',
          marginTop: '6px',
          maxWidth: '420px',
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}
