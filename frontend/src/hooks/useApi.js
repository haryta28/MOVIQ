/**
 * useApi — lightweight hook for a single authenticated GET endpoint.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi('/campaigns');
 *   const { data: tasks = [] } = useApi('/tasks');
 *
 * Features:
 *  - Cancels in-flight requests on unmount (no memory leaks / stale updates)
 *  - Cancels and re-fetches when endpoint changes
 *  - Returns refetch() for manual re-fetching after mutations
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';

export default function useApi(endpoint, { defaultValue = undefined } = {}) {
  const [data, setData]       = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);

  const fetchData = useCallback(async () => {
    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint, { signal: controller.signal });
      setData(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.message ?? 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
