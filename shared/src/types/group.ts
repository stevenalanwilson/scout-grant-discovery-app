export type Section = 'SQUIRRELS' | 'BEAVERS' | 'CUBS' | 'SCOUTS' | 'EXPLORERS' | 'NETWORK';

export type FundingPurpose =
  | 'EQUIPMENT'
  | 'ACTIVITIES'
  | 'INCLUSION'
  | 'FACILITIES'
  | 'COMMUNITY'
  | 'WELLBEING';

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
}

export interface UpdateGroupInput extends Partial<CreateGroupInput> {
  readonly deprivationOverride?: boolean | null;
  readonly deprivationOverrideReason?: string | null;
  readonly ruralOverride?: boolean | null;
  readonly ruralOverrideReason?: string | null;
}
