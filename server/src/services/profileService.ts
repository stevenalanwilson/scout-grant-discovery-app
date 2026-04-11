import type { Group } from '@scout-grants/shared';
import { groupRepository } from '../repositories/groupRepository';
import { mapGroup } from '../types/mappers';
import type { AppError } from '../middleware/errorHandler';
import type { CreateGroupBody, UpdateGroupBody } from '../types/schemas';
import { lookupPostcode } from './postcodeService';

export type CharityJurisdiction = 'england-wales' | 'scotland' | 'northern-ireland' | 'unknown';

export interface CharityValidationResult {
  readonly valid: boolean;
  readonly jurisdiction: CharityJurisdiction;
  readonly message: string | null;
}

export function validateCharityNumberFormat(charityNumber: string): CharityValidationResult {
  const trimmed = charityNumber.trim().toUpperCase();

  if (/^SC\d{6}$/.test(trimmed)) {
    return {
      valid: true,
      jurisdiction: 'scotland',
      message: 'Scottish charities are not verified against the England & Wales register.',
    };
  }

  if (/^NI\d{6}$/.test(trimmed)) {
    return {
      valid: true,
      jurisdiction: 'northern-ireland',
      message: 'Northern Irish charities are not verified against the England & Wales register.',
    };
  }

  if (/^\d{6,8}$/.test(trimmed)) {
    return { valid: true, jurisdiction: 'england-wales', message: null };
  }

  return {
    valid: false,
    jurisdiction: 'unknown',
    message:
      'Charity number format not recognised. England & Wales: 6–8 digits. Scotland: SC + 6 digits. Northern Ireland: NI + 6 digits.',
  };
}

function makeNotFoundError(): AppError {
  const err: AppError = new Error('Profile not found');
  err.status = 404;
  return err;
}

function makeConflictError(): AppError {
  const err: AppError = new Error('A profile already exists');
  err.status = 409;
  return err;
}

