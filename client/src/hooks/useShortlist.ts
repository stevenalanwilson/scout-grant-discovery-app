import { useState, useEffect, useCallback } from 'react';
import { shortlistApi } from '../services/shortlistApi';

interface UseShortlistResult {
  shortlistedIds: Set<string>;
  isLoading: boolean;
  toggle: (grantId: string) => Promise<void>;
}

export function useShortlist(): UseShortlistResult {
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    shortlistApi
      .list()
      .then((grants) => setShortlistedIds(new Set(grants.map((g) => g.id))))
      .catch(() => {
        // Non-critical — shortlist state starts empty
      })
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = useCallback(
    async (grantId: string): Promise<void> => {
      const isShortlisted = shortlistedIds.has(grantId);
      // Optimistic update
      setShortlistedIds((prev) => {
        const next = new Set(prev);
        if (isShortlisted) {
          next.delete(grantId);
        } else {
          next.add(grantId);
        }
        return next;
      });

      try {
        if (isShortlisted) {
          await shortlistApi.remove(grantId);
        } else {
          await shortlistApi.add(grantId);
        }
      } catch {
        // Revert on failure
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          if (isShortlisted) {
            next.add(grantId);
          } else {
            next.delete(grantId);
          }
          return next;
        });
      }
    },
    [shortlistedIds],
  );

  return { shortlistedIds, isLoading, toggle };
}
