const scheduleRepository = require('../repositories/scheduleRepository');
const { validateScheduleData, parseTimeToMinutes } = require('../validators');

/**
 * Working Schedules Service Layer
 * Owner: P1 (Core HR)
 * Implements business logic and authoritative automated weekly hours calculation
 */

const calculateScheduleHours = (daysConfig) => {
  if (!Array.isArray(daysConfig) || daysConfig.length === 0) {
    return {
      total_weekly_hours: 40.0,
      standard_hours_per_day: 8.0,
      standard_days_per_week: 5,
      calculatedDays: daysConfig || [],
    };
  }

  let totalMinutes = 0;
  let workingDaysCount = 0;

  const calculatedDays = daysConfig.map((item) => {
    if (!item.is_working) {
      return {
        ...item,
        daily_hours: 0,
      };
    }

    const startMin = parseTimeToMinutes(item.start_time);
    const endMin = parseTimeToMinutes(item.end_time);
    const breakMin = parseInt(item.break_duration_minutes || 0, 10);

    if (startMin !== null && endMin !== null && endMin > startMin) {
      const netWorkingMin = Math.max(0, endMin - startMin - breakMin);
      const dailyHours = Math.round((netWorkingMin / 60) * 100) / 100;
      totalMinutes += netWorkingMin;
      workingDaysCount += 1;
      return {
        ...item,
        daily_hours: dailyHours,
      };
    }

    return {
      ...item,
      daily_hours: 0,
    };
  });

  const totalWeeklyHours = Math.round((totalMinutes / 60) * 100) / 100;
  const standardHoursPerDay =
    workingDaysCount > 0
      ? Math.round((totalWeeklyHours / workingDaysCount) * 100) / 100
      : 0;

  return {
    total_weekly_hours: totalWeeklyHours,
    standard_hours_per_day: standardHoursPerDay,
    standard_days_per_week: workingDaysCount,
    calculatedDays,
  };
};

const scheduleService = {
  calculateScheduleHours,

  getSchedules: async ({ page = 1, limit = 20, is_active } = {}) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const schedules = await scheduleRepository.findSchedules({
      page: pageNum,
      limit: limitNum,
      is_active,
    });
    const total = await scheduleRepository.countSchedules({ is_active });

    return {
      schedules,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  getScheduleById: async (id) => {
    const schedule = await scheduleRepository.findScheduleById(id);
    if (!schedule) {
      const err = new Error(`Working schedule with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }
    return schedule;
  },

  createSchedule: async (data) => {
    const validation = validateScheduleData(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(', '));
      err.statusCode = 400;
      throw err;
    }

    let calculated = null;
    if (data.days_config && Array.isArray(data.days_config)) {
      calculated = calculateScheduleHours(data.days_config);
    }

    const payload = {
      name: data.name.trim(),
      standard_hours_per_day: calculated ? calculated.standard_hours_per_day : parseFloat(data.standard_hours_per_day || 8.0),
      standard_days_per_week: calculated ? calculated.standard_days_per_week : parseInt(data.standard_days_per_week || 5, 10),
      total_weekly_hours: calculated ? calculated.total_weekly_hours : parseFloat(data.total_weekly_hours || 40.0),
      break_duration_minutes: parseInt(data.break_duration_minutes || 60, 10),
      timezone: data.timezone || 'UTC',
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      days_config: calculated ? calculated.calculatedDays : data.days_config,
    };

    return scheduleRepository.createSchedule(payload);
  },

  updateSchedule: async (id, data) => {
    const existing = await scheduleRepository.findScheduleById(id);
    if (!existing) {
      const err = new Error(`Working schedule with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const validation = validateScheduleData({ ...existing, ...data });
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(', '));
      err.statusCode = 400;
      throw err;
    }

    const payload = { ...data };
    if (data.days_config && Array.isArray(data.days_config)) {
      const calculated = calculateScheduleHours(data.days_config);
      payload.total_weekly_hours = calculated.total_weekly_hours;
      payload.standard_hours_per_day = calculated.standard_hours_per_day;
      payload.standard_days_per_week = calculated.standard_days_per_week;
      payload.days_config = calculated.calculatedDays;
    }

    return scheduleRepository.updateSchedule(id, payload);
  },

  deleteSchedule: async (id) => {
    const existing = await scheduleRepository.findScheduleById(id);
    if (!existing) {
      const err = new Error(`Working schedule with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    return scheduleRepository.deleteSchedule(id);
  },
};

module.exports = scheduleService;
