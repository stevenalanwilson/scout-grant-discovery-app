export interface ExtractedCriterion {
  readonly id: string;
  readonly description: string;
  readonly requirement: string;
}

export interface ExtractedGrant {
  readonly name: string;
  readonly funder: string;
  readonly description: string | null;
  readonly fundingPurposes: readonly string[];
  readonly awardMin: number | null;
  readonly awardMax: number | null;
  readonly awardTypical: number | null;
  readonly eligibilityCriteria: readonly ExtractedCriterion[] | null;
  readonly geographicScope: string | null;
  readonly deadline: string | null;
  readonly sourceUrl: string;
  readonly detailsIncomplete: boolean;
}
