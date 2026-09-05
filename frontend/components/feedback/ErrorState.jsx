import React from 'react';
import Button from '../ui/Button';

/**
 * Shared ErrorState Component
 * Owner: P1 (Core HR)
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this information. Please try again.',
  onRetry,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--danger-bg, #fef2f2)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid #fecaca',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          fontSize: '1.5rem',
          marginBottom: '12px',
          color: 'var(--danger, #ef4444)',
        }}
      >
        ⚠️
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--danger, #ef4444)', margin: 0 }}>
        {title}
      </h4>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--neutral-600, #475569)',
          marginTop: '6px',
          maxWidth: '420px',
        }}
      >
        {message}
      </p>
      {onRetry && (
        <div style={{ marginTop: '16px' }}>
          <Button variant="danger" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
