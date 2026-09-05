import { useState, useEffect, useCallback } from 'react';
import contractsApi from '../api/contractsApi';

/**
 * Hook to fetch single contract by ID
 * Owner: P1 (Core HR)
 */
export function useContract(id) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContract = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await contractsApi.getContractById(id);
      const data = response?.data || response;
      setContract(data);
    } catch (err) {
      setError(err.message || 'Failed to load contract details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  return {
    contract,
    loading,
    error,
    refetch: fetchContract,
  };
}

export default useContract;
