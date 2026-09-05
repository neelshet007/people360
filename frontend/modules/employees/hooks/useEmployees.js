import { useState, useEffect, useCallback } from 'react';
import employeesApi from '../api/employeesApi';

/**
 * Hook to fetch and manage paginated & filtered employees list
 * Owner: P1 (Core HR)
 */
export function useEmployees(initialFilters = {}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeesApi.getEmployees({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      // Handle standard envelope or backend array format
      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response)
        ? response
        : [];

      setEmployees(items);

      if (response?.meta) {
        setPagination((prev) => ({
          ...prev,
          total: response.meta.total || items.length,
          totalPages: Math.ceil((response.meta.total || items.length) / (response.meta.limit || prev.limit)) || 1,
        }));
      } else {
        setPagination((prev) => ({
          ...prev,
          total: items.length,
          totalPages: Math.max(1, Math.ceil(items.length / prev.limit)),
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const setPage = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return {
    employees,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    setPage,
    refetch: fetchEmployees,
  };
}

export default useEmployees;
