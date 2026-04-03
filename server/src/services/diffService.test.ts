import { describe, it, expect } from 'vitest';
import { diffGrants } from './diffService';
import type { FreshGrant } from './diffService';
import type { Grant } from '@scout-grants/shared';

function makeExisting(overrides: Partial<Grant> = {}): Grant {
  return {
    id: 'g1',
    groupId: 'grp1',
    sourceId: 'src1',
    name: 'Community Grant',
    funder: 'Local Council',
    description: 'Funding for community groups',
    fundingPurposes: ['ACTIVITIES'],
    awardMin: 500,
    awardMax: 2000,
    awardTypical: null,
    eligibilityCriteria: null,
    geographicScope: 'East Midlands',
    deadline: '2026-06-01T00:00:00.000Z',
    sourceUrl: 'https://example.com/grant',
    retrievedAt: '2026-01-01T00:00:00.000Z',
    status: 'ACTIVE',
    detailsIncomplete: false,
    latestEligibility: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeExtracted(overrides: Partial<FreshGrant> = {}): FreshGrant {
  return {
    sourceId: 'src1',
    name: 'Community Grant',
    funder: 'Local Council',
    description: 'Funding for community groups',
    fundingPurposes: ['ACTIVITIES'],
    awardMin: 500,
    awardMax: 2000,
    awardTypical: null,
    eligibilityCriteria: null,
    geographicScope: 'East Midlands',
    deadline: '2026-06-01',
    sourceUrl: 'https://example.com/grant',
    detailsIncomplete: false,
    ...overrides,
  };
}

describe('diffGrants', () => {
  it('marks grants with no existing match as NEW', () => {
    const result = diffGrants([], [makeExtracted()]);
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].status).toBe('NEW');
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toMarkClosed).toHaveLength(0);
  });

  it('marks unchanged existing grants as ACTIVE', () => {
    const existing = makeExisting({
      deadline: '2026-06-01T00:00:00.000Z',
      awardMin: 500,
      awardMax: 2000,
    });
    const fresh = makeExtracted({ deadline: '2026-06-01', awardMin: 500, awardMax: 2000 });

    const result = diffGrants([existing], [fresh]);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toUpdate[0].status).toBe('ACTIVE');
    expect(result.toMarkClosed).toHaveLength(0);
  });

  it('marks grants with changed deadline as UPDATED', () => {
    const existing = makeExisting({ deadline: '2026-06-01T00:00:00.000Z' });
    const fresh = makeExtracted({ deadline: '2026-09-01' });

    const result = diffGrants([existing], [fresh]);
    expect(result.toUpdate[0].status).toBe('UPDATED');
  });

  it('marks grants with changed award amounts as UPDATED', () => {
    const existing = makeExisting({ awardMax: 2000 });
    const fresh = makeExtracted({ awardMax: 5000 });

    const result = diffGrants([existing], [fresh]);
    expect(result.toUpdate[0].status).toBe('UPDATED');
  });

  it('marks existing grants not in fresh results as MAY_HAVE_CLOSED', () => {
    const existing = makeExisting();
    const result = diffGrants([existing], []);
    expect(result.toMarkClosed).toContain('g1');
  });

  it('does not re-flag already MAY_HAVE_CLOSED grants', () => {
    const existing = makeExisting({ status: 'MAY_HAVE_CLOSED' });
    const result = diffGrants([existing], []);
    expect(result.toMarkClosed).toHaveLength(0);
  });

  it('matches by sourceId + normalised name when URL changes', () => {
    // Both default to sourceId='src1', name='Community Grant' — same source, same grant
    const existing = makeExisting({ sourceUrl: 'https://example.com/old-url' });
    const fresh = makeExtracted({ sourceUrl: 'https://example.com/new-url' });

    const result = diffGrants([existing], [fresh]);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toUpdate[0].id).toBe('g1');
  });

  it('does NOT match grants with the same name from different sources', () => {
    const existing = makeExisting({ sourceId: 'src-alpha', sourceUrl: 'https://alpha.com/grant' });
    const fresh = makeExtracted({
      sourceId: 'src-beta',
      sourceUrl: 'https://beta.com/grant', // different URL → no primary match
      name: 'Community Grant', // same name as existing
    });

    const result = diffGrants([existing], [fresh]);
    expect(result.toCreate).toHaveLength(1);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toMarkClosed).toContain('g1');
  });

  it('handles mixed new, updated, and closed grants', () => {
    const existing1 = makeExisting({ id: 'g1', sourceUrl: 'https://example.com/g1' });
    const existing2 = makeExisting({
      id: 'g2',
      sourceUrl: 'https://example.com/g2',
      name: 'Old Grant',
    });

    const fresh1 = makeExtracted({ sourceUrl: 'https://example.com/g1', awardMax: 9999 });
    const fresh3 = makeExtracted({ name: 'Brand New Grant', sourceUrl: 'https://example.com/g3' });

    const result = diffGrants([existing1, existing2], [fresh1, fresh3]);
    expect(result.toCreate).toHaveLength(1);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toUpdate[0].status).toBe('UPDATED');
    expect(result.toMarkClosed).toContain('g2');
  });
});
