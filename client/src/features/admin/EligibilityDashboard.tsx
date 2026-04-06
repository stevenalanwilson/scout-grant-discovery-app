import { useState } from 'react';
import type {
  EligibilityResultSummary,
  EligibilityStatsResponse,
  CriterionResult,
  EligibilityVerdict,
  CriterionPassRate,
} from '@scout-grants/shared';
import { useEligibilityDashboard } from '../../hooks/useEligibilityDashboard';
import { formatRelativeDate } from '../../utils/formatting';

// ─── Verdict config ───────────────────────────────────────────────────────────

const VERDICT_STYLE: Record<EligibilityVerdict, { label: string; color: string; bg: string; border: string }> = {
  LIKELY_ELIGIBLE:   { label: 'Likely eligible',   color: 'var(--color-success)',  bg: 'var(--color-success-bg)',  border: 'var(--color-success-border)' },
  PARTIAL:           { label: 'Requires review',   color: 'var(--color-warning)',  bg: 'var(--color-warning-bg)',  border: 'var(--color-warning-border)' },
  LIKELY_INELIGIBLE: { label: 'Likely ineligible', color: 'var(--color-danger)',   bg: 'var(--color-danger-bg)',   border: 'var(--color-danger-border)' },
};

function VerdictBadge({ verdict }: { verdict: EligibilityVerdict }): React.ReactElement {
  const s = VERDICT_STYLE[verdict];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ─── Section A: Metric cards ──────────────────────────────────────────────────

function MetricCard({ label, value, color, bg }: { label: string; value: number; color?: string; bg?: string }): React.ReactElement {
  return (
    <div className="grant-card" style={{ flex: '1 1 150px', padding: '1rem', background: bg ?? 'var(--color-surface)' }}>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</p>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: color ?? 'var(--color-text)' }}>{value}</div>
    </div>
  );
}

// ─── Section B: Agent performance table ──────────────────────────────────────

function passRateColor(rate: number): string {
  if (rate >= 0.7) return 'var(--color-success-border)';
  if (rate >= 0.4) return 'var(--color-warning-border)';
  return 'var(--color-danger-border)';
}

