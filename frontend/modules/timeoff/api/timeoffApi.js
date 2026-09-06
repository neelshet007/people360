import apiClient from '../../../lib/api/apiClient';

/**
 * P2 Time Off API Service
 * Centralized API client functions for Time Off module
 */
export const timeoffApi = {
  // Leave Types
  getTypes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/timeoff/types${query ? `?${query}` : ''}`);
  },
  getTypeById: (id) => apiClient.get(`/timeoff/types/${id}`),
  createType: (data) => apiClient.post('/timeoff/types', data),
  updateType: (id, data) => apiClient.patch(`/timeoff/types/${id}`, data),

  // Leave Allocations
  getAllocations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/timeoff/allocations${query ? `?${query}` : ''}`);
  },
  createAllocation: (data) => apiClient.post('/timeoff/allocations', data),

  // Leave Requests
  getRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/timeoff/requests${query ? `?${query}` : ''}`);
  },
  getRequestById: (id) => apiClient.get(`/timeoff/requests/${id}`),
  createRequest: (data) => apiClient.post('/timeoff/requests', data),
  updateRequestStatus: (id, statusData) => apiClient.patch(`/timeoff/requests/${id}`, statusData),
  calculateWorkingDays: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/timeoff/calculate-days${query ? `?${query}` : ''}`);
  },

  // Compensatory Off (Comp Off)
  getCompOffType: () => apiClient.get('/timeoff/comp-off/type'),
  listCompOffCredits: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/timeoff/comp-off/credits${query ? `?${query}` : ''}`);
  },
  raiseCompOffClaim: (data) => apiClient.post('/timeoff/comp-off/credits', data),
  getCompOffCreditById: (id) => apiClient.get(`/timeoff/comp-off/credits/${id}`),
  approveCompOffCredit: (id) => apiClient.post(`/timeoff/comp-off/credits/${id}/approve`),
  rejectCompOffCredit: (id) => apiClient.post(`/timeoff/comp-off/credits/${id}/reject`),
  getCompOffBalance: (employeeId) => apiClient.get(`/timeoff/comp-off/balance/${employeeId}`),
};

export default timeoffApi;
