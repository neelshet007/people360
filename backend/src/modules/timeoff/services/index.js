const db = require('../../../database/db');
const timeoffRepository = require('../repositories/timeoffRepository');
const compOffRepository = require('../repositories/compOffRepository');
const ApiError = require('../../../utils/ApiError');

/**
 * Time Off Service Layer
 * Owner: P2 (HR Operations)
 * Foundation business logic for Leave Types, Allocations, and Requests
 */
const timeoffService = {
  // Types
  async getTypes(query = {}) {
    return timeoffRepository.findTypes(query);
  },

  async getTypeById(id) {
    const type = await timeoffRepository.findTypeById(id);
    if (!type) {
      throw ApiError.notFound(`Time off type with ID '${id}' not found`);
    }
    return type;
  },

  async createType(data) {
    if (!data.name || !data.name.trim()) {
      throw ApiError.badRequest('Time off type name is required');
    }
    if (!data.code || !data.code.trim()) {
      throw ApiError.badRequest('Time off type code is required');
    }
    const cleanCode = data.code.trim().toUpperCase();
    const existing = await timeoffRepository.findTypeByCode(cleanCode);
    if (existing) {
      throw ApiError.badRequest(`A time off type with code '${cleanCode}' already exists`);
    }

    const validMethods = ['FIXED_ANNUAL', 'ACCRUED_MONTHLY', 'MANUAL', 'UNLIMITED', 'EARNED'];
    if (data.allocation_method && !validMethods.includes(data.allocation_method)) {
      throw ApiError.badRequest(`Invalid allocation_method. Allowed: ${validMethods.join(', ')}`);
    }

    return timeoffRepository.createType({
      ...data,
      code: cleanCode,
    });
  },

  async updateType(id, data) {
    const existing = await timeoffRepository.findTypeById(id);
    if (!existing) {
      throw ApiError.notFound(`Time off type with ID '${id}' not found`);
    }

    if (data.code && data.code.trim().toUpperCase() !== existing.code) {
      const cleanCode = data.code.trim().toUpperCase();
      const duplicate = await timeoffRepository.findTypeByCode(cleanCode);
      if (duplicate && duplicate.id !== id) {
        throw ApiError.badRequest(`A time off type with code '${cleanCode}' already exists`);
      }
    }

    const validMethods = ['FIXED_ANNUAL', 'ACCRUED_MONTHLY', 'MANUAL', 'UNLIMITED', 'EARNED'];
    if (data.allocation_method && !validMethods.includes(data.allocation_method)) {
      throw ApiError.badRequest(`Invalid allocation_method. Allowed: ${validMethods.join(', ')}`);
    }

    return timeoffRepository.updateType(id, data);
  },

  // Allocations
  async getAllocations(query = {}) {
    return timeoffRepository.findAllocations(query);
  },

  async createAllocation(data) {
    if (!data.employee_id || !data.time_off_type_id || !data.allocated_days) {
      throw ApiError.badRequest('Employee ID, Leave Type ID, and allocated days are required');
    }
    return timeoffRepository.createAllocation(data);
  },

  // Schedule-Aware Working Days Detector
  async calculateWorkingDays(employeeId, startDate, endDate) {
    if (!startDate || !endDate) {
      return { working_days: 0, total_calendar_days: 0, non_working_days: 0, schedule_name: 'Standard' };
    }

    const startStr = typeof startDate === 'string'
      ? startDate.split('T')[0]
      : (startDate instanceof Date ? startDate.toISOString().split('T')[0] : String(startDate));
    const endStr = typeof endDate === 'string'
      ? endDate.split('T')[0]
      : (endDate instanceof Date ? endDate.toISOString().split('T')[0] : String(endDate));

    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      throw ApiError.badRequest('Start date cannot be after end date');
    }

    // Default: Monday-Friday working (true), Saturday & Sunday non-working (false)
    let workingDaysMap = {
      0: false, // Sunday
      1: true,  // Monday
      2: true,  // Tuesday
      3: true,  // Wednesday
      4: true,  // Thursday
      5: true,  // Friday
      6: false, // Saturday
    };
    let scheduleName = 'Standard Monday–Friday Work Week';

    if (employeeId) {
      try {
        const res = await db.query(`
          SELECT ws.name as schedule_name, ws.days_config 
          FROM contracts c
          JOIN working_schedules ws ON c.working_schedule_id = ws.id
          WHERE c.employee_id = $1 AND c.status = 'ACTIVE'
          LIMIT 1;
        `, [employeeId]);

        if (res.rows.length > 0) {
          if (res.rows[0].schedule_name) scheduleName = res.rows[0].schedule_name;
          const daysConfig = res.rows[0].days_config;
          if (Array.isArray(daysConfig)) {
            const dayNameToIdx = {
              'sunday': 0,
              'monday': 1,
              'tuesday': 2,
              'wednesday': 3,
              'thursday': 4,
              'friday': 5,
              'saturday': 6,
            };
            daysConfig.forEach((dc) => {
              const idx = dayNameToIdx[dc.day?.toLowerCase()];
              if (idx !== undefined) {
                workingDaysMap[idx] = dc.is_working !== false;
              }
            });
          }
        }
      } catch (err) {
        // Fallback to default workingDaysMap
      }
    }

    let workingDays = 0;
    let totalCalendarDays = 0;
    const nonWorkingDates = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let cur = new Date(start);
    while (cur <= end) {
      totalCalendarDays++;
      const dayIdx = cur.getDay();
      const dateStr = cur.toISOString().split('T')[0];
      if (workingDaysMap[dayIdx] === true) {
        workingDays++;
      } else {
        nonWorkingDates.push({ date: dateStr, day: dayNames[dayIdx] });
      }
      cur.setDate(cur.getDate() + 1);
    }

    return {
      working_days: workingDays,
      total_calendar_days: totalCalendarDays,
      non_working_days: nonWorkingDates.length,
      non_working_dates: nonWorkingDates,
      schedule_name: scheduleName,
    };
  },

  // Requests
  async listRequests(query = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const { employee_id, status } = query;

    const [data, total] = await Promise.all([
      timeoffRepository.findRequests({ employee_id, status, page, limit }),
      timeoffRepository.countRequests({ employee_id, status }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getRequestById(id) {
    const request = await timeoffRepository.findRequestById(id);
    if (!request) {
      throw ApiError.notFound(`Time-off request with ID '${id}' not found`);
    }
    return request;
  },

  async createRequest(data, requesterUser = null) {
    if (!data.employee_id || !data.time_off_type_id || !data.start_date || !data.end_date) {
      throw ApiError.badRequest('Employee ID, Leave Type, start date, and end date are required');
    }
    if (new Date(data.start_date) > new Date(data.end_date)) {
      throw ApiError.badRequest('Start date cannot be after end date');
    }

    // Retrieve the target time off type configuration
    const leaveType = await timeoffRepository.findTypeById(data.time_off_type_id);
    if (!leaveType) {
      throw ApiError.notFound(`Leave type with ID '${data.time_off_type_id}' does not exist`);
    }

    if (leaveType.is_active === false) {
      throw ApiError.badRequest(`Leave type '${leaveType.name}' is currently inactive and cannot be requested`);
    }

    // Role verification: check if employees can self-request
    if (requesterUser && requesterUser.role === 'EMPLOYEE') {
      if (leaveType.allow_employee_request === false) {
        throw ApiError.badRequest(`Leave type '${leaveType.name}' cannot be requested directly by employees. Please contact HR.`);
      }
    }

    // Detect working days excluding weekends / non-working days from employee's schedule
    const detected = await this.calculateWorkingDays(data.employee_id, data.start_date, data.end_date);

    if (parseFloat(data.total_days) === 0.5 && detected.working_days >= 1) {
      if (leaveType.allow_half_day === false) {
        throw ApiError.badRequest(`Half day leave requests are not permitted for '${leaveType.name}'`);
      }
      data.total_days = 0.5;
    } else {
      data.total_days = detected.working_days;
    }

    if (data.total_days <= 0) {
      throw ApiError.badRequest(
        'Selected date range contains 0 working days according to employee working schedule (weekends/off-days excluded)'
      );
    }

    // Check for overlapping approved or pending requests
    try {
      const isLive = await db.testConnection();
      if (isLive) {
        const overlapRes = await db.query(
          `SELECT id, start_date, end_date, status FROM time_off_requests
           WHERE employee_id = $1
             AND status IN ('APPROVED', 'PENDING')
             AND start_date <= $3 AND end_date >= $2
           LIMIT 1`,
          [data.employee_id, data.start_date, data.end_date]
        );
        if (overlapRes.rows.length > 0) {
          const ov = overlapRes.rows[0];
          throw ApiError.badRequest(
            `You already have an active leave request (${ov.status}) for period ${ov.start_date} to ${ov.end_date}`
          );
        }
      }
    } catch (ovErr) {
      if (ovErr instanceof ApiError) throw ovErr;
    }

    // CRITICAL COMP OFF / EARNED ALLOCATION VALIDATION
    if (leaveType.allocation_method === 'EARNED' || leaveType.code === 'COMP_OFF') {
      const compOffBal = await compOffRepository.getAvailableBalance(data.employee_id);
      const availableDays = parseFloat(compOffBal.available_days || 0);
      const requestedDays = parseFloat(data.total_days);

      if (requestedDays > availableDays) {
        throw ApiError.badRequest(
          `Insufficient Compensatory Off balance. Available: ${availableDays.toFixed(1)} day(s), requested: ${requestedDays.toFixed(1)} day(s). Comp Off must be earned and approved first.`
        );
      }
    }

    return timeoffRepository.createRequest(data);
  },

  async updateRequestStatus(id, { status, approver_id }) {
    if (!status || !['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      throw ApiError.badRequest("Status must be 'APPROVED', 'REJECTED', or 'CANCELLED'");
    }
    const existing = await timeoffRepository.findRequestById(id);
    if (!existing) {
      throw ApiError.notFound(`Time-off request with ID '${id}' not found`);
    }
    const updated = await timeoffRepository.updateRequestStatus(id, { status, approver_id });

    if (status === 'APPROVED') {
      // 1. Consume comp off credits if this is an earned comp off leave
      if (existing.leave_type_code === 'COMP_OFF' || existing.leave_type_name === 'Compensatory Off') {
        try {
          await compOffRepository.consumeCredits(existing.employee_id, existing.total_days);
        } catch (err) {
          console.warn('[TimeoffService] Error consuming comp off credits:', err.message);
        }
      }

      // 2. Attendance Integration: Mark working days in the leave range as ON_LEAVE
      try {
        const isLive = await db.testConnection();
        if (isLive) {
          const sStr = typeof existing.start_date === 'string'
            ? existing.start_date.split('T')[0]
            : new Date(existing.start_date).toISOString().split('T')[0];
          const eStr = typeof existing.end_date === 'string'
            ? existing.end_date.split('T')[0]
            : new Date(existing.end_date).toISOString().split('T')[0];

          const detected = await this.calculateWorkingDays(existing.employee_id, sStr, eStr);
          const start = new Date(sStr + 'T00:00:00');
          const end = new Date(eStr + 'T00:00:00');
          let cur = new Date(start);

          while (cur <= end) {
            const dateStr = cur.toISOString().split('T')[0];
            const isNonWorking = (detected.non_working_dates || []).some(nw => nw.date === dateStr);
            if (!isNonWorking) {
              await db.query(`
                INSERT INTO attendance (employee_id, date, status, notes, total_hours, expected_hours, difference_hours, created_at, updated_at)
                VALUES ($1, $2, 'ON_LEAVE', $3, 0.00, 8.00, -8.00, NOW(), NOW())
                ON CONFLICT (employee_id, date) DO UPDATE
                SET status = 'ON_LEAVE',
                    notes = COALESCE(attendance.notes || E'\\n', '') || $3,
                    updated_at = NOW();
              `, [existing.employee_id, dateStr, `Approved leave: ${existing.leave_type_name || 'Time Off'}`]);
            }
            cur.setDate(cur.getDate() + 1);
          }
        }
      } catch (attErr) {
        console.warn('[TimeoffService] Error syncing approved leave to attendance:', attErr.message);
      }
    }

    return updated;
  },
};

module.exports = timeoffService;
