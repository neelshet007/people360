import { useState, useEffect, useCallback } from 'react';
import schedulesApi from '../api/schedulesApi';

/**
 * Hook to fetch single working schedule by ID
 * Owner: P1 (Core HR)
 */
export function useSchedule(id) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await schedulesApi.getScheduleById(id);
      const data = response?.data || response;
      setSchedule(data);
    } catch (err) {
      setError(err.message || 'Failed to load schedule details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    schedule,
    loading,
    error,
    refetch: fetchSchedule,
  };
}

export default useSchedule;
