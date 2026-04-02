import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EligibilitySummary } from './EligibilitySummary';
import type { EligibilityResult } from '@scout-grants/shared';

function makeResult(overrides: Partial<EligibilityResult> = {}): EligibilityResult {
  return {
    id: 'el1',
    grantId: 'g1',
    groupId: 'grp1',
    verdict: 'LIKELY_ELIGIBLE',
    criteriaResults: [
      {
        criterionId: 'registered-charity',
        description: 'Must be a registered charity',
        requirement: 'Organisation must be registered with the Charity Commission',
        groupValue: 'Registered: 1234567',
        status: 'MET',
        explanation: 'Your group has charity number 1234567.',
      },
      {
        criterionId: 'geographic',
        description: 'Must operate in East Midlands',
        requirement: 'Applicant must be based in the East Midlands region',
        groupValue: 'East Midlands',
        status: 'MET',
        explanation: 'Your postcode is in the East Midlands.',
      },
    ],
    supplementaryAnswers: null,
    assessedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('EligibilitySummary', () => {
  it('renders the overall verdict', () => {
    render(<EligibilitySummary result={makeResult()} grantSourceUrl="https://example.com" />);
    expect(screen.getByText('Likely eligible')).toBeInTheDocument();
  });

  it('renders PARTIAL verdict', () => {
    render(
      <EligibilitySummary result={makeResult({ verdict: 'PARTIAL' })} grantSourceUrl="https://example.com" />,
    );
    expect(screen.getByText('Partial — review needed')).toBeInTheDocument();
  });

  it('renders LIKELY_INELIGIBLE verdict', () => {
    render(
      <EligibilitySummary
        result={makeResult({ verdict: 'LIKELY_INELIGIBLE' })}
        grantSourceUrl="https://example.com"
      />,
    );
    expect(screen.getByText('Likely ineligible')).toBeInTheDocument();
  });

  it('shows correct criteria counts', () => {
    render(<EligibilitySummary result={makeResult()} grantSourceUrl="https://example.com" />);
    expect(screen.getByText('2 met')).toBeInTheDocument();
  });

  it('shows not-met count when criteria are not met', () => {
    const result = makeResult({
      criteriaResults: [
        {
          criterionId: 'c1',
          description: 'Registered charity',
          requirement: 'Must be registered',
          groupValue: 'Not registered',
          status: 'NOT_MET',
          explanation: 'Your group is not a registered charity.',
        },
      ],
      verdict: 'LIKELY_INELIGIBLE',
    });
    render(<EligibilitySummary result={result} grantSourceUrl="https://example.com" />);
    expect(screen.getByText('1 not met')).toBeInTheDocument();
  });

  it('renders each criterion description', () => {
    render(<EligibilitySummary result={makeResult()} grantSourceUrl="https://example.com" />);
    expect(screen.getByText('Must be a registered charity')).toBeInTheDocument();
    expect(screen.getByText('Must operate in East Midlands')).toBeInTheDocument();
  });

  it('renders each criterion explanation', () => {
    render(<EligibilitySummary result={makeResult()} grantSourceUrl="https://example.com" />);
    expect(screen.getByText('Your group has charity number 1234567.')).toBeInTheDocument();
  });

  it('renders the advisory note', () => {
    render(<EligibilitySummary result={makeResult()} grantSourceUrl="https://example.com" />);
    expect(screen.getByText(/advisory/i)).toBeInTheDocument();
  });

  it('renders a link to the grant source', () => {
    render(
      <EligibilitySummary result={makeResult()} grantSourceUrl="https://example.com/grant" />,
    );
    const link = screen.getByRole('link', { name: /visit grant website/i });
    expect(link).toHaveAttribute('href', 'https://example.com/grant');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
