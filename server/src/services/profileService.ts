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

    const { region, deprivationFlag, ruralFlag } = await lookupPostcode(input.postcode);

    const group = await groupRepository.create({
      name: input.name,
      membershipNumber: input.membershipNumber,
      charityNumber: input.charityNumber ?? null,
      postcode: input.postcode.trim().toUpperCase(),
      region,
      sections: [...input.sections],
      membershipCount: input.membershipCount,
      fundingPurposes: [...input.fundingPurposes],
      additionalContext: input.additionalContext ?? null,
      deprivationFlag,
      ruralFlag,
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
    if (input.deprivationOverride !== undefined) data.deprivationOverride = input.deprivationOverride;
    if (input.deprivationOverrideReason !== undefined)
      data.deprivationOverrideReason = input.deprivationOverrideReason;
    if (input.ruralOverride !== undefined) data.ruralOverride = input.ruralOverride;
    if (input.ruralOverrideReason !== undefined) data.ruralOverrideReason = input.ruralOverrideReason;

    if (input.postcode !== undefined) {
      const postcodeData = await lookupPostcode(input.postcode);
      data.postcode = input.postcode.trim().toUpperCase();
      data.region = postcodeData.region;
      // Only update flags if not manually overridden
      if (input.deprivationOverride === undefined) data.deprivationFlag = postcodeData.deprivationFlag;
      if (input.ruralOverride === undefined) data.ruralFlag = postcodeData.ruralFlag;
    }

    const group = await groupRepository.update(existing.id, data);
    return mapGroup(group);
  },
};
