import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Grant } from '@scout-grants/shared';
import { grantsApi } from '../../services/grantsApi';
import { useEligibility } from '../../hooks/useEligibility';
import { DeadlineBadge } from '../../components/DeadlineBadge';
import { AiDisclaimer } from '../../components/AiDisclaimer';
import { EligibilitySummary } from '../eligibility/components/EligibilitySummary';
import { SupplementaryQuestions } from '../eligibility/components/SupplementaryQuestions';
import { formatAwardRange, formatRelativeDate } from '../../utils/formatting';

export default function GrantDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [grantLoading, setGrantLoading] = useState(true);
  const [grantError, setGrantError] = useState<string | null>(null);

  const { state: eligibilityState, checkEligibility } = useEligibility(id!);
  const eligibilityResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eligibilityState.phase === 'result' || eligibilityState.phase === 'questions') {
      eligibilityResultRef.current?.focus();
    }
  }, [eligibilityState.phase]);

  useEffect(() => {
    grantsApi
      .get(id!)
      .then(setGrant)
      .catch((err: unknown) =>
        setGrantError(err instanceof Error ? err.message : 'Failed to load grant'),
      )
      .finally(() => setGrantLoading(false));
  }, [id]);

  if (grantLoading) {
    return (
      <div className="page">
        <p className="loading">Loading grant…</p>
      </div>
    );
  }

  if (grantError || !grant) {
    return (
      <div className="page">
        <div className="alert alert-error" role="alert">
          {grantError ?? 'Grant not found'}
        </div>
        <Link to="/grants" className="inline-link">
          ← Back to grants
        </Link>
      </div>
    );
  }

  const awardRange = formatAwardRange(grant.awardMin, grant.awardMax, grant.awardTypical);

  return (
    <div className="page">
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/grants" className="inline-link">
          ← Grants
        </Link>
      </nav>

      <header className="page-header">
        <h1 className="grant-detail__name">{grant.name}</h1>
        <p className="grant-detail__funder">{grant.funder}</p>
      </header>

      <div className="grant-detail__meta">
        <DeadlineBadge deadline={grant.deadline} />
        <span className="grant-detail__award">{awardRange}</span>
      </div>

      {grant.description && <p className="grant-detail__description">{grant.description}</p>}

      {grant.geographicScope && (
        <p className="grant-detail__geo">
          <strong>Geographic scope:</strong> {grant.geographicScope}
        </p>
      )}

      {grant.status === 'MAY_HAVE_CLOSED' && (
        <div className="alert alert-warning" role="alert">
          This grant may have closed — it was not found in the latest search. Check the source link
          below.
        </div>
      )}

      {grant.detailsIncomplete && (
        <div className="alert alert-info" role="note">
          Some details (deadline, award amount) could not be found automatically. Verify at source.
        </div>
      )}

      <div className="grant-detail__source-section">
        <a
          href={grant.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          aria-label="View original grant page (opens in new tab)"
        >
          View grant source ↗
        </a>
        <span className="grant-detail__checked">
          Checked {formatRelativeDate(grant.retrievedAt)}
        </span>
      </div>

      <AiDisclaimer />

      <section className="grant-detail__eligibility">
        <h2>Eligibility check</h2>

        {eligibilityState.phase === 'loading' && <p className="loading">Loading eligibility…</p>}

        {eligibilityState.phase === 'idle' && (
          <div className="eligibility-cta">
            <p>Check whether your group is eligible for this grant based on your profile.</p>
            <button
              className="btn btn-primary"
              onClick={() => void checkEligibility()}
              aria-label="Check eligibility for this grant"
            >
              Check eligibility
            </button>
          </div>
        )}

        {eligibilityState.phase === 'questions' && (
          <div ref={eligibilityResultRef} tabIndex={-1}>
            <SupplementaryQuestions
              questions={eligibilityState.questions}
              onSubmit={(answers) => checkEligibility(answers)}
            />
          </div>
        )}

        {eligibilityState.phase === 'result' && (
          <div ref={eligibilityResultRef} tabIndex={-1}>
            <EligibilitySummary result={eligibilityState.result} grantSourceUrl={grant.sourceUrl} />
          </div>
        )}

        {eligibilityState.phase === 'error' && (
          <div className="alert alert-error" role="alert">
            {eligibilityState.message}
            <button
              className="btn btn-secondary"
              onClick={() => void checkEligibility()}
              style={{ marginLeft: '1rem' }}
              aria-label="Try checking eligibility again"
            >
              Try again
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
