import { useState, useEffect, useCallback } from 'react';
import type { AgentStatus } from '../services/agentApi';
import { agentApi } from '../services/agentApi';

interface UseAgentStatusResult {
  status: AgentStatus | null;
  isRunning: boolean;
  triggerRun: () => Promise<void>;
  error: string | null;
}

const POLL_INTERVAL_MS = 5000;

export function useAgentStatus(onRunComplete?: () => void): UseAgentStatusResult {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasRunning, setWasRunning] = useState(false);

  const isRunning = status?.lastRun?.status === 'RUNNING';

  // Only poll while a run is active. Once the status is terminal (or unknown),
  // polling stops until the user triggers a new run (which resets shouldPoll).
  const [shouldPoll, setShouldPoll] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus(): Promise<void> {
      try {
        const data = await agentApi.getStatus();
        if (cancelled) return;
        setStatus(data);

        const running = data.lastRun?.status === 'RUNNING';
        if (wasRunning && !running) {
          onRunComplete?.();
          setShouldPoll(false);
        }
        setWasRunning(running);
      } catch {
        // Status fetch errors are non-critical; don't surface to user
      }
    }

    void fetchStatus();

    if (!shouldPoll) return;

    const interval = setInterval(() => void fetchStatus(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [wasRunning, onRunComplete, shouldPoll]);

  const triggerRun = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await agentApi.triggerRun();
      // Re-enable polling and immediately reflect RUNNING state
      setShouldPoll(true);
      const fresh = await agentApi.getStatus();
      setStatus(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
    }
  }, []);

  return { status, isRunning, triggerRun, error };
}
