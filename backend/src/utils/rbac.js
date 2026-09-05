/**
 * Centralized Role-Based Access Control (RBAC) System
 * Defines authoritative product roles and atomic granular permissions
 * Owner: Shared Application Foundation
 */

const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],

  [ROLES.HR_MANAGER]: [
    'employees.read',
    'employees.write',
    'contracts.read',
    'contracts.write',
    'schedules.read',
    'schedules.write',
    'attendance.read',
    'attendance.write',
    'timeoff.read',
    'timeoff.write',
    'timeoff.approve',
    'salary.read',
    'reports.read',
  ],

  [ROLES.HR_PAYROLL_USER]: [
    'employees.read',
    'contracts.read',
    'schedules.read',
    'attendance.read',
    'timeoff.read',
    'salary.read',          // View only for structures/rules
    'payruns.read',
    'payruns.write',         // Can execute batches
    'payslips.read',
    'payslips.write',
    'reports.read',
  ],

  [ROLES.HR_PAYROLL_MANAGER]: [
    'employees.read',
    'employees.write',
    'contracts.read',
    'contracts.write',
    'schedules.read',
    'schedules.write',
    'attendance.read',
    'attendance.write',
    'timeoff.read',
    'timeoff.write',
    'timeoff.approve',
    'salary.read',
    'salary.manage',        // Full control over salary structures & rules
    'payruns.read',
    'payruns.write',
    'payslips.read',
    'payslips.write',
    'reports.read',
  ],

  [ROLES.EMPLOYEE]: [
    'self.profile',
    'self.attendance',
    'self.timeoff',
    'self.payslips',
    'attendance.checkin',
    'salary.read',
  ],
};

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(role, requiredPermission) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(requiredPermission);
}

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
};
