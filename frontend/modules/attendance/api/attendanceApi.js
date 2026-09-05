import apiClient from '../../../lib/api/apiClient';

/**
 * P2 Attendance API Service
 * Centralized API client functions for Attendance module
 */
export const attendanceApi = {
  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/attendance${query ? `?${query}` : ''}`);
  },
  getAttendanceById: (id) => apiClient.get(`/attendance/${id}`),
  recordAttendance: (data) => apiClient.post('/attendance', data),
  updateAttendance: (id, data) => apiClient.patch(`/attendance/${id}`, data),
};

export default attendanceApi;
