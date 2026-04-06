import type { AgentProgress } from '@scout-grants/shared';

interface SearchProgressNoticeProps {
  progress: AgentProgress | null;
}

export function SearchProgressNotice({ progress }: SearchProgressNoticeProps): React.ReactElement {
  let headline: string;
  let detail: string;

  if (!progress || progress.phase === 'searching') {
    const sourceName = progress?.currentSource ?? null;
    headline = sourceName ? `Searching ${sourceName}…` : 'Starting search…';
    const done = progress?.sourcesSearched ?? 0;
    const total = progress?.sourcesTotal ?? 0;
    const found = progress?.grantsFound ?? 0;
    detail =
      total > 0
        ? `${done} of ${total} sources searched · ${found} grant${found !== 1 ? 's' : ''} found so far`
        : 'Preparing…';
  } else {
    const { grantsTotal, grantsValidated, grantsVerified, grantsRuledOut } = progress;
    headline = `Checking eligibility for ${grantsTotal} grant${grantsTotal !== 1 ? 's' : ''}…`;
    const parts: string[] = [`${grantsValidated} of ${grantsTotal} checked`];
    if (grantsVerified > 0) parts.push(`${grantsVerified} looking promising`);
    if (grantsRuledOut > 0) parts.push(`${grantsRuledOut} ruled out`);
    detail = parts.join(' · ');
  }

  return (
    <div className="search-progress-notice" role="status" aria-live="polite">
      <div className="search-progress-notice__headline">
        <span className="spinner" aria-hidden="true" />
        {headline}
      </div>
      <p className="search-progress-notice__detail">{detail}</p>
    </div>
  );
}
