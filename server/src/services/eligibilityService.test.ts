import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEligibilityResult } from './eligibilityService';
import { eligibilityRepository } from '../repositories/eligibilityRepository';
import { groupRepository } from '../repositories/groupRepository';

vi.mock('../repositories/eligibilityRepository');
vi.mock('../repositories/groupRepository');

const mockGroup = {
  id: 'grp1',
  name: '1st Anywhere Scouts',
  membershipNumber: '40001234',
  charityNumber: '1234567',
  postcode: 'DE1 1AA',
  region: 'East Midlands',
  sections: ['SCOUTS'],
  membershipCount: 30,
  fundingPurposes: ['EQUIPMENT'],
  additionalContext: null,
  deprivationFlag: null,
  deprivationOverride: null,
  deprivationOverrideReason: null,
  ruralFlag: null,
  ruralOverride: null,
  ruralOverrideReason: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockResult = {
  id: 'el1',
  grantId: 'g1',
  groupId: 'grp1',
  verdict: 'LIKELY_ELIGIBLE' as const,
  criteriaResults: [
    {
      criterionId: 'registered-charity',
      description: 'Must be a registered charity',
      requirement: 'Organisation must be registered with the Charity Commission',
      groupValue: 'Registered: 1234567',
      status: 'MET',
      explanation: 'Your group has charity number 1234567, which meets this requirement.',
    },
  ],
  supplementaryAnswers: null,
  assessedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getEligibilityResult', () => {
  it('returns null when no profile exists', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(null);
    const result = await getEligibilityResult('g1');
    expect(result).toBeNull();
  });

  it('returns null when no eligibility result exists for this grant', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(mockGroup);
    vi.mocked(eligibilityRepository.findByGrantAndGroup).mockResolvedValue(null);

    const result = await getEligibilityResult('g1');
    expect(result).toBeNull();
  });

  it('returns a mapped eligibility result when one exists', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(mockGroup);
    vi.mocked(eligibilityRepository.findByGrantAndGroup).mockResolvedValue(mockResult);

    const result = await getEligibilityResult('g1');
    expect(result).not.toBeNull();
    expect(result?.verdict).toBe('LIKELY_ELIGIBLE');
    expect(result?.criteriaResults).toHaveLength(1);
    expect(result?.criteriaResults[0].status).toBe('MET');
    expect(result?.assessedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('calls findByGrantAndGroup with correct ids', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(mockGroup);
    vi.mocked(eligibilityRepository.findByGrantAndGroup).mockResolvedValue(null);

    await getEligibilityResult('g99');
    expect(eligibilityRepository.findByGrantAndGroup).toHaveBeenCalledWith('g99', 'grp1');
  });
});
