import apiClient from '../../../lib/api/apiClient';

/**
 * Employees Module API Layer
 * Owner: P1 (Core HR)
 * Dispatches through shared apiClient to backend /api/employees
 */
export const employeesApi = {
  getEmployees: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department) query.append('department', params.department);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const endpoint = `/employees${qs ? `?${qs}` : ''}`;
    return apiClient.get(endpoint);
  },

  getEmployeeById: async (id) => {
    return apiClient.get(`/employees/${id}`);
  },

  createEmployee: async (employeeData) => {
    return apiClient.post('/employees', employeeData);
  },

  updateEmployee: async (id, employeeData) => {
    return apiClient.put(`/employees/${id}`, employeeData);
  },

  deleteEmployee: async (id) => {
    return apiClient.delete(`/employees/${id}`);
  },
};

export default employeesApi;
