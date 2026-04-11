import type {
  Group as PrismaGroup,
  Grant as PrismaGrant,
  AgentRun as PrismaAgentRun,
  EligibilityResult as PrismaEligibilityResult,
} from '@prisma/client';
import type {
  Group,
  LegalStructure,
  Section,
  FundingPurpose,
  Grant,
  GrantStatus,
  GrantEligibilitySummary,
  AgentRun,
  AgentRunStatus,
  EligibilityVerdict,
  AgentProgress,
} from '@scout-grants/shared';
import type { EligibilityCriterion, CriterionResult } from '@scout-grants/shared';

export type GrantForList = PrismaGrant & { eligibilityResults: PrismaEligibilityResult[] };

function mapEligibility(results: PrismaEligibilityResult[]): GrantEligibilitySummary | null {
  const latest = results[0];
  if (!latest) return null;

  const criteria = Array.isArray(latest.criteriaResults)
    ? (latest.criteriaResults as unknown as CriterionResult[])
    : [];

  let notMetCount = 0;
  let unclearCount = 0;
  for (const c of criteria) {
    if (c.status === 'NOT_MET') notMetCount++;
    else if (c.status === 'UNCLEAR') unclearCount++;
  }

  return { verdict: latest.verdict as EligibilityVerdict, notMetCount, unclearCount };
}

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

    legalStructure: group.legalStructure as LegalStructure | null,
    registeredWithCharityCommission: group.registeredWithCharityCommission,
    yearEstablished: group.yearEstablished,
    constitutionInPlace: group.constitutionInPlace,
    bankAccountInGroupName: group.bankAccountInGroupName,

    imdDecile: group.imdDecile,
    localAuthority: group.localAuthority,
    parliamentaryConstituency: group.parliamentaryConstituency,
    communityServed: group.communityServed,

    annualIncome: group.annualIncome,
    annualExpenditure: group.annualExpenditure,
    financialYearEnd: group.financialYearEnd,
    hasCurrentAccounts: group.hasCurrentAccounts,
    currentGrantsHeld: group.currentGrantsHeld,
    largestSingleFunderPercentage: group.largestSingleFunderPercentage,

    safeguardingPolicyInPlace: group.safeguardingPolicyInPlace,
    safeguardingPolicyReviewedWithin12Months: group.safeguardingPolicyReviewedWithin12Months,
    equalitiesPolicyInPlace: group.equalitiesPolicyInPlace,
    publicLiabilityInsurance: group.publicLiabilityInsurance,
    numberOfTrustees: group.numberOfTrustees,
    trusteesAreUnrelated: group.trusteesAreUnrelated,
    hasOutstandingMonitoringReports: group.hasOutstandingMonitoringReports,

    volunteerCount: group.volunteerCount,
    percentageFreeSchoolMeals: group.percentageFreeSchoolMeals,
    percentageDisabledOrSEND: group.percentageDisabledOrSEND,
    specificProjectDescription: group.specificProjectDescription,
    estimatedProjectCost: group.estimatedProjectCost,
    staffOrPaidWorkers: group.staffOrPaidWorkers,

    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

function mapGrantBase(grant: PrismaGrant): Omit<Grant, 'latestEligibility'> {
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

export function mapGrant(grant: PrismaGrant): Grant {
  return { ...mapGrantBase(grant), latestEligibility: null };
}

export function mapGrantForList(grant: GrantForList): Grant {
  return { ...mapGrantBase(grant), latestEligibility: mapEligibility(grant.eligibilityResults) };
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
    progress:
      run.progressLog !== null &&
      typeof run.progressLog === 'object' &&
      !Array.isArray(run.progressLog)
        ? (run.progressLog as unknown as AgentProgress)
        : null,
    createdAt: run.createdAt.toISOString(),
  };
}
