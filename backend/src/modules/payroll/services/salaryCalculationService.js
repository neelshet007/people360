const db = require('../../../database/db');
const { evaluateFormula, FormulaEvaluationError } = require('./formulaEvaluator');
const contractRepository = require('../../contracts/repositories/contractRepository');
const employeeRepository = require('../../employees/repositories/employeeRepository');
const payrollRepository = require('../repositories/payrollRepository');
const ApiError = require('../../../utils/ApiError');

/**
 * Centralized Salary Calculation Service
 * Owner: P3 (Payroll)
 * 
 * Executes the authoritative pipeline:
 * Employee -> Period Contract -> Salary Structure -> Ordered Rules -> Calculation Engine -> Gross -> Deductions -> Net (INR)
 */
class SalaryCalculationService {
  /**
   * Calculate salary for an employee in a given period or with custom inputs
   */
  async calculateSalary({
    employeeId,
    contractId,
    salaryStructureId,
    payrollPeriod = {},
    attendanceInputs = null,
    leaveInputs = null,
    applyProration = false,
  }) {
    if (!employeeId) {
      throw ApiError.badRequest('Employee ID is required for salary calculation');
    }

    // 1. Resolve Employee from authoritative table
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw ApiError.notFound(`Employee with ID '${employeeId}' does not exist`);
    }

    // 2. Resolve Payroll Period (Default to current month if unspecified)
    const now = new Date();
    const periodStart = payrollPeriod.start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = payrollPeriod.end || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // 3. Resolve Period-Specific Active Contract (P1 Integration)
    let contract = null;
    if (contractId) {
      contract = await contractRepository.findContractById(contractId);
    } else {
      // Find active contract valid for this exact period
      contract = await contractRepository.findActiveContractForPeriod(employeeId, periodStart, periodEnd);
      if (!contract) {
        // Fallback: active contract for period end date
        contract = await contractRepository.findActiveContractForDate(employeeId, periodEnd);
      }
    }

    if (!contract) {
      throw ApiError.badRequest(
        `Cannot calculate salary: No active employment contract found for employee ${employee.employee_code || employeeId} applicable for period ${periodStart} to ${periodEnd}`
      );
    }

    // 4. Resolve Assigned Salary Structure
    const targetStructureId = salaryStructureId || contract.salary_structure_id;
    let structure = null;

    if (targetStructureId) {
      structure = await payrollRepository.findStructureById(targetStructureId);
    }

    if (!structure) {
      // Fallback: search for active corporate standard structure
      const activeStructures = await payrollRepository.findStructures({ is_active: true });
      structure = activeStructures.find((s) => s.code === 'IN-CORP-STD') || activeStructures[0] || null;
    }

    if (!structure) {
      throw ApiError.badRequest(
        'Cannot calculate salary: No active salary structure found or assigned to this employee/contract'
      );
    }

    if (!structure.is_active) {
      throw ApiError.badRequest(`Assigned salary structure '${structure.name}' is currently inactive`);
    }

    // 5. Retrieve associated Salary Rules and sort by sequence_order ASC
    let rules = await payrollRepository.findRules({ salary_structure_id: structure.id });
    // Filter active rules
    rules = rules.filter((r) => r.is_active !== false);

    if (!rules || rules.length === 0) {
      throw ApiError.badRequest(
        `Salary structure '${structure.name}' (${structure.code}) contains no active calculation rules`
      );
    }

    // Explicitly sort rules in ascending sequence order
    rules.sort((a, b) => (parseInt(a.sequence_order, 10) || 0) - (parseInt(b.sequence_order, 10) || 0));

    // 6. Integrate Attendance & Leave Inputs (P2 Integration)
    const standardWorkingDays = 22.0; // Standard monthly working days in India
    let workedDays = standardWorkingDays;
    let absentDays = 0.0;
    let paidLeaveDays = 0.0;
    let unpaidLeaveDays = 0.0;

    if (attendanceInputs) {
      workedDays = parseFloat(attendanceInputs.workedDays || standardWorkingDays);
      absentDays = parseFloat(attendanceInputs.absentDays || 0.0);
    } else {
      // Query PostgreSQL attendance records for this period
      try {
        const attRes = await db.query(
          `SELECT 
             COUNT(*) FILTER (WHERE status = 'PRESENT') as present_cnt,
             COUNT(*) FILTER (WHERE status = 'LATE') as late_cnt,
             COUNT(*) FILTER (WHERE status = 'HALF_DAY') as half_cnt,
             COUNT(*) FILTER (WHERE status = 'ABSENT') as absent_cnt
           FROM attendance 
           WHERE employee_id = $1 AND date >= $2 AND date <= $3`,
          [employeeId, periodStart, periodEnd]
        );
        const attCounts = attRes.rows[0];
        const recordedDays = 
          parseInt(attCounts.present_cnt || 0, 10) +
          parseInt(attCounts.late_cnt || 0, 10) +
          parseInt(attCounts.half_cnt || 0, 10) * 0.5;

        if (recordedDays > 0) {
          workedDays = recordedDays;
          absentDays = parseInt(attCounts.absent_cnt || 0, 10);
        }
      } catch (err) {
        // Attendance query fallback
      }
    }

