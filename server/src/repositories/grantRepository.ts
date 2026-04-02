import type { Prisma, GrantStatus } from '@prisma/client';
import { prisma } from '../db';

export const grantRepository = {
  findAllByGroupId(groupId: string) {
    return prisma.grant.findMany({
      where: { groupId, status: { not: 'EXPIRED' } },
    });
  },

  create(data: Prisma.GrantUncheckedCreateInput) {
    return prisma.grant.create({ data });
  },

  update(id: string, data: Prisma.GrantUncheckedUpdateInput) {
    return prisma.grant.update({ where: { id }, data });
  },

  updateStatusBulk(ids: string[], status: GrantStatus) {
    return prisma.grant.updateMany({
      where: { id: { in: ids } },
      data: { status, updatedAt: new Date() },
    });
  },

  findAllByGroupIdForList(groupId: string) {
    return prisma.grant.findMany({
      where: { groupId },
      orderBy: { deadline: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.grant.findUnique({ where: { id } });
  },
};
