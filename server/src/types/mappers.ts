import type { Group as PrismaGroup, Grant as PrismaGrant, AgentRun as PrismaAgentRun } from '@prisma/client';
import type {
  Group,
  Section,
  FundingPurpose,
  Grant,
  GrantStatus,
  AgentRun,
  AgentRunStatus,
} from '@scout-grants/shared';
import type { EligibilityCriterion } from '@scout-grants/shared';

export function mapGroup(group: PrismaGroup): Group {
  return {
    id: group.id,
    name: group.name,
    membershipNumber: group.membershipNumber,
    charityNumber: group.charityNumber,
    postcode: group.postcode,
    region: group.region,
    sections: group.sections as Section[],
    membershipCount: group.membershipCount,
    fundingPurposes: group.fundingPurposes as FundingPurpose[],
    additionalContext: group.additionalContext,
    deprivationFlag: group.deprivationFlag,
    deprivationOverride: group.deprivationOverride,
    deprivationOverrideReason: group.deprivationOverrideReason,
    ruralFlag: group.ruralFlag,
    ruralOverride: group.ruralOverride,
    ruralOverrideReason: group.ruralOverrideReason,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export function mapGrant(grant: PrismaGrant): Grant {
  return {
    id: grant.id,
    groupId: grant.groupId,
    sourceId: grant.sourceId,
    name: grant.name,
    funder: grant.funder,
    description: grant.description,
    fundingPurposes: grant.fundingPurposes as FundingPurpose[],
    awardMin: grant.awardMin,
    awardMax: grant.awardMax,
    awardTypical: grant.awardTypical,
    eligibilityCriteria: grant.eligibilityCriteria as EligibilityCriterion[] | null,
    geographicScope: grant.geographicScope,
    deadline: grant.deadline ? grant.deadline.toISOString() : null,
    sourceUrl: grant.sourceUrl,
    retrievedAt: grant.retrievedAt.toISOString(),
    status: grant.status as GrantStatus,
    detailsIncomplete: grant.detailsIncomplete,
    createdAt: grant.createdAt.toISOString(),
    updatedAt: grant.updatedAt.toISOString(),
  };
}

export function mapAgentRun(run: PrismaAgentRun): AgentRun {
  return {
    id: run.id,
    groupId: run.groupId,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
    status: run.status as AgentRunStatus,
    grantsFoundCount: run.grantsFoundCount,
    grantsNewCount: run.grantsNewCount,
    errorMessage: run.errorMessage,
    nextRunAt: run.nextRunAt ? run.nextRunAt.toISOString() : null,
    createdAt: run.createdAt.toISOString(),
  };
}
