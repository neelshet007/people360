const contractRepository = require('../repositories/contractRepository');
const employeeRepository = require('../../employees/repositories/employeeRepository');
const scheduleRepository = require('../../schedules/repositories/scheduleRepository');
const {
  normalizeContractType,
  normalizeWageType,
  normalizeStatus,
  validateContractData,
} = require('../validators');

/**
 * Contracts Service Layer
 * Owner: P1 (Core HR)
 * Enforces business rules, historical records, and period-specific contract resolution
 */

const contractService = {
  getContracts: async ({
    page = 1,
    limit = 20,
    employee_id,
    status,
    contract_type,
    date,
    period_start,
    period_end,
    search,
  } = {}) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const normalizedStatus = status ? normalizeStatus(status) : undefined;
    const normalizedType = contract_type ? normalizeContractType(contract_type) : undefined;

    const contracts = await contractRepository.findContracts({
      page: pageNum,
      limit: limitNum,
      employee_id,
      status: normalizedStatus,
      contract_type: normalizedType,
      date,
      period_start,
      period_end,
      search,
    });

    const total = await contractRepository.countContracts({
      employee_id,
      status: normalizedStatus,
      contract_type: normalizedType,
      date,
      period_start,
      period_end,
      search,
    });

    return {
      contracts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  getContractById: async (id) => {
    const contract = await contractRepository.findContractById(id);
    if (!contract) {
      const err = new Error(`Contract with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }
    return contract;
  },

  getActiveContractForDate: async (employeeId, date) => {
    if (!employeeId) {
      const err = new Error('Employee ID is required for active contract lookup');
      err.statusCode = 400;
      throw err;
    }
    const targetDate = date || new Date().toISOString().split('T')[0];

    const contract = await contractRepository.findActiveContractForDate(employeeId, targetDate);
    if (!contract) {
      const err = new Error(`No active contract found for employee ${employeeId} applicable on ${targetDate}`);
      err.statusCode = 404;
      throw err;
    }
    return contract;
  },

  getActiveContractForPeriod: async (employeeId, periodStart, periodEnd) => {
    if (!employeeId) {
      const err = new Error('Employee ID is required for period contract lookup');
      err.statusCode = 400;
      throw err;
    }
    if (!periodStart || !periodEnd) {
      const err = new Error('Both period_start and period_end dates are required');
      err.statusCode = 400;
      throw err;
    }

    const contract = await contractRepository.findActiveContractForPeriod(employeeId, periodStart, periodEnd);
    if (!contract) {
      const err = new Error(`No active contract found for employee ${employeeId} applicable for period ${periodStart} to ${periodEnd}`);
      err.statusCode = 404;
      throw err;
    }
    return contract;
  },

  createContract: async (data) => {
    const validation = validateContractData(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(', '));
      err.statusCode = 400;
      throw err;
    }

    // Verify employee exists in authoritative employee table
    const employee = await employeeRepository.findById(data.employee_id);
    if (!employee) {
      const err = new Error(`Cannot create contract: Employee with ID ${data.employee_id} does not exist`);
      err.statusCode = 400;
      throw err;
    }

    // Verify working schedule if specified
    if (data.working_schedule_id) {
      const schedule = await scheduleRepository.findScheduleById(data.working_schedule_id);
      if (!schedule) {
        // Fallback: don't block if valid UUID format, but log warning
        console.warn(`[ContractService] Working schedule ${data.working_schedule_id} not found`);
      }
    }

    const status = normalizeStatus(data.status);

    // Enforce NO OVERLAPPING ACTIVE CONTRACTS for the same employee
    if (status === 'ACTIVE') {
      const overlaps = await contractRepository.checkOverlap(
        data.employee_id,
        data.start_date,
        data.end_date
      );

      if (overlaps.length > 0) {
        const overlap = overlaps[0];
        const overlapEnd = overlap.end_date ? overlap.end_date : 'Indefinite';
        const err = new Error(
          `Contract date range (${data.start_date} to ${data.end_date || 'Indefinite'}) overlaps with existing active contract [${overlap.id}] from ${overlap.start_date} to ${overlapEnd}`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const payload = {
      employee_id: data.employee_id,
      contract_type: normalizeContractType(data.contract_type),
      wage_rate: parseFloat(data.wage_rate),
      wage_type: normalizeWageType(data.wage_type),
      start_date: data.start_date,
      end_date: data.end_date || null,
      working_schedule_id: data.working_schedule_id || null,
      salary_structure_id: data.salary_structure_id || null,
      status,
      notes: data.notes || null,
    };

    return contractRepository.createContract(payload);
  },

  updateContract: async (id, data) => {
    const existing = await contractRepository.findContractById(id);
    if (!existing) {
      const err = new Error(`Contract with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const merged = { ...existing, ...data };
    const validation = validateContractData(merged);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(', '));
      err.statusCode = 400;
      throw err;
    }

    const newStatus = data.status ? normalizeStatus(data.status) : existing.status;
    const newStart = data.start_date || existing.start_date;
    const newEnd = data.end_date !== undefined ? data.end_date : existing.end_date;

    // Check overlap if status is ACTIVE
    if (newStatus === 'ACTIVE') {
      const overlaps = await contractRepository.checkOverlap(
        existing.employee_id,
        newStart,
        newEnd,
        id
      );

      if (overlaps.length > 0) {
        const overlap = overlaps[0];
        const overlapEnd = overlap.end_date ? overlap.end_date : 'Indefinite';
        const err = new Error(
          `Updated contract date range (${newStart} to ${newEnd || 'Indefinite'}) overlaps with existing active contract [${overlap.id}] from ${overlap.start_date} to ${overlapEnd}`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const payload = { ...data };
    if (data.contract_type) payload.contract_type = normalizeContractType(data.contract_type);
    if (data.wage_type) payload.wage_type = normalizeWageType(data.wage_type);
    if (data.status) payload.status = newStatus;
    if (data.wage_rate !== undefined) payload.wage_rate = parseFloat(data.wage_rate);

    return contractRepository.updateContract(id, payload);
  },

  deleteContract: async (id) => {
    const existing = await contractRepository.findContractById(id);
    if (!existing) {
      const err = new Error(`Contract with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    return contractRepository.deleteContract(id);
  },
};

module.exports = contractService;
