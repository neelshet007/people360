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
  updateSalaryStructure: (id, data) => apiClient.put(`/payroll/salary-structures/${id}`, data),
  deleteSalaryStructure: (id) => apiClient.delete(`/payroll/salary-structures/${id}`),

  // Salary Rules
  getSalaryRules: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/payroll/salary-rules${query ? `?${query}` : ''}`);
  },
  getSalaryRuleById: (id) => apiClient.get(`/payroll/salary-rules/${id}`),
  createSalaryRule: (data) => apiClient.post('/payroll/salary-rules', data),
  updateSalaryRule: (id, data) => apiClient.put(`/payroll/salary-rules/${id}`, data),
  deleteSalaryRule: (id) => apiClient.delete(`/payroll/salary-rules/${id}`),
  reorderSalaryRules: (ruleOrders) => apiClient.post('/payroll/salary-rules/reorder', { ruleOrders }),

  // Salary Calculation Engine
  calculateSalary: (data) => apiClient.post('/payroll/salary/calculate', data),

  // Payruns
  getPayruns: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/payroll/payruns${query ? `?${query}` : ''}`);
  },
  getPayrunById: (id) => apiClient.get(`/payroll/payruns/${id}`),
  checkEligibility: (data) => apiClient.post('/payroll/payruns/eligibility', data),
  createPayrun: (data) => apiClient.post('/payroll/payruns', data),
  computePayrun: (id) => apiClient.post(`/payroll/payruns/${id}/compute`),
  validatePayrun: (id) => apiClient.post(`/payroll/payruns/${id}/validate`),
  markPayrunPaid: (id) => apiClient.post(`/payroll/payruns/${id}/pay`),

  // Payslips
  getPayslips: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/payroll/payslips${query ? `?${query}` : ''}`);
  },
  getPayslipById: (id) => apiClient.get(`/payroll/payslips/${id}`),
  getPayslipPdfUrl: (id) => `${apiClient.baseURL || '/api'}/payroll/payslips/${id}/pdf`,
  emailPayrunPayslips: (payrunId) => apiClient.post(`/payroll/payruns/${payrunId}/email-payslips`),
};

export default payrollApi;
