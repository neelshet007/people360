import React from 'react';

/**
 * Shared Loading / Spinner Component
 * Owner: P1 (Core HR)
 */
export default function Loading({ message = 'Loading...', size = 'md' }) {
  const sizeMap = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  const dim = sizeMap[size] || 32;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          border: '3px solid var(--neutral-200, #e2e8f0)',
          borderTop: '3px solid var(--primary-600, #4338ca)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {message && (
        <span style={{ fontSize: '0.875rem', color: 'var(--neutral-500, #64748b)' }}>
          {message}
        </span>
      )}
    </div>
  );
}
