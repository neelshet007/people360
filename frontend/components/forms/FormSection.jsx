import React from 'react';

/**
 * Shared FormSection Component
 * Owner: P1 (Core HR)
 */
export default function FormSection({
  title,
  description,
  children,
  columns = 2, // 1, 2, 3
  className = '',
  style = {},
}) {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--neutral-200, #e2e8f0)',
        boxShadow: 'var(--shadow-xs)',
        marginBottom: '24px',
        ...style,
      }}
      className={`form-section ${className}`}
    >
      {(title || description) && (
        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--neutral-100, #f1f5f9)', paddingBottom: '12px' }}>
          {title && (
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
              {title}
            </h4>
          )}
          {description && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px', margin: 0 }}>
              {description}
            </p>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns === 1 ? '1fr' : columns === 3 ? 'repeat(auto-fit, minmax(240px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
