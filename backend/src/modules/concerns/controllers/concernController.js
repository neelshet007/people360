const concernService = require('../services/concernService');
const { successResponse } = require('../../../utils/responseHelper');

/**
 * Concern Controller — HTTP Handler for Concern Communication API
 */
class ConcernController {
  async listConcerns(req, res, next) {
    try {
      const data = await concernService.listConcerns(req.user, req.query);
      return successResponse(res, data, 'Concerns retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getMetrics(req, res, next) {
    try {
      const metrics = await concernService.getMetrics(req.user);
      return successResponse(res, metrics, 'Concern metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getConcernDetail(req, res, next) {
    try {
      const detail = await concernService.getConcernDetail(req.params.id, req.user);
      return successResponse(res, detail, 'Concern details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async createConcern(req, res, next) {
    try {
      const created = await concernService.createConcern(req.user, req.body);
      return successResponse(res, created, 'Concern created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async addMessage(req, res, next) {
    try {
      const message = await concernService.addMessage(req.params.id, req.user, req.body);
      return successResponse(res, message, 'Message added successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const updated = await concernService.updateStatus(req.params.id, req.user, req.body);
      return successResponse(res, updated, 'Concern status updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async assign(req, res, next) {
    try {
      const assigned = await concernService.assign(req.params.id, req.user, req.body);
      return successResponse(res, assigned, 'Concern assigned successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConcernController();
