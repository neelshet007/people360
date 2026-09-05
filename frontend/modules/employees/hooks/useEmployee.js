import { useState, useEffect, useCallback } from 'react';
import employeesApi from '../api/employeesApi';

/**
 * Hook to fetch and manage a single employee's details
 * Owner: P1 (Core HR)
 */
export function useEmployee(id) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployee = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await employeesApi.getEmployeeById(id);
      const data = response?.data || response;
      setEmployee(data);
    } catch (err) {
      setError(err.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  return {
    employee,
    loading,
    error,
    refetch: fetchEmployee,
  };
}

export default useEmployee;
