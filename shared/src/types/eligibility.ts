export type EligibilityVerdict = 'LIKELY_ELIGIBLE' | 'PARTIAL' | 'LIKELY_INELIGIBLE';

export type CriterionStatus = 'MET' | 'NOT_MET' | 'UNCLEAR';

export interface EligibilityCriterion {
  readonly id: string;
  readonly description: string;
  readonly requirement: string;
}

export interface CriterionResult {
  readonly criterionId: string;
  readonly description: string;
  readonly requirement: string;
  readonly groupValue: string;
  readonly status: CriterionStatus;
  readonly explanation: string;
}

export interface EligibilityResult {
  readonly id: string;
  readonly grantId: string;
  readonly groupId: string;
  readonly verdict: EligibilityVerdict;
  readonly criteriaResults: readonly CriterionResult[];
  readonly supplementaryAnswers: Readonly<Record<string, string>> | null;
  readonly assessedAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SupplementaryQuestion {
  readonly id: string;
  readonly question: string;
  readonly hint: string | null;
}
