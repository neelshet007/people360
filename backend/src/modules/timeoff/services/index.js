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
