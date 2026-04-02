import { useState, useEffect, useCallback } from 'react';
import type { Grant } from '@scout-grants/shared';
import { grantsApi } from '../services/grantsApi';

interface UseGrantsResult {
  grants: Grant[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useGrants(): UseGrantsResult {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    grantsApi
      .list()
      .then((data) => {
        if (!cancelled) setGrants(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load grants');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { grants, isLoading, error, reload };
}
