import React from 'react';

/**
 * Shared PageContainer Component
 * Owner: P1 (Core HR)
 */
export default function PageContainer({
  title,
  subtitle,
  breadcrumbs = null,
  actions = null,
  children,
  className = '',
  style = {},
}) {
  return (
    <div
      style={{
        padding: '24px 20px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        ...style,
      }}
      className={`page-container ${className}`}
    >
      {breadcrumbs && (
        <div style={{ marginBottom: '12px', fontSize: '0.8125rem', color: 'var(--neutral-500, #64748b)' }}>
          {breadcrumbs}
        </div>
      )}

      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            {title && (
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--neutral-900, #0f172a)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-500, #64748b)',
                  marginTop: '4px',
                  marginBottom: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
