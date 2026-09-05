import React from 'react';
import Button from '../ui/Button';

/**
 * Shared FormActions Component
 * Owner: P1 (Core HR)
 */
export default function FormActions({
  onSubmit,
  onCancel,
  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  align = 'right', // left, right, between
  className = '',
  style = {},
}) {
  const justifyMap = {
    left: 'flex-start',
    right: 'flex-end',
    between: 'space-between',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: justifyMap[align] || 'flex-end',
        gap: '12px',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid var(--neutral-200, #e2e8f0)',
        ...style,
      }}
      className={`form-actions ${className}`}
    >
      {onCancel && (
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
      )}

      <Button
        type={onSubmit ? 'button' : 'submit'}
        variant="primary"
        onClick={onSubmit}
        loading={loading}
        disabled={disabled || loading}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
