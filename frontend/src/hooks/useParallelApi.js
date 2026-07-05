/**
 * useParallelApi — fetch multiple endpoints simultaneously.
 *
 * Usage:
 *   const { results, loading } = useParallelApi([
 *     '/analytics/overview',
 *     '/agencies',
 *     '/fraud-alerts',
 *   ]);
 *   const [overview, agencies, fraudAlerts] = results;
 *
 * All requests fire in parallel via Promise.all.
 * Automatically cleans up if the component unmounts mid-fetch.
 */
import { useEffect, useState } from 'react';
import api from '../api';

export default function useParallelApi(endpoints) {
  const [results, setResults] = useState(endpoints.map(() => undefined));
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Use a stable key so the effect re-runs only when endpoints actually change
  const key = endpoints.join('|');

  useEffect(() => {
    if (!endpoints || endpoints.length === 0) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all(endpoints.map(ep => api.get(ep)))
      .then(responses => {
        if (!cancelled) setResults(responses.map(r => r.data));
      })
      .catch(err => {
        if (!cancelled && err.name !== 'CanceledError') {
          setError(err.message ?? 'Request failed');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { results, loading, error };
}
