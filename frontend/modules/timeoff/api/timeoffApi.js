import apiClient from '../../../lib/api/apiClient';

/**
 * P2 Time Off API Service
 * Centralized API client functions for Time Off module
 */
export const timeoffApi = {
  // Leave Types
  getTypes: () => apiClient.get('/timeoff/types'),
  createType: (data) => apiClient.post('/timeoff/types', data),

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
};

export default timeoffApi;
