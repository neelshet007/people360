import React from 'react';
import Badge from '../../../components/ui/Badge';

/**
 * Status Badge for Payruns & Payslips
 * Owner: P3 (Payroll)
 */
export default function PayrunStatusBadge({ status = 'DRAFT' }) {
  const normalized = (status || 'DRAFT').toUpperCase();

  const variantMap = {
    DRAFT: 'neutral',
    COMPUTING: 'info',
    CONFIRMED: 'primary',
    PAID: 'success',
  };

  const labelMap = {
    DRAFT: 'Draft',
    COMPUTING: 'Computing',
    CONFIRMED: 'Confirmed',
    PAID: 'Paid',
  };

  return (
    <Badge variant={variantMap[normalized] || 'neutral'} dot>
      {labelMap[normalized] || normalized}
    </Badge>
  );
}
