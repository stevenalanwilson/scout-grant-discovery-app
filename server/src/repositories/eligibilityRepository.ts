import type { EligibilityVerdict } from '@prisma/client';
import { prisma } from '../db';

export const eligibilityRepository = {
  findByGrantAndGroup(grantId: string, groupId: string) {
    return prisma.eligibilityResult.findFirst({
      where: { grantId, groupId },
      orderBy: { assessedAt: 'desc' },
    });
  },

  upsert(
    grantId: string,
    groupId: string,
    verdict: EligibilityVerdict,
    criteriaResults: unknown,
    supplementaryAnswers: unknown | null,
  ) {
    return prisma.eligibilityResult.upsert({
      where: {
        // No unique constraint on grantId+groupId in schema — use findFirst + create/update pattern
        id: 'placeholder',
      },
      update: {},
      create: {
        grantId,
        groupId,
        verdict,
        criteriaResults: criteriaResults as never,
        supplementaryAnswers: supplementaryAnswers as never,
        assessedAt: new Date(),
      },
    });
  },

  create(
    grantId: string,
    groupId: string,
    verdict: EligibilityVerdict,
    criteriaResults: unknown,
    supplementaryAnswers: unknown | null,
  ) {
    return prisma.eligibilityResult.create({
      data: {
        grantId,
        groupId,
        verdict,
        criteriaResults: criteriaResults as never,
        supplementaryAnswers: supplementaryAnswers as never,
        assessedAt: new Date(),
      },
    });
  },
};
