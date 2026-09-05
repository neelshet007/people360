import React from 'react';
import Badge from '../../../components/ui/Badge';

/**
 * Status Badge for Employee Attendance — Phase 5
 * Owner: P2 (HR Operations)
 * Supports: PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, OVERTIME, MISSING_CHECKOUT
 */
export default function AttendanceStatusBadge({ status = 'PRESENT' }) {
  const normalized = (status || 'PRESENT').toUpperCase();

  const variantMap = {
    PRESENT: 'success',
    ABSENT: 'danger',
    LATE: 'warning',
    HALF_DAY: 'info',
    ON_LEAVE: 'neutral',
    OVERTIME: 'primary',
    MISSING_CHECKOUT: 'warning',
  };

  const labelMap = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    HALF_DAY: 'Half Day',
    ON_LEAVE: 'On Leave',
    OVERTIME: 'Overtime',
    MISSING_CHECKOUT: 'Missing Checkout',
  };

  return (
    <Badge variant={variantMap[normalized] || 'neutral'} dot>
      {labelMap[normalized] || normalized}
    </Badge>
  );
}
