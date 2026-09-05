import React from 'react';
import Button from './Button';

/**
 * Shared Pagination Component
 * Owner: P1 (Core HR)
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
  style = {},
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--neutral-200, #e2e8f0)',
        fontSize: '0.875rem',
        color: 'var(--neutral-600, #475569)',
        flexWrap: 'wrap',
        gap: '12px',
        ...style,
      }}
      className={`pagination-container ${className}`}
    >
      <div>
        Showing <span style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>{startItem}</span> to{' '}
        <span style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>{endItem}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--neutral-900, #0f172a)' }}>{totalItems}</span> results
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
        >
          Previous
        </Button>

        <span style={{ padding: '0 8px', fontSize: '0.875rem', fontWeight: 500 }}>
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
