import apiClient from '../../../lib/api/apiClient';

/**
 * Contracts Module API Layer
 * Owner: P1 (Core HR)
 * Communicates with backend /api/contracts
 */
export const contractsApi = {
  getContracts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.status) query.append('status', params.status);
    if (params.contract_type) query.append('contract_type', params.contract_type);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const endpoint = `/contracts${qs ? `?${qs}` : ''}`;
    return apiClient.get(endpoint);
  },

  getContractById: async (id) => {
    return apiClient.get(`/contracts/${id}`);
  },

  createContract: async (contractData) => {
    return apiClient.post('/contracts', contractData);
  },

  updateContract: async (id, contractData) => {
    return apiClient.put(`/contracts/${id}`, contractData);
  },

  deleteContract: async (id) => {
    return apiClient.delete(`/contracts/${id}`);
  },
};

export default contractsApi;
