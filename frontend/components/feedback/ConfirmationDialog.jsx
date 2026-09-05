import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Shared ConfirmationDialog Component
 * Owner: P1 (Core HR)
 */
export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger', // danger, primary
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ color: 'var(--neutral-700, #334155)', fontSize: '0.875rem', lineHeight: 1.6 }}>
        {message}
      </div>
    </Modal>
  );
}
