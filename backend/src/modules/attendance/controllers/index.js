const attendanceService = require('../services');
const { successResponse } = require('../../../utils/responseHelper');

/**
 * Attendance Controller
 * Owner: P2 (HR Operations)
 * Handles HTTP requests for employee daily attendance logs
 */

const getAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.listAttendance(req.query);
    return successResponse(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getAttendanceById = async (req, res, next) => {
  try {
    const record = await attendanceService.getAttendanceById(req.params.id);
    return successResponse(res, record);
  } catch (error) {
    next(error);
  }
};

const recordAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.recordAttendance(req.body);
    return successResponse(res, record, null, 201);
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.updateAttendance(req.params.id, req.body);
    return successResponse(res, record);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  getAttendanceById,
  recordAttendance,
  updateAttendance,
};
