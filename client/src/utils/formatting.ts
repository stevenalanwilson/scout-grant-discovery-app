export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAwardRange(
  min: number | null,
  max: number | null,
  typical: number | null,
): string {
  if (min === null && max === null) {
    return typical !== null ? `Typically ${formatCurrency(typical)}` : 'Amount not published';
  }
  if (min !== null && max !== null) {
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  }
  if (max !== null) return `Up to ${formatCurrency(max)}`;
  if (min !== null) return `From ${formatCurrency(min)}`;
  return 'Amount not published';
}

export function formatRelativeDate(isoDate: string): string {
  const diff = Math.round((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return 'last week';
  const weeks = Math.round(diff / 7);
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.round(diff / 30);
  return `${months} month${months !== 1 ? 's' : ''} ago`;
}

export function formatTimeUntil(isoDate: string): string {
  const diff = Math.round((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'soon';
  if (diff === 1) return 'tomorrow';
  if (diff < 7) return `in ${diff} days`;
  if (diff < 14) return 'next week';
  const weeks = Math.round(diff / 7);
  if (weeks < 5) return `in ${weeks} weeks`;
  const months = Math.round(diff / 30);
  return `in ${months} month${months !== 1 ? 's' : ''}`;
}

export function formatDeadlineDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function daysUntilDeadline(isoDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(isoDate);
  deadline.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export type DeadlineUrgency = 'urgent' | 'soon' | 'ok' | 'expired';

export function getDeadlineUrgency(isoDate: string): DeadlineUrgency {
  const days = daysUntilDeadline(isoDate);
  if (days < 0) return 'expired';
  if (days <= 14) return 'urgent';
  if (days <= 30) return 'soon';
  return 'ok';
}
