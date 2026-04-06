import { useState, useEffect, useCallback } from 'react';
import type { EligibilityResultSummary, EligibilityStatsResponse } from '@scout-grants/shared';
import { adminApi } from '../services/adminApi';

interface UseEligibilityDashboardResult {
  recentResults: EligibilityResultSummary[] | null;
  stats: EligibilityStatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useEligibilityDashboard(): UseEligibilityDashboardResult {
  const [recentResults, setRecentResults] = useState<EligibilityResultSummary[] | null>(null);
  const [stats, setStats] = useState<EligibilityStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (): Promise<void> => {
    try {
      const [recentData, statsData] = await Promise.all([
        adminApi.getRecentEligibility(),
        adminApi.getEligibilityStats(),
      ]);
      setRecentResults(recentData.results as EligibilityResultSummary[]);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load eligibility data');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void fetchAll().finally(() => setIsLoading(false));
  }, [fetchAll]);

  useEffect(() => {
    window.addEventListener('focus', fetchAll);
    return () => window.removeEventListener('focus', fetchAll);
  }, [fetchAll]);

  return { recentResults, stats, isLoading, error };
}
