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

export interface EligibilityResultSummary {
  readonly id: string;
  readonly grantId: string;
  readonly grantName: string;
  readonly funder: string;
  readonly verdict: EligibilityVerdict;
  readonly criteriaResults: readonly CriterionResult[];
  readonly assessedAt: string;
}

export interface RecentEligibilityResponse {
  readonly results: readonly EligibilityResultSummary[];
}

export interface CriterionPassRate {
  readonly criterionId: string;
  readonly description: string;
  readonly metCount: number;
  readonly notMetCount: number;
  readonly unclearCount: number;
  readonly passRate: number;
}

export interface EligibilityStatsResponse {
  readonly totalAssessed: number;
  readonly verdictBreakdown: {
    readonly LIKELY_ELIGIBLE: number;
    readonly PARTIAL: number;
    readonly LIKELY_INELIGIBLE: number;
  };
  readonly criterionPassRates: readonly CriterionPassRate[];
}

export interface SupplementaryQuestion {
  readonly id: string;
  readonly question: string;
  readonly hint: string | null;
}
