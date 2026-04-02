import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GrantCard } from './GrantCard';
import type { Grant } from '@scout-grants/shared';

function renderCard(grant: Grant): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <GrantCard grant={grant} />
    </MemoryRouter>,
  );
}

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: 'g1',
    groupId: 'grp1',
    sourceId: 'src1',
    name: 'Community Equipment Grant',
    funder: 'Local Council',
    description: 'For buying new equipment',
    fundingPurposes: ['EQUIPMENT'],
    awardMin: 500,
    awardMax: 2000,
    awardTypical: null,
    eligibilityCriteria: null,
    geographicScope: 'East Midlands',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    sourceUrl: 'https://example.com/grant',
    retrievedAt: new Date().toISOString(),
    status: 'ACTIVE',
    detailsIncomplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('GrantCard', () => {
  it('renders grant name and funder', () => {
    renderCard(makeGrant());
    expect(screen.getByText('Community Equipment Grant')).toBeInTheDocument();
    expect(screen.getByText('Local Council')).toBeInTheDocument();
  });

  it('renders award range', () => {
    renderCard(makeGrant({ awardMin: 500, awardMax: 2000 }));
    expect(screen.getByText('£500 – £2,000')).toBeInTheDocument();
  });

  it('renders "Amount not published" when award is unknown', () => {
    renderCard(makeGrant({ awardMin: null, awardMax: null, awardTypical: null }));
    expect(screen.getByText('Amount not published')).toBeInTheDocument();
  });

  it('shows NEW status badge for new grants', () => {
    renderCard(makeGrant({ status: 'NEW' }));
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows UPDATED status badge for updated grants', () => {
    renderCard(makeGrant({ status: 'UPDATED' }));
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('shows no status badge for ACTIVE grants', () => {
    renderCard(makeGrant({ status: 'ACTIVE' }));
    expect(screen.queryByText('New')).not.toBeInTheDocument();
    expect(screen.queryByText('Updated')).not.toBeInTheDocument();
  });

  it('shows warning for MAY_HAVE_CLOSED grants', () => {
    renderCard(makeGrant({ status: 'MAY_HAVE_CLOSED' }));
    expect(screen.getByText(/may have closed/i)).toBeInTheDocument();
  });

  it('shows incomplete indicator when details are incomplete', () => {
    renderCard(makeGrant({ detailsIncomplete: true }));
    expect(screen.getByText(/details incomplete/i)).toBeInTheDocument();
  });

  it('renders source link that opens in a new tab', () => {
    renderCard(makeGrant());
    const link = screen.getByRole('link', { name: /view source/i });
    expect(link).toHaveAttribute('href', 'https://example.com/grant');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows deadline urgency badge in red for grants closing within 14 days', () => {
    const soonDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    renderCard(makeGrant({ deadline: soonDeadline }));
    const badge = document.querySelector('.deadline-badge--urgent');
    expect(badge).toBeInTheDocument();
  });

  it('shows "Deadline unknown" when deadline is null', () => {
    renderCard(makeGrant({ deadline: null }));
    expect(screen.getByText('Deadline unknown')).toBeInTheDocument();
  });
});
