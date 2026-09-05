import React from 'react';

/**
 * Shared Card Component
 * Owner: P1 (Core HR)
 */
export default function Card({ title, subtitle, children, actions, className = '', style = {} }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--neutral-200, #e2e8f0)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px',
        ...style,
      }}
      className={`card ${className}`}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)', marginTop: '4px' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
