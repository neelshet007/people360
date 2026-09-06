const attendanceService = require('../services');
const { successResponse } = require('../../../utils/responseHelper');

/**
 * Attendance Controller — Phase 5
 * Owner: P2 (HR Operations)
 */

// POST /api/attendance/check-in
const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    const { latitude, longitude, accuracy } = req.body || {};
    if (!employeeId) {
      return next(Object.assign(new Error('No employee profile linked to your account'), { statusCode: 400, code: 'INVALID_INPUT' }));
    }
    const record = await attendanceService.checkIn(employeeId, req.ip, latitude, longitude, accuracy);
    return successResponse(res, record, null, 201);
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/check-out
const checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return next(Object.assign(new Error('No employee profile linked to your account'), { statusCode: 400, code: 'INVALID_INPUT' }));
    }
    const record = await attendanceService.checkOut(employeeId);
    return successResponse(res, record);
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/active
const getActive = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return successResponse(res, { isCheckedIn: false, checkInTime: null, elapsedSeconds: 0, record: null });
    }
    const state = await attendanceService.getActiveAttendance(employeeId);
    return successResponse(res, state);
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/me
const getMyHistory = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return successResponse(res, []);
    }
    const { month, year, page, limit } = req.query;
    const records = await attendanceService.getMyHistory(employeeId, { month, year, page, limit });
    return successResponse(res, records);
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance  (HR only)
const getAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.listAttendance(req.query);
    return successResponse(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/:id
const getAttendanceById = async (req, res, next) => {
  try {
    const record = await attendanceService.getAttendanceById(req.params.id);
    return successResponse(res, record);
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance  (HR manual log — legacy compat)
const recordAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.recordAttendance(req.body);
    return successResponse(res, record, null, 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/attendance/:id  (HR correction)
const correctAttendance = async (req, res, next) => {
  try {
    const correctedByName = req.user?.name || req.user?.email || 'HR';
    const record = await attendanceService.correctAttendance(req.params.id, req.body, correctedByName);
    return successResponse(res, record);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getActive,
  getMyHistory,
  getAttendance,
  getAttendanceById,
  recordAttendance,
  correctAttendance,
};
