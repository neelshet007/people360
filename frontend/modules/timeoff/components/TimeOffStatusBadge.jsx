import React from 'react';
import Badge from '../../../components/ui/Badge';

/**
 * Status Badge for Time Off Requests
 * Owner: P2 (HR Operations)
 */
export default function TimeOffStatusBadge({ status = 'PENDING' }) {
  const normalized = (status || 'PENDING').toUpperCase();

  const variantMap = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'neutral',
  };

  const labelMap = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
  };

  return (
    <Badge variant={variantMap[normalized] || 'neutral'} dot>
      {labelMap[normalized] || normalized}
    </Badge>
  );
}
