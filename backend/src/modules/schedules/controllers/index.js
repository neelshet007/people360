const scheduleService = require('../services');

/**
 * Working Schedules Controller
 * Owner: P1 (Core HR)
 */

const getSchedules = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_active } = req.query;
    const activeFilter = is_active !== undefined ? is_active === 'true' : undefined;

    const result = await scheduleService.getSchedules({
      page,
      limit,
      is_active: activeFilter,
    });

    return res.status(200).json({
      success: true,
      data: result.schedules,
      pagination: result.pagination,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.getScheduleById(id);

    return res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const newSchedule = await scheduleService.createSchedule(req.body);

    return res.status(201).json({
      success: true,
      data: newSchedule,
      message: 'Working schedule created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await scheduleService.updateSchedule(id, req.body);

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Working schedule updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(id);

    return res.status(200).json({
      success: true,
      message: 'Working schedule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
