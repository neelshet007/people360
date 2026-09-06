const compOffRepository = require('../repositories/compOffRepository');
const timeoffRepository = require('../repositories/timeoffRepository');
const employeeRepository = require('../../employees/repositories/employeeRepository');
const ApiError = require('../../../utils/ApiError');

/**
 * Comp Off Service
 * Owner: P2 (HR Operations) — ExFeat
 *
 * Lifecycle:
 *   Employee raises credit claim (PENDING) →
 *   HR approves (APPROVED, balance increases) →
 *   Employee redeems via normal time_off_request with COMP_OFF type →
 *   Redemption approval marks credit(s) as USED
 */
class CompOffService {
  /**
   * Raise a new comp-off credit claim
   * Called by employees (worked on holiday/weekend) or HR on their behalf
   */
  async raiseCreditClaim(data, requesterId, requesterRole) {
    const { employee_id, work_date, hours_worked = 8, reason, days_credited = 1 } = data;

    if (!employee_id || !work_date) {
      throw ApiError.badRequest('employee_id and work_date are required');
    }

    // Employees can only raise for themselves
    if (requesterRole === 'EMPLOYEE' && requesterId && employee_id !== requesterId) {
      throw ApiError.forbidden('Employees can only raise comp-off claims for themselves');
    }

    const daysNum = parseFloat(days_credited);
    if (isNaN(daysNum) || daysNum <= 0 || daysNum > 3) {
      throw ApiError.badRequest('days_credited must be between 0.1 and 3');
    }

    // Verify employee exists
    const employee = await employeeRepository.findById(employee_id);
    if (!employee) {
      throw ApiError.notFound(`Employee with ID '${employee_id}' not found`);
    }

    const credit = await compOffRepository.createCredit({
      employee_id,
      work_date,
      hours_worked: parseFloat(hours_worked || 8),
      reason,
      days_credited: daysNum,
    });

    return credit;
  }

  /**
   * List comp-off credits (HR sees all, Employee sees own)
   */
  async listCredits(query = {}, requesterRole, requesterEmployeeId) {
    const filters = { ...query };
    if (requesterRole === 'EMPLOYEE' && requesterEmployeeId) {
      filters.employee_id = requesterEmployeeId;
    }
    return compOffRepository.findCredits(filters);
  }

  /**
   * Get a single credit
   */
  async getCreditById(id) {
    const credit = await compOffRepository.findCreditById(id);
    if (!credit) {
      throw ApiError.notFound(`Comp-off credit with ID '${id}' not found`);
    }
    return credit;
  }

  /**
   * HR approves a PENDING credit claim
   */
  async approveCredit(id, approverId) {
    const credit = await compOffRepository.findCreditById(id);
    if (!credit) {
      throw ApiError.notFound(`Comp-off credit with ID '${id}' not found`);
    }
    if (credit.status !== 'PENDING') {
      throw ApiError.badRequest(`Cannot approve comp-off credit in '${credit.status}' status`);
    }
    return compOffRepository.updateCredit(id, {
      status: 'APPROVED',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    });
  }

  /**
   * HR rejects a PENDING credit claim
   */
  async rejectCredit(id, approverId) {
    const credit = await compOffRepository.findCreditById(id);
    if (!credit) {
      throw ApiError.notFound(`Comp-off credit with ID '${id}' not found`);
    }
    if (credit.status !== 'PENDING') {
      throw ApiError.badRequest(`Cannot reject comp-off credit in '${credit.status}' status`);
    }
    return compOffRepository.updateCredit(id, {
      status: 'REJECTED',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    });
  }

  /**
   * Get available comp-off balance for an employee
   */
  async getBalance(employeeId) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw ApiError.notFound(`Employee with ID '${employeeId}' not found`);
    }
    const balance = await compOffRepository.getAvailableBalance(employeeId);
    return {
      employee_id: employeeId,
      employee_code: employee.employee_code,
      employee_name: employee.display_name || `${employee.first_name} ${employee.last_name}`,
      ...balance,
    };
  }

  /**
   * Get the COMP_OFF time_off_type_id for use in time_off_request creation
   */
  async getCompOffTypeId() {
    const types = await timeoffRepository.findTypes();
    const compOffType = types.find(t => t.code === 'COMP_OFF');
    return compOffType?.id || null;
  }
}

module.exports = new CompOffService();