function AgentTable({ rates }: { rates: readonly CriterionPassRate[] }): React.ReactElement {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem 0.75rem' }}>Agent</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Met</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Not met</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Unclear</th>
            <th style={{ padding: '0.5rem 0.75rem', minWidth: 140 }}>Pass rate</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r) => {
            const pct = Math.round(r.passRate * 100);
            const barColor = passRateColor(r.passRate);
            return (
              <tr key={r.criterionId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem 0.75rem' }}>{r.description}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-success)' }}>{r.metCount}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-danger)' }}>{r.notMetCount}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>{r.unclearCount}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, background: 'var(--color-surface)', borderRadius: 3, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: barColor, height: '100%' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', minWidth: 32, color: 'var(--color-text-muted)' }}>{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section C: Pipeline trace ────────────────────────────────────────────────

function synthesiserRule(verdict: EligibilityVerdict, criteria: readonly CriterionResult[]): string {
  if (verdict === 'LIKELY_INELIGIBLE') {
    const blockers = criteria.filter((c) => c.status === 'NOT_MET').map((c) => c.description);
    return `Hard block — ${blockers.join(', ')} not met`;
  }
  if (verdict === 'LIKELY_ELIGIBLE') return 'All-pass — no criteria failed';
  return 'Mixed results — some criteria unclear or not met';
}

function PipelineTrace({ result }: { result: EligibilityResultSummary }): React.ReactElement {
  const { criteriaResults, verdict } = result;
  return (
    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
      {/* Orchestrator */}
      <div style={{ marginBottom: '1rem' }}>
        <strong>1 · Orchestrator</strong>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)' }}>
          Context normalised — grant + group profile supplied to 5 specialist agents in parallel.
        </p>
      </div>

      {/* Agents */}
      <div style={{ marginBottom: '1rem' }}>
        <strong>2 · Specialist agents</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {criteriaResults.map((c) => {
            const statusColor = c.status === 'MET' ? 'var(--color-success)' : c.status === 'NOT_MET' ? 'var(--color-danger)' : 'var(--color-text-muted)';
            const statusIcon = c.status === 'MET' ? '✓' : c.status === 'NOT_MET' ? '✗' : '?';
            return (
              <div key={c.criterionId} style={{ flex: '1 1 140px', border: `1px solid ${statusColor}`, borderRadius: 'var(--radius)', padding: '0.5rem', minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{c.description}</div>
                <div style={{ fontWeight: 700, color: statusColor }}>{statusIcon} {c.status}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Synthesiser */}
      <div style={{ marginBottom: '1rem' }}>
        <strong>3 · Synthesiser</strong>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)' }}>
          {synthesiserRule(verdict, criteriaResults)}
        </p>
      </div>

      {/* Final verdict */}
      <div>
        <strong>4 · Final verdict</strong>
        <div style={{ marginTop: '0.35rem' }}>
          <VerdictBadge verdict={verdict} />
        </div>
      </div>
    </div>
  );
}

// ─── Section C: Expanded criterion detail ─────────────────────────────────────

function CriterionDetail({ c }: { c: CriterionResult }): React.ReactElement {
  const isNotMet = c.status === 'NOT_MET';
  const statusIcon = c.status === 'MET' ? '✓' : c.status === 'NOT_MET' ? '✗' : '?';
  const statusColor = c.status === 'MET' ? 'var(--color-success)' : c.status === 'NOT_MET' ? 'var(--color-danger)' : 'var(--color-text-muted)';
  return (
    <div style={{
      borderLeft: isNotMet ? '3px solid var(--color-danger)' : '3px solid transparent',
      paddingLeft: '0.75rem',
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: 600, color: statusColor }}>{statusIcon}</span>
        <span style={{ fontWeight: 600 }}>{c.description}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
        <span><em>Required:</em> {c.requirement}</span>
        <span><em>Group:</em> {c.groupValue}</span>
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem' }}>{c.explanation}</p>
    </div>
  );
}

// ─── Section C: Assessment list ───────────────────────────────────────────────

function AssessmentList({ results }: { results: EligibilityResultSummary[] }): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {results.map((r) => {
        const isExpanded = expandedId === r.id;
        return (
          <div key={r.id} className="grant-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Collapsed header — always visible */}
            <button
              onClick={() => { setExpandedId(isExpanded ? null : r.id); setShowTrace(null); }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
              aria-expanded={isExpanded}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{r.grantName}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.funder}</span>
              </span>
              <VerdictBadge verdict={r.verdict} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {formatRelativeDate(r.assessedAt)}
              </span>
              {/* Chevron */}
              <span aria-hidden="true" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '1rem' }}>
                {r.criteriaResults.map((c) => (
                  <CriterionDetail key={c.criterionId} c={c} />
                ))}
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    onClick={() => setShowTrace(showTrace === r.id ? null : r.id)}
                  >
                    {showTrace === r.id ? 'Hide trace' : 'Trace pipeline'}
                  </button>
                  {showTrace === r.id && <PipelineTrace result={r} />}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section D: Verdict distribution bar ─────────────────────────────────────

function VerdictBar({ stats }: { stats: EligibilityStatsResponse }): React.ReactElement {
  const { totalAssessed, verdictBreakdown } = stats;
  if (totalAssessed === 0) return <p style={{ color: 'var(--color-text-muted)' }}>No assessments yet.</p>;

  const segments: Array<{ verdict: EligibilityVerdict; count: number }> = [
    { verdict: 'LIKELY_ELIGIBLE',   count: verdictBreakdown.LIKELY_ELIGIBLE },
    { verdict: 'PARTIAL',           count: verdictBreakdown.PARTIAL },
    { verdict: 'LIKELY_INELIGIBLE', count: verdictBreakdown.LIKELY_INELIGIBLE },
  ];

  return (
    <div style={{ display: 'flex', height: 40, borderRadius: 'var(--radius)', overflow: 'hidden', fontSize: '0.8rem', fontWeight: 600 }}>
      {segments.map(({ verdict, count }) => {
        if (count === 0) return null;
        const pct = Math.round((count / totalAssessed) * 100);
        const s = VERDICT_STYLE[verdict];
        return (
          <div
            key={verdict}
            style={{ width: `${pct}%`, background: s.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', transition: 'width 0.4s ease' }}
            title={`${s.label}: ${count} (${pct}%)`}
          >
            {pct > 10 ? `${pct}%` : ''}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EligibilityDashboard(): React.ReactElement {
  const { recentResults, stats, isLoading, error } = useEligibilityDashboard();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Eligibility Pipeline</h1>
        <p className="page-subtitle">Agent decisions, pass rates, and recent assessments.</p>
      </header>

      {isLoading && <p className="loading">Loading dashboard…</p>}

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {!isLoading && stats && (
        <>
          {/* Section A — Metrics */}
          <section aria-label="Summary metrics" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <MetricCard label="Total assessed" value={stats.totalAssessed} />
              <MetricCard label="Likely eligible"   value={stats.verdictBreakdown.LIKELY_ELIGIBLE}   color="var(--color-success)" bg="var(--color-success-bg)" />
              <MetricCard label="Requires review"   value={stats.verdictBreakdown.PARTIAL}            color="var(--color-warning)" bg="var(--color-warning-bg)" />
              <MetricCard label="Likely ineligible" value={stats.verdictBreakdown.LIKELY_INELIGIBLE}  color="var(--color-danger)"  bg="var(--color-danger-bg)" />
            </div>
          </section>

          {/* Section D — Distribution bar (before the detail sections, gives overview) */}
          <section aria-label="Verdict distribution" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Verdict distribution</h2>
            <VerdictBar stats={stats} />
            {stats.totalAssessed > 0 && (
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                {(['LIKELY_ELIGIBLE', 'PARTIAL', 'LIKELY_INELIGIBLE'] as const).map((v) => (
                  <span key={v} style={{ color: VERDICT_STYLE[v].color }}>
                    ■ {VERDICT_STYLE[v].label}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Section B — Agent performance */}
          {stats.criterionPassRates.length > 0 && (
            <section aria-label="Agent performance" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Agent performance</h2>
              <AgentTable rates={stats.criterionPassRates} />
            </section>
          )}
        </>
      )}

      {/* Section C — Recent assessments */}
      {!isLoading && recentResults && (
        <section aria-label="Recent assessments">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            Recent assessments
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
              ({recentResults.length})
            </span>
          </h2>
          {recentResults.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No assessments recorded yet.</p>
          ) : (
            <AssessmentList results={recentResults} />
          )}
        </section>
      )}
    </div>
  );
}
