import { Link } from 'react-router-dom';
import type { Grant } from '@scout-grants/shared';
import { DeadlineBadge } from './DeadlineBadge';
import { VERDICT_CONFIG } from '../features/eligibility/components/EligibilityVerdictBadge';
import { formatAwardRange, formatRelativeDate } from '../utils/formatting';

interface GrantCardProps {
  grant: Grant;
  isShortlisted?: boolean;
  onShortlistToggle?: (grantId: string) => Promise<void>;
}

const STATUS_LABELS: Partial<Record<Grant['status'], string>> = {
  NEW: 'New',
  UPDATED: 'Updated',
};

export function GrantCard({
  grant,
  isShortlisted,
  onShortlistToggle,
}: GrantCardProps): React.ReactElement {
  const awardRange = formatAwardRange(grant.awardMin, grant.awardMax, grant.awardTypical);
  const statusLabel = STATUS_LABELS[grant.status];
  const checkedLabel = `Checked ${formatRelativeDate(grant.retrievedAt)}`;
  const eligibility = grant.latestEligibility;
  const isIneligible = eligibility?.verdict === 'LIKELY_INELIGIBLE';

  return (
    <article
      className={`grant-card${isIneligible ? ' grant-card--ineligible' : ''}`}
      aria-label={grant.name}
    >
      <div className="grant-card__header">
        <div className="grant-card__title-row">
          <h2 className="grant-card__name">{grant.name}</h2>
          <div className="grant-card__badges">
            {statusLabel && (
              <span
                className={`status-badge status-badge--${grant.status.toLowerCase()}`}
                aria-label={statusLabel}
              >
                {statusLabel}
              </span>
            )}
            {eligibility && (
              <span
                className={`eligibility-badge ${VERDICT_CONFIG[eligibility.verdict].className}`}
                aria-label={VERDICT_CONFIG[eligibility.verdict].label}
              >
                {VERDICT_CONFIG[eligibility.verdict].label}
                {eligibility.notMetCount > 0 && (
                  <span className="eligibility-badge__detail">
                    {' '}
                    — {eligibility.notMetCount} not met
                  </span>
                )}
              </span>
            )}
            {onShortlistToggle && (
              <button
                className={`shortlist-btn ${isShortlisted ? 'shortlist-btn--active' : ''}`}
                onClick={() => void onShortlistToggle(grant.id)}
                aria-label={
                  isShortlisted
                    ? `Remove ${grant.name} from shortlist`
                    : `Add ${grant.name} to shortlist`
                }
                aria-pressed={isShortlisted}
              >
                {isShortlisted ? '★' : '☆'}
              </button>
            )}
          </div>
        </div>
        <p className="grant-card__funder">{grant.funder}</p>
      </div>

      <div className="grant-card__meta">
        <DeadlineBadge deadline={grant.deadline} />
        <span className="grant-card__award">{awardRange}</span>
      </div>

      {grant.status === 'MAY_HAVE_CLOSED' && (
        <p className="grant-card__warning" role="alert">
          This grant may have closed — it was not found in the latest search.
        </p>
      )}

      {grant.detailsIncomplete && (
        <p className="grant-card__incomplete">
          Details incomplete — verify deadline and award amount at source.
        </p>
      )}

      <div className="grant-card__footer">
        <span className="grant-card__checked">{checkedLabel}</span>
        <div className="grant-card__actions">
          <Link
            to={`/grants/${grant.id}?check=true`}
            className="grant-card__eligibility-link"
            aria-label={`Check eligibility for ${grant.name}`}
          >
            Check eligibility
          </Link>
          <a
            href={grant.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grant-card__source-link"
            aria-label={`View source for ${grant.name} (opens in new tab)`}
          >
            View source ↗
          </a>
        </div>
      </div>
    </article>
  );
}
