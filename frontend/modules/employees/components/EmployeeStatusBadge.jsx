import React from 'react';
import Badge from '../../../components/ui/Badge';

/**
 * Status Badge for Employee
 * Owner: P1 (Core HR)
 */
export default function EmployeeStatusBadge({ status = 'ACTIVE' }) {
  const normalized = (status || 'ACTIVE').toUpperCase();

  const variantMap = {
    ACTIVE: 'success',
    ON_LEAVE: 'warning',
    INACTIVE: 'neutral',
    TERMINATED: 'danger',
  };

  const labelMap = {
    ACTIVE: 'Active',
    ON_LEAVE: 'On Leave',
    INACTIVE: 'Inactive',
    TERMINATED: 'Terminated',
  };

  return (
    <Badge variant={variantMap[normalized] || 'neutral'} dot>
      {labelMap[normalized] || normalized}
    </Badge>
  );
}
