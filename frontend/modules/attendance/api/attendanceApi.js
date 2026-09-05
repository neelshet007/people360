import apiClient from '../../../lib/api/apiClient';

/**
 * P2 Attendance API Service — Phase 5
 * All attendance endpoints, both employee self-service and HR management.
 */
export const attendanceApi = {
  // ── Employee self-service ──────────────────────────────────
  checkIn: () => apiClient.post('/attendance/check-in', {}),
  checkOut: () => apiClient.post('/attendance/check-out', {}),
  getActive: () => apiClient.get('/attendance/active'),
  getMyHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.year) query.append('year', params.year);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return apiClient.get(`/attendance/me${qs ? `?${qs}` : ''}`);
  },

  // ── HR management ──────────────────────────────────────────
  getAttendance: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.append(k, v); });
    const qs = query.toString();
    return apiClient.get(`/attendance${qs ? `?${qs}` : ''}`);
  },
  getAttendanceById: (id) => apiClient.get(`/attendance/${id}`),
  recordAttendance: (data) => apiClient.post('/attendance', data),
  correctAttendance: (id, data) => apiClient.patch(`/attendance/${id}`, data),
};

export default attendanceApi;
