const db = require('../../../database/db');
const timeoffRepository = require('../repositories/timeoffRepository');
const ApiError = require('../../../utils/ApiError');

/**
 * Time Off Service Layer
 * Owner: P2 (HR Operations)
 * Foundation business logic for Leave Types, Allocations, and Requests
 */
const timeoffService = {
  // Types
  async getTypes() {
    return timeoffRepository.findTypes();
  },

  async createType(data) {
    if (!data.name || !data.code) {
      throw ApiError.badRequest('Leave type name and code are required');
    }
    return timeoffRepository.createType(data);
  },

  // Allocations
  async getAllocations(query = {}) {
    return timeoffRepository.findAllocations({
      employee_id: query.employee_id,
      year: query.year,
    });
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

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
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

  async createRequest(data) {
    if (!data.employee_id || !data.time_off_type_id || !data.start_date || !data.end_date) {
      throw ApiError.badRequest('Employee ID, Leave Type, start date, and end date are required');
    }
    if (new Date(data.start_date) > new Date(data.end_date)) {
      throw ApiError.badRequest('Start date cannot be after end date');
    }

    // Detect working days excluding weekends / non-working days from employee's schedule
    const detected = await this.calculateWorkingDays(data.employee_id, data.start_date, data.end_date);

    if (parseFloat(data.total_days) === 0.5 && detected.working_days >= 1) {
      data.total_days = 0.5;
    } else {
      data.total_days = detected.working_days;
    }

    if (data.total_days <= 0) {
      throw ApiError.badRequest(
        'Selected date range contains 0 working days according to employee working schedule (weekends/off-days excluded)'
      );
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
    return timeoffRepository.updateRequestStatus(id, { status, approver_id });
  },
};

module.exports = timeoffService;
