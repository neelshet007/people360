import React from 'react';
import Badge from '../../../components/ui/Badge';

/**
 * Status Badge for Employee Attendance
 * Owner: P2 (HR Operations)
 */
export default function AttendanceStatusBadge({ status = 'PRESENT' }) {
  const normalized = (status || 'PRESENT').toUpperCase();

  const variantMap = {
    PRESENT: 'success',
    ABSENT: 'danger',
    LATE: 'warning',
    HALF_DAY: 'info',
    ON_LEAVE: 'neutral',
  };

  const labelMap = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    HALF_DAY: 'Half Day',
    ON_LEAVE: 'On Leave',
  };

  return (
    <Badge variant={variantMap[normalized] || 'neutral'} dot>
      {labelMap[normalized] || normalized}
    </Badge>
  );
}
