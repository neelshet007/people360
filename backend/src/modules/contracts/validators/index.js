/**
 * Contracts Input Validators
 * Owner: P1 (Core HR)
 */

const normalizeContractType = (type) => {
  if (!type) return 'PERMANENT';
  const clean = String(type).trim().toUpperCase().replace(/[-\s]+/g, '_');
  if (clean.includes('PERMANENT') || clean === 'FULL_TIME') return 'PERMANENT';
  if (clean.includes('FIXED') || clean === 'FIXED_TERM') return 'FIXED_TERM';
  if (clean.includes('PROBATION')) return 'PROBATION';
  if (clean.includes('INTERN')) return 'INTERNSHIP';
  if (clean.includes('CONTRACTOR') || clean === 'PART_TIME') return 'CONTRACTOR';
  return clean;
};

const normalizeWageType = (type) => {
  if (!type) return 'MONTHLY';
  const clean = String(type).trim().toUpperCase();
  if (clean === 'MONTHLY' || clean === 'MONTH') return 'MONTHLY';
  if (clean === 'HOURLY' || clean === 'HOUR') return 'HOURLY';
  if (clean === 'WEEKLY' || clean === 'WEEK') return 'WEEKLY';
  if (clean === 'ANNUAL' || clean === 'YEAR' || clean === 'YEARLY') return 'ANNUAL';
  return clean;
};

const normalizeStatus = (status) => {
  if (!status) return 'ACTIVE';
  const clean = String(status).trim().toUpperCase();
  if (['ACTIVE', 'DRAFT', 'EXPIRED', 'TERMINATED'].includes(clean)) return clean;
  return 'ACTIVE';
};

const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

const validateContractData = (data) => {
  const errors = [];

  if (!data.employee_id) {
    errors.push('Employee ID is required');
  }

  const wageRate = parseFloat(data.wage_rate);
  if (isNaN(wageRate) || wageRate <= 0) {
    errors.push('Wage rate must be a positive number');
  }

  if (!data.start_date || !isValidDate(data.start_date)) {
    errors.push('A valid start date (YYYY-MM-DD) is required');
  }

  if (data.end_date) {
    if (!isValidDate(data.end_date)) {
      errors.push('End date must be a valid date (YYYY-MM-DD)');
    } else if (new Date(data.end_date) < new Date(data.start_date)) {
      errors.push(`End date (${data.end_date}) cannot be earlier than start date (${data.start_date})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  normalizeContractType,
  normalizeWageType,
  normalizeStatus,
  validateContractData,
};
