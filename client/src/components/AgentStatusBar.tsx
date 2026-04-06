import { formatRelativeDate, formatTimeUntil } from '../utils/formatting';
import type { AgentStatus } from '../services/agentApi';

interface AgentStatusBarProps {
  status: AgentStatus | null;
  isRunning: boolean;
  newGrantsCount: number;
  onTriggerRun: () => Promise<void>;
  triggerError: string | null;
}

export function AgentStatusBar({
  status,
  isRunning,
  newGrantsCount,
  onTriggerRun,
  triggerError,
}: AgentStatusBarProps): React.ReactElement {
  const lastRun = status?.lastRun;
  const nextRunAt = status?.nextRunAt;

  let lastRunText: string;
  if (isRunning) {
    lastRunText = 'Search in progress…';
  } else if (!lastRun) {
    lastRunText = 'No searches run yet';
  } else if (lastRun.status === 'FAILED') {
    lastRunText = `Last search encountered an issue — results may be older than expected`;
  } else {
    lastRunText = `Last searched ${formatRelativeDate(lastRun.completedAt ?? lastRun.startedAt)}`;
  }

  return (
    <div className="agent-status-bar" aria-label="Grant search status">
      <div className="agent-status-bar__info">
        <span className="agent-status-bar__last-run">
          {isRunning && <span className="spinner" aria-hidden="true" />}
          {lastRunText}
        </span>
        {newGrantsCount > 0 && !isRunning && (
          <span
            className="agent-status-bar__new-badge"
            aria-label={`${newGrantsCount} new or updated grants`}
          >
            {newGrantsCount} new
          </span>
        )}
        {nextRunAt && !isRunning && (
          <span className="agent-status-bar__next-run">
            Next search {formatTimeUntil(nextRunAt)}
          </span>
        )}
      </div>

      <button
        className="btn btn-secondary agent-status-bar__trigger"
        onClick={onTriggerRun}
        disabled={isRunning}
        aria-label="Search for new grants now"
      >
        {isRunning ? 'Searching…' : 'Search now'}
      </button>

      {triggerError && (
        <p className="agent-status-bar__error" role="alert">
          {triggerError}
        </p>
      )}
    </div>
  );
}
