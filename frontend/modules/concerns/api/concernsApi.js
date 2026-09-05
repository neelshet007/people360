import apiClient from '../../../lib/api/apiClient';

/**
 * Concern Communication API Service
 * Handles listing, creation, conversation messages, status lifecycle, and assignment
 */
export const concernsApi = {
  // Get paginated list of concerns with filters
  getConcerns: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return apiClient.get(`/concerns${qs ? `?${qs}` : ''}`);
  },

  // Get KPI summary metric counters
  getMetrics: () => apiClient.get('/concerns/metrics'),

  // Get single concern detail (with messages, status history, and linked record)
  getConcernById: (id) => apiClient.get(`/concerns/${id}`),

  // Create concern
  createConcern: (data) => apiClient.post('/concerns', data),

  // Post message or internal note to conversation
  addMessage: (id, { message, isInternal = false }) =>
    apiClient.post(`/concerns/${id}/messages`, { message, isInternal }),

  // Transition lifecycle status
  updateStatus: (id, { status, comment = null }) =>
    apiClient.patch(`/concerns/${id}/status`, { status, comment }),

  // Assign concern to an HR/Payroll user
  assignConcern: (id, { assignedToUserId, comment = null }) =>
    apiClient.post(`/concerns/${id}/assign`, { assignedToUserId, comment }),
};

export default concernsApi;
