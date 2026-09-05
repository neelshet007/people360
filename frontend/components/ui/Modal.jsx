import React, { useEffect } from 'react';

/**
 * Shared Modal Component
 * Owner: P1 (Core HR)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md', // sm, md, lg
  className = '',
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: '420px',
    md: '540px',
    lg: '760px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 12px)',
          width: '100%',
          maxWidth: maxWidthMap[size] || maxWidthMap.md,
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        className={`modal-dialog ${className}`}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--neutral-200, #e2e8f0)',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--neutral-900, #0f172a)', margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--neutral-400, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--neutral-800, #1e293b)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--neutral-400, #94a3b8)')}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderTop: '1px solid var(--neutral-200, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
