import React from 'react';

/**
 * Shared PageContainer Component
 * Owner: P1 (Core HR)
 */
export default function PageContainer({ title, subtitle, actions, children }) {
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            {title && (
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
                {title}
              </h1>
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
