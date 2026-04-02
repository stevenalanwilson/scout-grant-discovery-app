import type { FundingPurpose } from './group';
import type { EligibilityCriterion } from './eligibility';

export type GrantStatus = 'NEW' | 'UPDATED' | 'ACTIVE' | 'MAY_HAVE_CLOSED' | 'EXPIRED';

export interface Grant {
  readonly id: string;
  readonly groupId: string;
  readonly sourceId: string;
  readonly name: string;
  readonly funder: string;
  readonly description: string | null;
  readonly fundingPurposes: readonly FundingPurpose[];
  readonly awardMin: number | null;
  readonly awardMax: number | null;
  readonly awardTypical: number | null;
  readonly eligibilityCriteria: readonly EligibilityCriterion[] | null;
  readonly geographicScope: string | null;
  readonly deadline: string | null;
  readonly sourceUrl: string;
  readonly retrievedAt: string;
  readonly status: GrantStatus;
  readonly detailsIncomplete: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
