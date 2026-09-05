import React from 'react';
import Badge from '../../../components/ui/Badge';

/**
 * Status Badge for Employment Contracts
 * Owner: P1 (Core HR)
 */
export default function ContractStatusBadge({ status = 'ACTIVE' }) {
  const normalized = (status || 'ACTIVE').toUpperCase();

  const variantMap = {
    ACTIVE: 'success',
    DRAFT: 'info',
    EXPIRED: 'warning',
    TERMINATED: 'danger',
  };

  const labelMap = {
    ACTIVE: 'Active',
    DRAFT: 'Draft',
    EXPIRED: 'Expired',
    TERMINATED: 'Terminated',
  };

  return (
    <Badge variant={variantMap[normalized] || 'neutral'} dot>
      {labelMap[normalized] || normalized}
    </Badge>
  );
}
