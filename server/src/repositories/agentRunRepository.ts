import type { AgentProgress } from '@scout-grants/shared';
import { prisma } from '../db';

export const agentRunRepository = {
  findLatestByGroupId(groupId: string) {
    return prisma.agentRun.findFirst({
      where: { groupId },
      orderBy: { startedAt: 'desc' },
    });
  },

  findRecentByGroupId(groupId: string, limit = 10) {
    return prisma.agentRun.findMany({
      where: { groupId },
      orderBy: { startedAt: 'desc' },
      take: limit,
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

  updateProgress(id: string, progress: AgentProgress) {
    return prisma.agentRun.update({
      where: { id },
      data: {
        progressLog: progress as unknown as Parameters<
          typeof prisma.agentRun.update
        >[0]['data']['progressLog'],
      },
    });
  },

  failAllStaleRunning(errorMessage: string, nextRunAt: Date) {
    return prisma.agentRun.updateMany({
      where: { status: 'RUNNING' },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage,
        nextRunAt,
      },
    });
  },
};
