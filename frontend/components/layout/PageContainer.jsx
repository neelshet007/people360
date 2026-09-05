import React from 'react';

/**
 * Enterprise PageContainer Component
 * Establishes consistent margin rhythm, executive header, and contextual action cluster
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
        padding: '24px 28px',
        maxWidth: '1360px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
      className={`page-container ${className}`}
    >
      {breadcrumbs && (
        <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
          {breadcrumbs}
        </div>
      )}

      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            {title && (
              <h1
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: 'var(--text-main, #0f172a)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted, #64748b)',
                  marginTop: '4px',
                  marginBottom: 0,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {actions}
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
