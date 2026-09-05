/**
 * Working Schedules Input Validators
 * Owner: P1 (Core HR)
 */

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const validateScheduleData = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Schedule name is required');
  }

  if (data.days_config && Array.isArray(data.days_config)) {
    data.days_config.forEach((dayObj, index) => {
      const dayName = dayObj.day || `Day ${index + 1}`;
      if (dayObj.is_working) {
        const startMin = parseTimeToMinutes(dayObj.start_time);
        const endMin = parseTimeToMinutes(dayObj.end_time);

        if (startMin === null) {
          errors.push(`Invalid start time for ${dayName}. Expected HH:MM (24-hour)`);
        }
        if (endMin === null) {
          errors.push(`Invalid end time for ${dayName}. Expected HH:MM (24-hour)`);
        }

        if (startMin !== null && endMin !== null) {
          if (startMin >= endMin) {
            errors.push(`Start time (${dayObj.start_time}) must be earlier than end time (${dayObj.end_time}) on ${dayName}`);
          }
          const breakMin = parseInt(dayObj.break_duration_minutes || 0, 10);
          if (isNaN(breakMin) || breakMin < 0) {
            errors.push(`Break duration on ${dayName} must be non-negative`);
          } else {
            const shiftDuration = endMin - startMin;
            if (breakMin >= shiftDuration) {
              errors.push(`Break duration (${breakMin} mins) cannot exceed or equal shift duration (${shiftDuration} mins) on ${dayName}`);
            }
          }
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  parseTimeToMinutes,
  validateScheduleData,
};
