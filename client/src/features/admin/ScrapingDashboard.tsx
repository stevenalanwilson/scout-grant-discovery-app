import type { ScrapeRunSummary, SourceStatus, AgentProgress } from '@scout-grants/shared';
import { useAgentStatus } from '../../hooks/useAgentStatus';
import { useScrapingDashboard } from '../../hooks/useScrapingDashboard';
import { formatRelativeDate, formatDuration } from '../../utils/formatting';

// ─── Section A: Metric cards ──────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
}

function MetricCard({ label, value }: MetricCardProps): React.ReactElement {
  return (
    <div className="grant-card" style={{ flex: '1 1 160px', padding: '1rem' }}>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const STATUS_BADGE_STYLES: Record<ScrapeRunSummary['status'], React.CSSProperties> = {
  SUCCESS: { background: '#e8f5e9', color: '#2e7d32', borderRadius: 4, padding: '2px 8px', fontSize: '0.875rem' },
  FAILED:  { background: '#ffebee', color: '#c62828', borderRadius: 4, padding: '2px 8px', fontSize: '0.875rem' },
  RUNNING: { background: '#fff3e0', color: '#e65100', borderRadius: 4, padding: '2px 8px', fontSize: '0.875rem' },
  RETRYING:{ background: '#fff3e0', color: '#e65100', borderRadius: 4, padding: '2px 8px', fontSize: '0.875rem' },
};

function StatusBadge({ status }: { status: ScrapeRunSummary['status'] }): React.ReactElement {
  return <span style={STATUS_BADGE_STYLES[status]}>{status}</span>;
}

// ─── Section B: Source grid ───────────────────────────────────────────────────

const STATUS_DOT: Record<SourceStatus['lastRunStatus'], { color: string; label: string }> = {
  success: { color: '#2e7d32', label: 'Success' },
  failed:  { color: '#c62828', label: 'Failed' },
  skipped: { color: '#9e9e9e', label: 'Skipped' },
  unknown: { color: '#9e9e9e', label: 'Unknown' },
};

function SourceCard({ source }: { source: SourceStatus }): React.ReactElement {
  const dot = STATUS_DOT[source.lastRunStatus];
  return (
    <div className="grant-card" style={{ padding: '1rem', opacity: source.active ? 1 : 0.55 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <strong style={{ fontSize: '0.9rem', lineHeight: 1.3 }}>{source.name}</strong>
        <span
          title={`Scope: ${source.scope}`}
          style={{ fontSize: '0.7rem', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {source.scope}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        <span
          aria-label={dot.label}
          style={{ width: 8, height: 8, borderRadius: '50%', background: dot.color, display: 'inline-block', flexShrink: 0 }}
        />
        {dot.label}
        {!source.active && ' · Inactive'}
        {source.grantsExtracted !== null && ` · ${source.grantsExtracted} grants`}
      </div>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}
        aria-label={`Open ${source.name} (opens in new tab)`}
      >
        View source ↗
      </a>
    </div>
  );
}

// ─── Section C: Live pipeline progress ───────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }): React.ReactElement {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: 'var(--color-primary)', height: '100%', transition: 'width 0.4s ease' }} />
    </div>
  );
}

function LiveProgress({ progress }: { progress: AgentProgress }): React.ReactElement {
  const isSearching = progress.phase === 'searching';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Phase 1 */}
      <div style={{ opacity: isSearching ? 1 : 0.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
          <strong>Phase 1 — Searching</strong>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {progress.sourcesSearched} / {progress.sourcesTotal} sources
          </span>
        </div>
        <ProgressBar value={progress.sourcesSearched} max={progress.sourcesTotal} />
        {isSearching && progress.currentSource && (
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Searching {progress.currentSource}…
          </p>
        )}
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {progress.grantsFound} grant{progress.grantsFound !== 1 ? 's' : ''} found so far
        </p>
      </div>

      {/* Phase 2 */}
      <div style={{ opacity: isSearching ? 0.4 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
          <strong>Phase 2 — Validating</strong>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {progress.grantsValidated} / {progress.grantsTotal} grants
          </span>
        </div>
        <ProgressBar value={progress.grantsValidated} max={Math.max(progress.grantsTotal, 1)} />
        {!isSearching && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <span style={{ color: '#2e7d32' }}>✓ {progress.grantsVerified} verified</span>
            <span style={{ color: '#c62828' }}>✕ {progress.grantsRuledOut} ruled out</span>
            <span>{progress.grantsTotal - progress.grantsValidated} remaining</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section D: Run history table ────────────────────────────────────────────

function RunHistoryTable({ runs }: { runs: ScrapeRunSummary[] }): React.ReactElement {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem 0.75rem' }}>Started</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Duration</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Found</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>New</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Error</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                {formatRelativeDate(run.startedAt)}
              </td>
              <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                {formatDuration(run.startedAt, run.completedAt)}
              </td>
              <td style={{ padding: '0.5rem 0.75rem' }}>
                <StatusBadge status={run.status} />
              </td>
              <td style={{ padding: '0.5rem 0.75rem' }}>{run.grantsFoundCount}</td>
              <td style={{ padding: '0.5rem 0.75rem' }}>{run.grantsNewCount}</td>
              <td
                style={{ padding: '0.5rem 0.75rem', color: 'var(--color-error)', maxWidth: 300 }}
                title={run.errorMessage ?? undefined}
              >
                {run.errorMessage ? run.errorMessage.slice(0, 80) + (run.errorMessage.length > 80 ? '…' : '') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScrapingDashboard(): React.ReactElement {
  const { status, isRunning } = useAgentStatus();
  const { history, sources, isLoading, historyError, sourcesError } = useScrapingDashboard(isRunning);

  const lastRun = status?.lastRun ?? null;
  const activeSourceCount = sources?.filter((s) => s.active).length ?? 0;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Scraping Pipeline</h1>
        <p className="page-subtitle">Operator dashboard — grant source visibility.</p>
      </header>

      {isLoading && <p className="loading">Loading dashboard…</p>}

      {!isLoading && (
        <>
          {/* Section A — Metrics */}
          <section aria-label="Summary metrics" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <MetricCard label="Sources active" value={activeSourceCount} />
              <MetricCard label="Grants found (last run)" value={lastRun?.grantsFoundCount ?? '—'} />
              <MetricCard label="New this run" value={lastRun?.grantsNewCount ?? '—'} />
              <MetricCard
                label="Run status"
                value={lastRun ? <StatusBadge status={lastRun.status} /> : <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>No runs yet</span>}
              />
            </div>
          </section>

          {/* Section B — Source grid */}
          <section aria-label="Grant sources" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Sources</h2>
            {sourcesError && (
              <div className="alert alert-error" role="alert">{sourcesError}</div>
            )}
            {sources && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {sources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            )}
          </section>

          {/* Section C — Live progress */}
          {isRunning && lastRun?.progress && (
            <section aria-label="Live pipeline progress" aria-live="polite" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Live progress</h2>
              <div className="grant-card" style={{ padding: '1.25rem' }}>
                <LiveProgress progress={lastRun.progress} />
              </div>
            </section>
          )}

          {/* Section D — Run history */}
          <section aria-label="Run history">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Run history</h2>
            {historyError && (
              <div className="alert alert-error" role="alert">{historyError}</div>
            )}
            {history && history.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)' }}>No runs recorded yet.</p>
            )}
            {history && history.length > 0 && <RunHistoryTable runs={history} />}
          </section>
        </>
      )}
    </div>
  );
}
