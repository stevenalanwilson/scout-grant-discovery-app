import type { CriterionResult } from '@scout-grants/shared';

const STATUS_CONFIG: Record<
  CriterionResult['status'],
  { icon: string; label: string; className: string }
> = {
  MET: { icon: '✓', label: 'Met', className: 'criterion--met' },
  NOT_MET: { icon: '✗', label: 'Not met', className: 'criterion--not-met' },
  UNCLEAR: { icon: '?', label: 'Unclear', className: 'criterion--unclear' },
};

interface CriterionRowProps {
  criterion: CriterionResult;
}

export function CriterionRow({ criterion }: CriterionRowProps): React.ReactElement {
  const { icon, label, className } = STATUS_CONFIG[criterion.status];

  return (
    <li className={`criterion-row ${className}`}>
      <span className="criterion-row__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="criterion-row__body">
        <div className="criterion-row__header">
          <span className="criterion-row__description">{criterion.description}</span>
          <span className="criterion-row__status-label" aria-label={label}>
            {label}
          </span>
        </div>
        <p className="criterion-row__requirement">{criterion.requirement}</p>
        <p className="criterion-row__explanation">{criterion.explanation}</p>
      </div>
    </li>
  );
}
