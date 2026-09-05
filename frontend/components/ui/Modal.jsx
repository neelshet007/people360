import React, { useEffect } from 'react';
import { XIcon } from './Icons';

/**
 * Enterprise Modal Component
 * Features keyboard Esc dismiss, backdrop click dismiss, clean header/footer, and vector close icon
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  actions = null,
  size = 'md', // sm, md, lg, xl
  className = '',
}) {
  const modalFooter = footer || actions;

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
    xl: '900px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 8px)',
          width: '100%',
          maxWidth: maxWidthMap[size] || maxWidthMap.md,
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          border: '1px solid var(--border-subtle, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
        className={`modal-dialog ${className}`}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            backgroundColor: '#ffffff',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main, #0f172a)', margin: 0, letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm, 4px)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)';
              e.currentTarget.style.color = 'var(--text-main, #0f172a)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted, #64748b)';
            }}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {modalFooter && (
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--neutral-50, #f8fafc)',
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            {modalFooter}
          </div>
        )}
      </div>
    </div>
  );
}
