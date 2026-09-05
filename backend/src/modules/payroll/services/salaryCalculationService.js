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
    let structure = null;
    const cType = (contract.contract_type || '').toUpperCase();
    const wType = (contract.wage_type || '').toUpperCase();

    // Priority 1: Contract's explicitly assigned salary structure
    if (contract.salary_structure_id) {
      structure = await payrollRepository.findStructureById(contract.salary_structure_id);
    }

    // Priority 2: If passed salaryStructureId and contract is standard monthly
    if (!structure && salaryStructureId && !cType.includes('INTERN') && wType !== 'HOURLY' && wType !== 'WEEKLY') {
      structure = await payrollRepository.findStructureById(salaryStructureId);
    }

    // Priority 3: Dynamic resolution based on contract classification & wage type
    if (!structure) {
      const activeStructures = await payrollRepository.findStructures({ is_active: true });

      if (cType.includes('INTERN')) {
        structure = activeStructures.find((s) => s.code === 'IN-INTERN-FLEX');
      } else if (wType === 'HOURLY') {
        structure = activeStructures.find((s) => s.code === 'IN-HOURLY-FLEX');
      } else if (wType === 'WEEKLY') {
        structure = activeStructures.find((s) => s.code === 'IN-WEEKLY-CONTR');
      }

      if (!structure && salaryStructureId) {
        structure = await payrollRepository.findStructureById(salaryStructureId);
      }

      if (!structure) {
        structure = activeStructures.find((s) => s.code === 'IN-CORP-STD') || activeStructures[0] || null;
      }
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

    // Check employee schedule standard hours per day
    let scheduleHoursPerDay = 8.0;
    if (contract.working_schedule_id) {
      try {
        const schedRes = await db.query(
          'SELECT standard_hours_per_day FROM working_schedules WHERE id = $1',
          [contract.working_schedule_id]
        );
        if (schedRes.rows.length > 0 && schedRes.rows[0].standard_hours_per_day) {
          scheduleHoursPerDay = parseFloat(schedRes.rows[0].standard_hours_per_day);
        }
      } catch (e) {}
    }

    const standardWorkingHours = Math.round(standardWorkingDays * scheduleHoursPerDay * 10) / 10;
    const standardWeeks = 4.4;
    let workedHours = Math.round(workedDays * scheduleHoursPerDay * 10) / 10;

    if (attendanceInputs) {
      workedDays = parseFloat(attendanceInputs.workedDays || standardWorkingDays);
      absentDays = parseFloat(attendanceInputs.absentDays || 0.0);
      if (attendanceInputs.workedHours) {
        workedHours = parseFloat(attendanceInputs.workedHours);
      } else {
        workedHours = Math.round(workedDays * scheduleHoursPerDay * 10) / 10;
      }
    } else {
      // Query PostgreSQL attendance records for this period
      try {
        const attRes = await db.query(
          `SELECT 
             COUNT(*) FILTER (WHERE status = 'PRESENT') as present_cnt,
             COUNT(*) FILTER (WHERE status = 'LATE') as late_cnt,
             COUNT(*) FILTER (WHERE status = 'HALF_DAY') as half_cnt,
             COUNT(*) FILTER (WHERE status = 'ABSENT') as absent_cnt,
             COALESCE(SUM(total_hours), 0) as total_logged_hours
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

        const loggedHrs = parseFloat(attCounts.total_logged_hours || 0);
        if (loggedHrs > 0) {
          workedHours = loggedHrs;
        } else {
          workedHours = Math.round(workedDays * scheduleHoursPerDay * 10) / 10;
        }
      } catch (err) {
        // Attendance query fallback
      }
    }

    const workedWeeks = Math.round((workedDays / 5.0) * 10) / 10;

    // Query approved leave requests from PostgreSQL (both paid and unpaid/LWP)
    if (leaveInputs) {
      unpaidLeaveDays = parseFloat(leaveInputs.unpaidLeaveDays || 0.0);
      paidLeaveDays = parseFloat(leaveInputs.paidLeaveDays || 0.0);
    } else {
      try {
        const leaveRes = await db.query(
          `SELECT 
             COALESCE(SUM(CASE WHEN t.is_paid = false THEN r.total_days ELSE 0 END), 0) as unpaid_days,
             COALESCE(SUM(CASE WHEN t.is_paid = true THEN r.total_days ELSE 0 END), 0) as paid_days
           FROM time_off_requests r
           JOIN time_off_types t ON r.time_off_type_id = t.id
           WHERE r.employee_id = $1 
             AND r.status = 'APPROVED'
             AND r.start_date <= $3 AND r.end_date >= $2`,
          [employeeId, periodStart, periodEnd]
        );
        if (leaveRes.rows.length > 0) {
          unpaidLeaveDays = parseFloat(leaveRes.rows[0].unpaid_days || 0.0);
          paidLeaveDays = parseFloat(leaveRes.rows[0].paid_days || 0.0);
        }
      } catch (err) {
        // Leave query fallback
      }
    }

    const totalNonPaidDays = Math.round((unpaidLeaveDays + absentDays) * 10) / 10;

    // 7. Initialize Multi-Model Calculation Context & Accumulators
    const wageType = (contract.wage_type || 'MONTHLY').toUpperCase();
    const wageRate = parseFloat(contract.wage_rate || 0);

    const hourlyRate = wageType === 'HOURLY'
      ? wageRate
      : Math.round((wageRate / standardWorkingHours) * 100) / 100;

    const weeklyRate = wageType === 'WEEKLY'
      ? wageRate
      : Math.round((wageRate / standardWeeks) * 100) / 100;

    const dailyRate = wageType === 'DAILY'
      ? wageRate
      : Math.round((wageRate / standardWorkingDays) * 100) / 100;

    const accumulator = {
      WAGE_RATE: wageRate,
      WAGE_TYPE: wageType,
      STANDARD_DAYS: standardWorkingDays,
      WORKED_DAYS: workedDays,
      ABSENT_DAYS: absentDays,
      UNPAID_LEAVE_DAYS: unpaidLeaveDays,
      PAID_LEAVE_DAYS: paidLeaveDays,
      NON_PAID_DAYS: totalNonPaidDays,
      STANDARD_HOURS: standardWorkingHours,
      WORKED_HOURS: workedHours,
      HOURLY_RATE: hourlyRate,
      STANDARD_WEEKS: standardWeeks,
      WORKED_WEEKS: workedWeeks,
      WEEKLY_RATE: weeklyRate,
      DAILY_RATE: dailyRate,
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
          if (wageType === 'HOURLY') {
            componentAmount = Math.round(workedHours * (ruleRate > 0 ? ruleRate : wageRate) * 100) / 100;
          } else if (wageType === 'WEEKLY') {
            componentAmount = Math.round(workedWeeks * (ruleRate > 0 ? ruleRate : wageRate) * 100) / 100;
          } else if (wageType === 'DAILY') {
            componentAmount = Math.round(workedDays * (ruleRate > 0 ? ruleRate : wageRate) * 100) / 100;
          } else {
            // MONTHLY (Standard or Intern Stipend)
            componentAmount = ruleRate > 0 ? ruleRate : accumulator.WAGE_RATE;
            if (applyProration && standardWorkingDays > 0 && workedDays < standardWorkingDays) {
              componentAmount = (componentAmount / standardWorkingDays) * workedDays;
            }
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

    // Automatically apply Unpaid Leave / Absenteeism Loss of Pay (LOP) deduction (for non-hourly workers)
    let lossOfPayDeduction = 0.0;
    if (totalNonPaidDays > 0 && wageType !== 'HOURLY') {
      const baseDailyRate = accumulator.DAILY_RATE || (accumulator.WAGE_RATE / standardWorkingDays);
      lossOfPayDeduction = Math.round(baseDailyRate * totalNonPaidDays * 100) / 100;

      evaluatedComponents.push({
        id: 'rule-unpaid-leave-deduction',
        rule_name: 'Loss of Pay / Unpaid Leave Deduction',
        rule_code: 'UNPAID_LEAVE_DED',
        category: 'DEDUCTION',
        calculation_type: 'FORMULA',
        sequence_order: 75,
        rate: lossOfPayDeduction,
        percentage_base: null,
        formula: `(${totalNonPaidDays} non-paid days / ${standardWorkingDays} standard days) * Daily Base Wage`,
        amount: lossOfPayDeduction,
      });

      totalDeductions = Math.round((totalDeductions + lossOfPayDeduction) * 100) / 100;
      accumulator.UNPAID_LEAVE_DED = lossOfPayDeduction;
      accumulator.TOTAL_DEDUCTIONS = totalDeductions;
    }

    if (accumulator.NET !== undefined && totalNonPaidDays === 0) {
      netAmount = accumulator.NET;
    } else {
      netAmount = Math.max(0, Math.round((grossAmount - totalDeductions) * 100) / 100);
      accumulator.NET = netAmount;
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
        unpaid_leave_days: unpaidLeaveDays,
        paid_leave_days: paidLeaveDays,
        total_non_paid_days: totalNonPaidDays,
        standard_hours: standardWorkingHours,
        worked_hours: workedHours,
        standard_weeks: standardWeeks,
        worked_weeks: workedWeeks,
      },
      contract_terms: {
        wage_type: wageType,
        wage_rate: wageRate,
        hourly_rate: hourlyRate,
        weekly_rate: weeklyRate,
        daily_rate: dailyRate,
      },
      attendance: {
        standard_working_days: standardWorkingDays,
        worked_days: workedDays,
        absent_days: absentDays,
        unpaid_leave_days: unpaidLeaveDays,
        paid_leave_days: paidLeaveDays,
        total_non_paid_days: totalNonPaidDays,
        worked_hours: workedHours,
        loss_of_pay_deduction: lossOfPayDeduction,
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
