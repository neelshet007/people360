/**
 * Employee Validator Layer
 * Owner: P1 (Core HR)
 */

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateEmployeeInput(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.first_name !== undefined) {
    if (!data.first_name || typeof data.first_name !== 'string' || !data.first_name.trim()) {
      errors.push('first_name is required');
    }
  }

  if (!isUpdate || data.last_name !== undefined) {
    if (!data.last_name || typeof data.last_name !== 'string' || !data.last_name.trim()) {
      errors.push('last_name is required');
    }
  }

  if (!isUpdate || data.employee_code !== undefined) {
    if (!data.employee_code || typeof data.employee_code !== 'string' || !data.employee_code.trim()) {
      errors.push('employee_code is required');
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
      errors.push('email is required');
    } else if (!emailRegex.test(data.email.trim())) {
      errors.push('email must be a valid email address');
    }
  }

  if (!isUpdate || data.department !== undefined) {
    if (!data.department || typeof data.department !== 'string' || !data.department.trim()) {
      errors.push('department is required');
    }
  }

  if (!isUpdate || data.designation !== undefined) {
    if (!data.designation || typeof data.designation !== 'string' || !data.designation.trim()) {
      errors.push('designation is required');
    }
  }

  if (data.status !== undefined) {
    if (!VALID_STATUSES.includes(data.status.toUpperCase())) {
      errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  }

  if (data.date_of_joining) {
    const d = new Date(data.date_of_joining);
    if (isNaN(d.getTime())) {
      errors.push('date_of_joining must be a valid date format');
    }
  }

  if (data.date_of_birth) {
    const d = new Date(data.date_of_birth);
    if (isNaN(d.getTime())) {
      errors.push('date_of_birth must be a valid date format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidUUID(id) {
  return typeof id === 'string' && uuidRegex.test(id);
}

module.exports = {
  validateEmployeeInput,
  isValidUUID,
  VALID_STATUSES,
};