    // 7. Initialize Calculation Context & Accumulators
    const accumulator = {
      WAGE_RATE: parseFloat(contract.wage_rate || 0),
      STANDARD_DAYS: standardWorkingDays,
      WORKED_DAYS: workedDays,
      ABSENT_DAYS: absentDays,
    };

    const evaluatedComponents = [];
    let grossAmount = 0.0;
    let totalDeductions = 0.0;
    let netAmount = 0.0;

    // 8. Execute Ordered Rule Pipeline
    for (const rule of rules) {
      const code = (rule.code || '').toUpperCase().trim();
      const calcType = (rule.calculation_type || 'FIXED').toUpperCase();
      const category = (rule.category || 'ALLOWANCE').toUpperCase();
      const ruleRate = parseFloat(rule.amount_or_rate || 0);

      let componentAmount = 0.0;

      if (calcType === 'FIXED') {
        if (category === 'BASIC') {
          // If contract has wage rate and rule rate is 0, use contract wage rate; otherwise use rule rate
          componentAmount = ruleRate > 0 ? ruleRate : accumulator.WAGE_RATE;
          if (applyProration && standardWorkingDays > 0 && workedDays < standardWorkingDays) {
            componentAmount = (componentAmount / standardWorkingDays) * workedDays;
          }
        } else {
          componentAmount = ruleRate;
        }
      } else if (calcType === 'PERCENTAGE') {
        const baseKey = (rule.percentage_base || 'BASIC').toUpperCase();
        const baseValue = accumulator[baseKey] !== undefined ? accumulator[baseKey] : (accumulator.BASIC || accumulator.WAGE_RATE || 0);

        if (accumulator[baseKey] === undefined && !['BASIC', 'WAGE_RATE', 'GROSS'].includes(baseKey)) {
          throw ApiError.badRequest(
            `Rule '${rule.name}' (${code}) references unevaluated base component '${baseKey}'. Check rule sequence order.`
          );
        }

        const percentageMultiplier = ruleRate > 1 ? ruleRate / 100 : ruleRate;
        componentAmount = baseValue * percentageMultiplier;
      } else if (calcType === 'FORMULA') {
        if (!rule.formula) {
          throw ApiError.badRequest(`Rule '${rule.name}' (${code}) calculation_type is FORMULA but formula is empty`);
        }
        try {
          componentAmount = evaluateFormula(rule.formula, accumulator);
        } catch (err) {
          throw ApiError.badRequest(
            `Failed to evaluate formula for rule '${rule.name}' (${code}): ${err.message}`
          );
        }
      }

      // Round to 2 decimal places
      componentAmount = Math.round(componentAmount * 100) / 100;

      // Store in context accumulator for subsequent rules
      accumulator[code] = componentAmount;

      // Categorize line items
      evaluatedComponents.push({
        id: rule.id,
        rule_name: rule.name,
        rule_code: code,
        category,
        calculation_type: calcType,
        sequence_order: rule.sequence_order,
        rate: ruleRate,
        percentage_base: rule.percentage_base || null,
        formula: rule.formula || null,
        amount: componentAmount,
      });

      // Track totals based on category
      if (category === 'BASIC' || category === 'ALLOWANCE') {
        grossAmount += componentAmount;
      } else if (category === 'DEDUCTION' && code !== 'TOTAL_DEDUCTIONS') {
        totalDeductions += componentAmount;
      }
    }

    // Determine authoritative Gross, Total Deductions, and Net
    if (accumulator.GROSS !== undefined) {
      grossAmount = accumulator.GROSS;
    }

    if (accumulator.TOTAL_DEDUCTIONS !== undefined) {
      totalDeductions = accumulator.TOTAL_DEDUCTIONS;
    }

    if (accumulator.NET !== undefined) {
      netAmount = accumulator.NET;
    } else {
      netAmount = Math.round((grossAmount - totalDeductions) * 100) / 100;
    }

    return {
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        display_name: employee.display_name || `${employee.first_name} ${employee.last_name}`,
        department: employee.department,
        designation: employee.designation,
        email: employee.email,
      },
      contract: {
        id: contract.id,
        reference: contract.reference || `CNT-${contract.id.substring(0, 8).toUpperCase()}`,
        contract_type: contract.contract_type,
        wage_rate: parseFloat(contract.wage_rate || 0),
        wage_type: contract.wage_type,
        start_date: contract.start_date,
        end_date: contract.end_date,
        status: contract.status,
      },
      salaryStructure: {
        id: structure.id,
        name: structure.name,
        code: structure.code,
        description: structure.description,
      },
      period: {
        start: periodStart,
        end: periodEnd,
        standard_working_days: standardWorkingDays,
        worked_days: workedDays,
        absent_days: absentDays,
      },
      components: evaluatedComponents,
      gross: Math.round(grossAmount * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      net: Math.round(netAmount * 100) / 100,
      currency: 'INR',
      currency_symbol: '₹',
    };
  }
}

module.exports = new SalaryCalculationService();
