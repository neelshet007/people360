import React from 'react';

/**
 * Shared EmptyState Component
 * Owner: P1 (Core HR)
 */
export default function EmptyState({
  title = 'No records available',
  description = 'There are currently no items to display in this view.',
  action,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px dashed var(--neutral-300, #cbd5e1)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--neutral-100, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: 'var(--neutral-400, #94a3b8)',
          fontSize: '1.25rem',
        }}
      >
        📂
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-800, #1e293b)', margin: 0 }}>
        {title}
      </h4>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--neutral-500, #64748b)',
          marginTop: '6px',
          maxWidth: '400px',
        }}
      >
        {description}
      </p>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}