export const profileService = {
  async getProfile(): Promise<Group | null> {
    const group = await groupRepository.findFirst();
    return group ? mapGroup(group) : null;
  },

  async createProfile(input: CreateGroupBody): Promise<Group> {
    const existing = await groupRepository.findFirst();
    if (existing) throw makeConflictError();

    const postcodeData = await lookupPostcode(input.postcode);

    const group = await groupRepository.create({
      name: input.name,
      membershipNumber: input.membershipNumber,
      charityNumber: input.charityNumber ?? null,
      postcode: input.postcode.trim().toUpperCase(),
      region: postcodeData.region,
      sections: [...input.sections],
      membershipCount: input.membershipCount,
      fundingPurposes: [...input.fundingPurposes],
      additionalContext: input.additionalContext ?? null,
      deprivationFlag: postcodeData.deprivationFlag,
      ruralFlag: postcodeData.ruralFlag,
      imdDecile: postcodeData.imdDecile,
      localAuthority: postcodeData.localAuthority,
      parliamentaryConstituency: postcodeData.parliamentaryConstituency,

      legalStructure: input.legalStructure ?? null,
      registeredWithCharityCommission: input.registeredWithCharityCommission ?? null,
      yearEstablished: input.yearEstablished ?? null,
      constitutionInPlace: input.constitutionInPlace ?? null,
      bankAccountInGroupName: input.bankAccountInGroupName ?? null,

      communityServed: input.communityServed ?? null,

      annualIncome: input.annualIncome ?? null,
      annualExpenditure: input.annualExpenditure ?? null,
      financialYearEnd: input.financialYearEnd ?? null,
      hasCurrentAccounts: input.hasCurrentAccounts ?? null,
      currentGrantsHeld: input.currentGrantsHeld ?? null,
      largestSingleFunderPercentage: input.largestSingleFunderPercentage ?? null,

      safeguardingPolicyInPlace: input.safeguardingPolicyInPlace ?? null,
      safeguardingPolicyReviewedWithin12Months:
        input.safeguardingPolicyReviewedWithin12Months ?? null,
      equalitiesPolicyInPlace: input.equalitiesPolicyInPlace ?? null,
      publicLiabilityInsurance: input.publicLiabilityInsurance ?? null,
      numberOfTrustees: input.numberOfTrustees ?? null,
      trusteesAreUnrelated: input.trusteesAreUnrelated ?? null,
      hasOutstandingMonitoringReports: input.hasOutstandingMonitoringReports ?? null,

      volunteerCount: input.volunteerCount ?? null,
      percentageFreeSchoolMeals: input.percentageFreeSchoolMeals ?? null,
      percentageDisabledOrSEND: input.percentageDisabledOrSEND ?? null,
      specificProjectDescription: input.specificProjectDescription ?? null,
      estimatedProjectCost: input.estimatedProjectCost ?? null,
      staffOrPaidWorkers: input.staffOrPaidWorkers ?? null,
    });

    return mapGroup(group);
  },

  async updateProfile(input: UpdateGroupBody): Promise<Group> {
    const existing = await groupRepository.findFirst();
    if (!existing) throw makeNotFoundError();

    const data: Record<string, unknown> = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.membershipNumber !== undefined) data.membershipNumber = input.membershipNumber;
    if (input.charityNumber !== undefined) data.charityNumber = input.charityNumber;
    if (input.sections !== undefined) data.sections = [...input.sections];
    if (input.membershipCount !== undefined) data.membershipCount = input.membershipCount;
    if (input.fundingPurposes !== undefined) data.fundingPurposes = [...input.fundingPurposes];
    if (input.additionalContext !== undefined) data.additionalContext = input.additionalContext;
    if (input.deprivationOverride !== undefined)
      data.deprivationOverride = input.deprivationOverride;
    if (input.deprivationOverrideReason !== undefined)
      data.deprivationOverrideReason = input.deprivationOverrideReason;
    if (input.ruralOverride !== undefined) data.ruralOverride = input.ruralOverride;
    if (input.ruralOverrideReason !== undefined)
      data.ruralOverrideReason = input.ruralOverrideReason;

    // Category 1
    if (input.legalStructure !== undefined) data.legalStructure = input.legalStructure;
    if (input.registeredWithCharityCommission !== undefined)
      data.registeredWithCharityCommission = input.registeredWithCharityCommission;
    if (input.yearEstablished !== undefined) data.yearEstablished = input.yearEstablished;
    if (input.constitutionInPlace !== undefined) data.constitutionInPlace = input.constitutionInPlace;
    if (input.bankAccountInGroupName !== undefined)
      data.bankAccountInGroupName = input.bankAccountInGroupName;

    // Category 2 (user-provided)
    if (input.communityServed !== undefined) data.communityServed = input.communityServed;

    // Category 3
    if (input.annualIncome !== undefined) data.annualIncome = input.annualIncome;
    if (input.annualExpenditure !== undefined) data.annualExpenditure = input.annualExpenditure;
    if (input.financialYearEnd !== undefined) data.financialYearEnd = input.financialYearEnd;
    if (input.hasCurrentAccounts !== undefined) data.hasCurrentAccounts = input.hasCurrentAccounts;
    if (input.currentGrantsHeld !== undefined) data.currentGrantsHeld = input.currentGrantsHeld;
    if (input.largestSingleFunderPercentage !== undefined)
      data.largestSingleFunderPercentage = input.largestSingleFunderPercentage;

    // Category 4
    if (input.safeguardingPolicyInPlace !== undefined)
      data.safeguardingPolicyInPlace = input.safeguardingPolicyInPlace;
    if (input.safeguardingPolicyReviewedWithin12Months !== undefined)
      data.safeguardingPolicyReviewedWithin12Months =
        input.safeguardingPolicyReviewedWithin12Months;
    if (input.equalitiesPolicyInPlace !== undefined)
      data.equalitiesPolicyInPlace = input.equalitiesPolicyInPlace;
    if (input.publicLiabilityInsurance !== undefined)
      data.publicLiabilityInsurance = input.publicLiabilityInsurance;
    if (input.numberOfTrustees !== undefined) data.numberOfTrustees = input.numberOfTrustees;
    if (input.trusteesAreUnrelated !== undefined)
      data.trusteesAreUnrelated = input.trusteesAreUnrelated;
    if (input.hasOutstandingMonitoringReports !== undefined)
      data.hasOutstandingMonitoringReports = input.hasOutstandingMonitoringReports;

    // Category 5
    if (input.volunteerCount !== undefined) data.volunteerCount = input.volunteerCount;
    if (input.percentageFreeSchoolMeals !== undefined)
      data.percentageFreeSchoolMeals = input.percentageFreeSchoolMeals;
    if (input.percentageDisabledOrSEND !== undefined)
      data.percentageDisabledOrSEND = input.percentageDisabledOrSEND;
    if (input.specificProjectDescription !== undefined)
      data.specificProjectDescription = input.specificProjectDescription;
    if (input.estimatedProjectCost !== undefined)
      data.estimatedProjectCost = input.estimatedProjectCost;
    if (input.staffOrPaidWorkers !== undefined) data.staffOrPaidWorkers = input.staffOrPaidWorkers;

    if (input.postcode !== undefined) {
      const postcodeData = await lookupPostcode(input.postcode);
      data.postcode = input.postcode.trim().toUpperCase();
      data.region = postcodeData.region;
      data.imdDecile = postcodeData.imdDecile;
      data.localAuthority = postcodeData.localAuthority;
      data.parliamentaryConstituency = postcodeData.parliamentaryConstituency;
      // Only update deprivation/rural flags if not manually overridden
      if (input.deprivationOverride === undefined) {
        data.deprivationFlag = postcodeData.deprivationFlag;
      }
      if (input.ruralOverride === undefined) data.ruralFlag = postcodeData.ruralFlag;
    }

    const group = await groupRepository.update(existing.id, data);
    return mapGroup(group);
  },
};
