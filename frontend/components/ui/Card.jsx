import React from 'react';

/**
 * Enterprise Card Component
 * Structured container with header, subtitle, actions slot, and clean border delineation
 */
export default function Card({
  title,
  subtitle,
  children,
  actions,
  footer,
  interactive = false,
  className = '',
  style = {},
  headerStyle = {},
  bodyStyle = {},
}) {
  const hasHeader = title || subtitle || actions;

  return (
    <div
      style={style}
      className={`pp-card ${interactive ? 'pp-card-interactive' : ''} ${className}`}
    >
      {hasHeader && (
        <div className="pp-card-header" style={headerStyle}>
          <div>
            {title && (
              <h3
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--text-main, #0f172a)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted, #64748b)',
                  marginTop: '3px',
                  marginBottom: 0,
                  lineHeight: 1.35,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
        </div>
      )}
      <div className="pp-card-body" style={bodyStyle}>{children}</div>
      {footer && <div className="pp-card-footer">{footer}</div>}
    </div>
  );
}
