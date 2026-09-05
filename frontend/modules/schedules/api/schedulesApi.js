import apiClient from '../../../lib/api/apiClient';

/**
 * Working Schedules Module API Layer
 * Owner: P1 (Core HR)
 * Communicates with backend /api/schedules
 */
export const schedulesApi = {
  getSchedules: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const endpoint = `/schedules${qs ? `?${qs}` : ''}`;
    return apiClient.get(endpoint);
  },

  getScheduleById: async (id) => {
    return apiClient.get(`/schedules/${id}`);
  },

  createSchedule: async (scheduleData) => {
    return apiClient.post('/schedules', scheduleData);
  },

  updateSchedule: async (id, scheduleData) => {
    return apiClient.put(`/schedules/${id}`, scheduleData);
  },

  deleteSchedule: async (id) => {
    return apiClient.delete(`/schedules/${id}`);
  },
};

export default schedulesApi;
