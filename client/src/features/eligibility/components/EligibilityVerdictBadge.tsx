import type { EligibilityVerdict } from '@scout-grants/shared';

export const VERDICT_CONFIG: Record<EligibilityVerdict, { label: string; className: string }> = {
  LIKELY_ELIGIBLE: { label: 'Likely eligible', className: 'verdict-badge--eligible' },
  PARTIAL: { label: 'Partial — review needed', className: 'verdict-badge--partial' },
  LIKELY_INELIGIBLE: { label: 'Likely ineligible', className: 'verdict-badge--ineligible' },
};

interface EligibilityVerdictBadgeProps {
  verdict: EligibilityVerdict;
}

export function EligibilityVerdictBadge({
  verdict,
}: EligibilityVerdictBadgeProps): React.ReactElement {
  const { label, className } = VERDICT_CONFIG[verdict];
  return (
    <span className={`verdict-badge ${className}`} aria-label={`Eligibility: ${label}`}>
      {label}
    </span>
  );
}
