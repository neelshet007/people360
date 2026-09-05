import { useState, useEffect, useCallback } from 'react';
import contractsApi from '../api/contractsApi';

/**
 * Hook to manage list of contracts
 * Owner: P1 (Core HR)
 */
export function useContracts(initialFilters = {}) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contractsApi.getContracts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response)
        ? response
        : [];

      setContracts(items);

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
      setError(err.message || 'Failed to load contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const setPage = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return {
    contracts,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    setPage,
    refetch: fetchContracts,
  };
}

export default useContracts;
