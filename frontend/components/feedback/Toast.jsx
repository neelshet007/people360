import React from 'react';

/**
 * Shared Toast Notification Component
 * Owner: P1 (Core HR)
 */
export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const bgColors = {
    info: 'var(--neutral-900, #0f172a)',
    success: 'var(--success, #10b981)',
    danger: 'var(--danger, #ef4444)',
    warning: 'var(--warning, #f59e0b)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: bgColors[type] || bgColors.info,
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1100,
        fontSize: '0.875rem',
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
