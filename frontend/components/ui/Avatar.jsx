import React from 'react';

/**
 * Shared Avatar Component
 * Owner: P1 (Core HR)
 */
export default function Avatar({
  name = '',
  src = null,
  size = 'md', // sm, md, lg, xl
  status = null, // online, offline, busy, away
  className = '',
  style = {},
}) {
  const getInitials = (text) => {
    if (!text) return '?';
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const sizeMap = {
    sm: { dimension: '28px', fontSize: '0.75rem' },
    md: { dimension: '36px', fontSize: '0.875rem' },
    lg: { dimension: '44px', fontSize: '1rem' },
    xl: { dimension: '56px', fontSize: '1.25rem' },
  };

  const statusColorMap = {
    online: 'var(--success, #10b981)',
    offline: 'var(--neutral-400, #94a3b8)',
    busy: 'var(--danger, #ef4444)',
    away: 'var(--warning, #f59e0b)',
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: currentSize.dimension,
        height: currentSize.dimension,
        borderRadius: 'var(--radius-full, 9999px)',
        backgroundColor: 'var(--primary-100, #e0e7ff)',
        color: 'var(--primary-700, #4338ca)',
        fontWeight: 600,
        fontSize: currentSize.fontSize,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      className={`avatar ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}

      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColorMap[status] || statusColorMap.offline,
            border: '2px solid #ffffff',
          }}
        />
      )}
    </div>
  );
}
