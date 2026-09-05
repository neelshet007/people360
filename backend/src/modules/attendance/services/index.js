const attendanceRepository = require('../repositories/attendanceRepository');
const ApiError = require('../../../utils/ApiError');

/**
 * Attendance Service Layer
 * Owner: P2 (HR Operations)
 * Foundation business logic and validation for employee attendance tracking
 */
const attendanceService = {
  async listAttendance(query = {}) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const { employee_id, date, status } = query;

    const [data, total] = await Promise.all([
      attendanceRepository.findAttendance({ employee_id, date, status, page, limit }),
      attendanceRepository.countAttendance({ employee_id, date, status }),
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

  async getAttendanceById(id) {
    const record = await attendanceRepository.findAttendanceById(id);
    if (!record) {
      throw ApiError.notFound(`Attendance record with ID '${id}' not found`);
    }
    return record;
  },

  async recordAttendance(data) {
    if (!data.employee_id) {
      throw ApiError.badRequest('Employee ID is required');
    }
    if (!data.date) {
      throw ApiError.badRequest('Attendance date is required');
    }

    // Check duplicate attendance entry for same employee on the same date
    const existing = await attendanceRepository.findByEmployeeAndDate(data.employee_id, data.date);
    if (existing) {
      throw ApiError.conflict(`Attendance for employee on ${data.date} is already recorded`);
    }

    return attendanceRepository.createAttendance(data);
  },

  async updateAttendance(id, data) {
    const existing = await attendanceRepository.findAttendanceById(id);
    if (!existing) {
      throw ApiError.notFound(`Attendance record with ID '${id}' not found`);
    }
    return attendanceRepository.updateAttendance(id, data);
  },
};

module.exports = attendanceService;
