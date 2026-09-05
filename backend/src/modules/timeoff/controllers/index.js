const timeoffService = require('../services');
const { successResponse } = require('../../../utils/responseHelper');

/**
 * Time Off Controller
 * Owner: P2 (HR Operations)
 * Handles HTTP requests for Leave Types, Allocations, and Requests
 */

const getTypes = async (req, res, next) => {
  try {
    const types = await timeoffService.getTypes();
    return successResponse(res, types);
  } catch (error) {
    next(error);
  }
};

const createType = async (req, res, next) => {
  try {
    const type = await timeoffService.createType(req.body);
    return successResponse(res, type, null, 201);
  } catch (error) {
    next(error);
  }
};

const getAllocations = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    if (req.user && req.user.role === 'EMPLOYEE' && req.user.employeeId) {
      filters.employee_id = req.user.employeeId;
    }
    const allocations = await timeoffService.getAllocations(filters);
    return successResponse(res, allocations);
  } catch (error) {
    next(error);
  }
};

const createAllocation = async (req, res, next) => {
  try {
    const allocation = await timeoffService.createAllocation(req.body);
    return successResponse(res, allocation, null, 201);
  } catch (error) {
    next(error);
  }
};

const getRequests = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    if (req.user && req.user.role === 'EMPLOYEE' && req.user.employeeId) {
      filters.employee_id = req.user.employeeId;
    }
    const result = await timeoffService.listRequests(filters);
    return successResponse(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const request = await timeoffService.getRequestById(req.params.id);
    if (req.user && req.user.role === 'EMPLOYEE' && request && request.employee_id !== req.user.employeeId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You can only view your own leave requests.' }
      });
    }
    return successResponse(res, request);
  } catch (error) {
    next(error);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.user && req.user.role === 'EMPLOYEE' && req.user.employeeId) {
      payload.employee_id = req.user.employeeId;
    }
    const request = await timeoffService.createRequest(payload);
    return successResponse(res, request, null, 201);
  } catch (error) {
    next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const request = await timeoffService.updateRequestStatus(req.params.id, req.body);
    return successResponse(res, request);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTypes,
  createType,
  getAllocations,
  createAllocation,
  getRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
};
