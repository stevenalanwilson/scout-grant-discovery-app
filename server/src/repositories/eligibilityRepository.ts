import type { EligibilityVerdict } from '@prisma/client';
import { prisma } from '../db';

export const eligibilityRepository = {
  findByGrantAndGroup(grantId: string, groupId: string) {
    return prisma.eligibilityResult.findFirst({
      where: { grantId, groupId },
      orderBy: { assessedAt: 'desc' },
    });
  },

  async upsert(
    grantId: string,
    groupId: string,
    verdict: EligibilityVerdict,
    criteriaResults: unknown,
    supplementaryAnswers: unknown | null,
  ) {
    const existing = await prisma.eligibilityResult.findFirst({
      where: { grantId, groupId },
      orderBy: { assessedAt: 'desc' },
    });

    const data = {
      verdict,
      criteriaResults: criteriaResults as never,
      supplementaryAnswers: supplementaryAnswers as never,
      assessedAt: new Date(),
    };

    if (existing) {
      return prisma.eligibilityResult.update({ where: { id: existing.id }, data });
    }

    return prisma.eligibilityResult.create({ data: { grantId, groupId, ...data } });
  },

  findRecentWithGrant(groupId: string, limit = 20) {
    return prisma.eligibilityResult.findMany({
      where: { groupId },
      orderBy: { assessedAt: 'desc' },
      take: limit,
      include: { grant: true },
    });
  },

  findAllByGroupId(groupId: string) {
    return prisma.eligibilityResult.findMany({
      where: { groupId },
      select: { verdict: true, criteriaResults: true },
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
