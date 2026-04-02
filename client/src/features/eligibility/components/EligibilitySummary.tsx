import type { EligibilityResult } from '@scout-grants/shared';
import { EligibilityVerdictBadge } from './EligibilityVerdictBadge';
import { CriterionRow } from './CriterionRow';

interface EligibilitySummaryProps {
  result: EligibilityResult;
  grantSourceUrl: string;
}

export function EligibilitySummary({ result, grantSourceUrl }: EligibilitySummaryProps): React.ReactElement {
  const metCount = result.criteriaResults.filter((c) => c.status === 'MET').length;
  const notMetCount = result.criteriaResults.filter((c) => c.status === 'NOT_MET').length;
  const unclearCount = result.criteriaResults.filter((c) => c.status === 'UNCLEAR').length;

  return (
    <section className="eligibility-summary" aria-label="Eligibility assessment">
      <div className="eligibility-summary__verdict">
        <EligibilityVerdictBadge verdict={result.verdict} />
        <p className="eligibility-summary__verdict-note">
          This verdict is advisory — you can still apply regardless of this assessment.
        </p>
      </div>

      <section className="eligibility-summary__counts" aria-label="Criteria summary">
        <span className="criteria-count criteria-count--met">{metCount} met</span>
        {notMetCount > 0 && (
          <span className="criteria-count criteria-count--not-met">{notMetCount} not met</span>
        )}
        {unclearCount > 0 && (
          <span className="criteria-count criteria-count--unclear">{unclearCount} unclear</span>
        )}
      </section>

      <ul className="criterion-list" aria-label="Eligibility criteria">
        {result.criteriaResults.map((criterion) => (
          <CriterionRow key={criterion.criterionId} criterion={criterion} />
        ))}
      </ul>

      <p className="eligibility-summary__verify">
        Always verify eligibility criteria at the{' '}
        <a
          href={grantSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
          aria-label="Visit grant website (opens in new tab)"
        >
          grant source
        </a>{' '}
        before applying.
      </p>
    </section>
  );
}
