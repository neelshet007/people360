import { useState, useEffect, useCallback } from 'react';
import schedulesApi from '../api/schedulesApi';

/**
 * Hook to manage working schedules list
 * Owner: P1 (Core HR)
 */
export function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await schedulesApi.getSchedules();

      const items = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response)
        ? response
        : [];

      setSchedules(items);
    } catch (err) {
      setError(err.message || 'Failed to load working schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
  };
}

export default useSchedules;
