const timeoffService = require('../services');
const { successResponse } = require('../../../utils/responseHelper');

/**
 * Time Off Controller
 * Owner: P2 (HR Operations)
 * Handles HTTP requests for Leave Types, Allocations, and Requests
 */

const getTypes = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    if (req.user && req.user.role === 'EMPLOYEE' && filters.is_active === undefined) {
      filters.is_active = true;
    }
    const types = await timeoffService.getTypes(filters);
    return successResponse(res, types);
  } catch (error) {
    next(error);
  }
};

const getTypeById = async (req, res, next) => {
  try {
    const type = await timeoffService.getTypeById(req.params.id);
    return successResponse(res, type);
  } catch (error) {
    next(error);
  }
};

const createType = async (req, res, next) => {
  try {
    const type = await timeoffService.createType(req.body);
    return successResponse(res, type, 'Time off type created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateType = async (req, res, next) => {
  try {
    const type = await timeoffService.updateType(req.params.id, req.body);
    return successResponse(res, type, 'Time off type updated successfully');
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
    const request = await timeoffService.createRequest(payload, req.user);
    return successResponse(res, request, null, 201);
  } catch (error) {
    next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const approverId = req.user?.employeeId || null;
    const request = await timeoffService.updateRequestStatus(req.params.id, {
      ...req.body,
      approver_id: approverId,
    });
    return successResponse(res, request);
  } catch (error) {
    next(error);
  }
};

const calculateWorkingDays = async (req, res, next) => {
  try {
    let employeeId = req.query.employee_id;
    if (req.user && req.user.role === 'EMPLOYEE' && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }
    const result = await timeoffService.calculateWorkingDays(
      employeeId,
      req.query.start_date,
      req.query.end_date
    );
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// COMPENSATORY OFF (COMP OFF)
// -----------------------------------------------------------------------------
const compOffService = require('../services/compOffService');

const raiseCreditClaim = async (req, res, next) => {
  try {
    const requesterId = req.user?.employeeId || null;
    const requesterRole = req.user?.role || 'EMPLOYEE';
    // Allow HR to specify employee_id; employees default to themselves
    const payload = {
      ...req.body,
      employee_id: req.body.employee_id || requesterId,
    };
    const credit = await compOffService.raiseCreditClaim(payload, requesterId, requesterRole);
    return successResponse(res, credit, null, 201);
  } catch (error) {
    next(error);
  }
};

const listCompOffCredits = async (req, res, next) => {
  try {
    const requesterRole = req.user?.role || 'EMPLOYEE';
    const requesterEmployeeId = req.user?.employeeId || null;
    const credits = await compOffService.listCredits(req.query, requesterRole, requesterEmployeeId);
    return successResponse(res, credits);
  } catch (error) {
    next(error);
  }
};

const getCompOffCreditById = async (req, res, next) => {
  try {
    const credit = await compOffService.getCreditById(req.params.id);
    return successResponse(res, credit);
  } catch (error) {
    next(error);
  }
};

const approveCompOffCredit = async (req, res, next) => {
  try {
    const approverId = req.user?.id || req.user?.userId || null;
    const credit = await compOffService.approveCredit(req.params.id, approverId);
    return successResponse(res, credit);
  } catch (error) {
    next(error);
  }
};

const rejectCompOffCredit = async (req, res, next) => {
  try {
    const approverId = req.user?.id || req.user?.userId || null;
    const credit = await compOffService.rejectCredit(req.params.id, approverId);
    return successResponse(res, credit);
  } catch (error) {
    next(error);
  }
};

const getCompOffBalance = async (req, res, next) => {
  try {
    let employeeId = req.params.employeeId;
    if (req.user?.role === 'EMPLOYEE' && req.user?.employeeId) {
      employeeId = req.user.employeeId;
    }
    const balance = await compOffService.getBalance(employeeId);
    return successResponse(res, balance);
  } catch (error) {
    next(error);
  }
};

const getCompOffTypeId = async (req, res, next) => {
  try {
    const typeId = await compOffService.getCompOffTypeId();
    return successResponse(res, { comp_off_type_id: typeId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTypes,
  getTypeById,
  createType,
  updateType,
  getAllocations,
  createAllocation,
  getRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  calculateWorkingDays,
  // Comp Off
  raiseCreditClaim,
  listCompOffCredits,
  getCompOffCreditById,
  approveCompOffCredit,
  rejectCompOffCredit,
  getCompOffBalance,
  getCompOffTypeId,
};

