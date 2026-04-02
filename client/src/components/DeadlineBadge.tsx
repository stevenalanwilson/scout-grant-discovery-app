import { formatDeadlineDate, getDeadlineUrgency, daysUntilDeadline } from '../utils/formatting';

interface DeadlineBadgeProps {
  deadline: string | null;
}

export function DeadlineBadge({ deadline }: DeadlineBadgeProps): React.ReactElement {
  if (!deadline) {
    return <span className="deadline-badge deadline-badge--unknown">Deadline unknown</span>;
  }

  const urgency = getDeadlineUrgency(deadline);
  const days = daysUntilDeadline(deadline);
  const formatted = formatDeadlineDate(deadline);

  let label: string;
  if (urgency === 'expired') {
    label = `Closed ${formatted}`;
  } else if (days === 0) {
    label = `Closes today`;
  } else if (days === 1) {
    label = `Closes tomorrow`;
  } else {
    label = `Closes ${formatted}`;
  }

  return (
    <span className={`deadline-badge deadline-badge--${urgency}`} aria-label={`Deadline: ${label}`}>
      {label}
    </span>
  );
}
