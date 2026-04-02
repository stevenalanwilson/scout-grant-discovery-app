import { prisma } from '../db';

export const shortlistRepository = {
  findAllByGroupId(groupId: string) {
    return prisma.shortlistItem.findMany({
      where: { groupId },
      include: { grant: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  findOne(groupId: string, grantId: string) {
    return prisma.shortlistItem.findUnique({
      where: { groupId_grantId: { groupId, grantId } },
    });
  },

  add(groupId: string, grantId: string) {
    return prisma.shortlistItem.create({
      data: { groupId, grantId },
    });
  },

  remove(groupId: string, grantId: string) {
    return prisma.shortlistItem.delete({
      where: { groupId_grantId: { groupId, grantId } },
    });
  },
};
