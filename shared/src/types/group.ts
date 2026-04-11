export type Section = 'SQUIRRELS' | 'BEAVERS' | 'CUBS' | 'SCOUTS' | 'EXPLORERS' | 'NETWORK';

export type FundingPurpose =
  | 'EQUIPMENT'
  | 'ACTIVITIES'
  | 'INCLUSION'
  | 'FACILITIES'
  | 'COMMUNITY'
  | 'WELLBEING';

export const LEGAL_STRUCTURES = [
  'UNINCORPORATED_ASSOCIATION',
  'CHARITABLE_INCORPORATED_ORGANISATION',
  'CHARITABLE_COMPANY_LIMITED_BY_GUARANTEE',
  'COMMUNITY_INTEREST_COMPANY',
  'OTHER',
] as const;

export type LegalStructure = (typeof LEGAL_STRUCTURES)[number];

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly membershipNumber: string;
  readonly charityNumber: string | null;
  readonly postcode: string;
  readonly region: string | null;
  readonly sections: readonly Section[];
  readonly membershipCount: number;
  readonly fundingPurposes: readonly FundingPurpose[];
  readonly additionalContext: string | null;
  readonly deprivationFlag: boolean | null;
  readonly deprivationOverride: boolean | null;
  readonly deprivationOverrideReason: string | null;
  readonly ruralFlag: boolean | null;
  readonly ruralOverride: boolean | null;
  readonly ruralOverrideReason: string | null;

  // Category 1: Identity & registration
  readonly legalStructure: LegalStructure | null;
  readonly registeredWithCharityCommission: boolean | null;
  readonly yearEstablished: number | null;
  readonly constitutionInPlace: boolean | null;
  readonly bankAccountInGroupName: boolean | null;

  // Category 2: Location & community
  readonly imdDecile: number | null;
  readonly localAuthority: string | null;
  readonly parliamentaryConstituency: string | null;
  readonly communityServed: string | null;

  // Category 3: Financial profile
  readonly annualIncome: number | null;
  readonly annualExpenditure: number | null;
  readonly financialYearEnd: string | null;
  readonly hasCurrentAccounts: boolean | null;
  readonly currentGrantsHeld: number | null;
  readonly largestSingleFunderPercentage: number | null;

  // Category 4: Governance & compliance
  readonly safeguardingPolicyInPlace: boolean | null;
  readonly safeguardingPolicyReviewedWithin12Months: boolean | null;
  readonly equalitiesPolicyInPlace: boolean | null;
  readonly publicLiabilityInsurance: boolean | null;
  readonly numberOfTrustees: number | null;
  readonly trusteesAreUnrelated: boolean | null;
  readonly hasOutstandingMonitoringReports: boolean | null;

  // Category 5: Programme & beneficiary
  readonly volunteerCount: number | null;
  readonly percentageFreeSchoolMeals: number | null;
  readonly percentageDisabledOrSEND: number | null;
  readonly specificProjectDescription: string | null;
  readonly estimatedProjectCost: number | null;
  readonly staffOrPaidWorkers: boolean | null;

  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateGroupInput {
  readonly name: string;
  readonly membershipNumber: string;
  readonly charityNumber?: string | null;
  readonly postcode: string;
  readonly sections: readonly Section[];
  readonly membershipCount: number;
  readonly fundingPurposes: readonly FundingPurpose[];
  readonly additionalContext?: string | null;

  // Category 1
  readonly legalStructure?: LegalStructure | null;
  readonly registeredWithCharityCommission?: boolean | null;
  readonly yearEstablished?: number | null;
  readonly constitutionInPlace?: boolean | null;
  readonly bankAccountInGroupName?: boolean | null;

  // Category 2
  readonly communityServed?: string | null;

  // Category 3
  readonly annualIncome?: number | null;
  readonly annualExpenditure?: number | null;
  readonly financialYearEnd?: string | null;
  readonly hasCurrentAccounts?: boolean | null;
  readonly currentGrantsHeld?: number | null;
  readonly largestSingleFunderPercentage?: number | null;

  // Category 4
  readonly safeguardingPolicyInPlace?: boolean | null;
  readonly safeguardingPolicyReviewedWithin12Months?: boolean | null;
  readonly equalitiesPolicyInPlace?: boolean | null;
  readonly publicLiabilityInsurance?: boolean | null;
  readonly numberOfTrustees?: number | null;
  readonly trusteesAreUnrelated?: boolean | null;
  readonly hasOutstandingMonitoringReports?: boolean | null;

  // Category 5
  readonly volunteerCount?: number | null;
  readonly percentageFreeSchoolMeals?: number | null;
  readonly percentageDisabledOrSEND?: number | null;
  readonly specificProjectDescription?: string | null;
  readonly estimatedProjectCost?: number | null;
  readonly staffOrPaidWorkers?: boolean | null;
}

export interface UpdateGroupInput extends Partial<CreateGroupInput> {
  readonly deprivationOverride?: boolean | null;
  readonly deprivationOverrideReason?: string | null;
  readonly ruralOverride?: boolean | null;
  readonly ruralOverrideReason?: string | null;
}
