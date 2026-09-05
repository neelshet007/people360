import apiClient from '../../../lib/api/apiClient';

/**
 * P3 Payroll API Service
 * Centralized API client functions for Payroll module
 * Reuses shared apiClient
 */
export const payrollApi = {
  // Status
  getStatus: () => apiClient.get('/payroll/status'),

  // Salary Structures
  getSalaryStructures: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/payroll/salary-structures${query ? `?${query}` : ''}`);
  },
  getSalaryStructureById: (id) => apiClient.get(`/payroll/salary-structures/${id}`),
  createSalaryStructure: (data) => apiClient.post('/payroll/salary-structures', data),

  // Salary Rules
  getSalaryRules: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/payroll/salary-rules${query ? `?${query}` : ''}`);
  },
  getSalaryRuleById: (id) => apiClient.get(`/payroll/salary-rules/${id}`),

  // Payruns
  getPayruns: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/payroll/payruns${query ? `?${query}` : ''}`);
  },
  getPayrunById: (id) => apiClient.get(`/payroll/payruns/${id}`),
  createPayrun: (data) => apiClient.post('/payroll/payruns', data),

  // Payslips
  getPayslips: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/payroll/payslips${query ? `?${query}` : ''}`);
  },
  getPayslipById: (id) => apiClient.get(`/payroll/payslips/${id}`),
};

export default payrollApi;
