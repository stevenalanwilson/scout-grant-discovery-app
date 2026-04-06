import type {
  EligibilityVerdict,
  CriterionResult,
  EligibilityResult,
} from '@scout-grants/shared';
import { eligibilityRepository } from '../repositories/eligibilityRepository';
import { grantRepository } from '../repositories/grantRepository';
import { groupRepository } from '../repositories/groupRepository';
import { mapGrant, mapGroup } from '../types/mappers';
import type { AppError } from '../middleware/errorHandler';
import { runEligibilityPipeline } from '../lib/eligibilityPipeline';

export interface AssessEligibilityResult {
  eligibilityResult: EligibilityResult | null;
  supplementaryQuestions: Array<{ id: string; question: string; hint: string | null }>;
}

export async function assessEligibility(
  grantId: string,
  supplementaryAnswers?: Record<string, string>,
): Promise<AssessEligibilityResult> {
  const [prismaGrant, prismaGroup] = await Promise.all([
    grantRepository.findById(grantId),
    groupRepository.findFirst(),
  ]);

  if (!prismaGrant) {
    const err: AppError = new Error('Grant not found');
    err.status = 404;
    throw err;
  }

  if (!prismaGroup) {
    const err: AppError = new Error('Profile not found');
    err.status = 404;
    throw err;
  }

  const grant = mapGrant(prismaGrant);
  const group = mapGroup(prismaGroup);

  const pipeline = await runEligibilityPipeline(grant, group);

  const persisted = await eligibilityRepository.create(
    grantId,
    group.id,
    pipeline.verdict,
    pipeline.criteriaResults,
    supplementaryAnswers ?? null,
  );

  return {
    eligibilityResult: {
      id: persisted.id,
      grantId,
      groupId: group.id,
      verdict: pipeline.verdict,
      criteriaResults: pipeline.criteriaResults,
      supplementaryAnswers: supplementaryAnswers ?? null,
      assessedAt: persisted.assessedAt.toISOString(),
      createdAt: persisted.createdAt.toISOString(),
      updatedAt: persisted.updatedAt.toISOString(),
    },
    supplementaryQuestions: [],
  };
}

export async function getEligibilityResult(grantId: string): Promise<EligibilityResult | null> {
  const prismaGroup = await groupRepository.findFirst();
  if (!prismaGroup) return null;

  const result = await eligibilityRepository.findByGrantAndGroup(grantId, prismaGroup.id);
  if (!result) return null;

  const now = result.assessedAt.toISOString();
  return {
    id: result.id,
    grantId: result.grantId,
    groupId: result.groupId,
    verdict: result.verdict as EligibilityVerdict,
    criteriaResults: result.criteriaResults as unknown as CriterionResult[],
    supplementaryAnswers: result.supplementaryAnswers as Record<string, string> | null,
    assessedAt: now,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}
