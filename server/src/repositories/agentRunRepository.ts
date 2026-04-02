import { prisma } from '../db';

export const agentRunRepository = {
  findLatestByGroupId(groupId: string) {
    return prisma.agentRun.findFirst({
      where: { groupId },
      orderBy: { startedAt: 'desc' },
    });
  },

  create(groupId: string) {
    return prisma.agentRun.create({
      data: { groupId, status: 'RUNNING' },
    });
  },

  complete(id: string, grantsFoundCount: number, grantsNewCount: number, nextRunAt: Date) {
    return prisma.agentRun.update({
      where: { id },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        grantsFoundCount,
        grantsNewCount,
        nextRunAt,
      },
    });
  },

  fail(id: string, errorMessage: string, nextRunAt: Date) {
    return prisma.agentRun.update({
      where: { id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage,
        nextRunAt,
      },
    });
  },

  failAllStaleRunning(errorMessage: string) {
    return prisma.agentRun.updateMany({
      where: { status: 'RUNNING' },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage,
      },
    });
  },
};
