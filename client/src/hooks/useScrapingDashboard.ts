import { useState, useEffect, useCallback } from 'react';
import type { ScrapeRunSummary, SourceStatus } from '@scout-grants/shared';
import { adminApi } from '../services/adminApi';

interface UseScrapingDashboardResult {
  history: ScrapeRunSummary[] | null;
  sources: SourceStatus[] | null;
  isLoading: boolean;
  historyError: string | null;
  sourcesError: string | null;
}

const POLL_INTERVAL_MS = 10_000;

export function useScrapingDashboard(isRunning: boolean): UseScrapingDashboardResult {
  const [history, setHistory] = useState<ScrapeRunSummary[] | null>(null);
  const [sources, setSources] = useState<SourceStatus[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (): Promise<void> => {
    try {
      const data = await adminApi.getScrapeHistory();
      setHistory(data.runs as ScrapeRunSummary[]);
      setHistoryError(null);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load run history');
    }
  }, []);

  const fetchSources = useCallback(async (): Promise<void> => {
    try {
      const data = await adminApi.getScrapeSourceStatus();
      setSources(data.sources as SourceStatus[]);
      setSourcesError(null);
    } catch (err) {
      setSourcesError(err instanceof Error ? err.message : 'Failed to load sources');
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchHistory(), fetchSources()]).finally(() => setIsLoading(false));
  }, [fetchHistory, fetchSources]);

  // Poll history while a run is active
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => void fetchHistory(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isRunning, fetchHistory]);

  // Re-fetch everything when a run finishes
  useEffect(() => {
    if (isRunning) return;
    void fetchHistory();
    void fetchSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  return { history, sources, isLoading, historyError, sourcesError };
}
