import type { Prisma } from '@prisma/client';
import { prisma } from '../db';

export const groupRepository = {
  findFirst() {
    return prisma.group.findFirst();
  },

  create(data: Prisma.GroupCreateInput) {
    return prisma.group.create({ data });
  },

  update(id: string, data: Prisma.GroupUpdateInput) {
    return prisma.group.update({ where: { id }, data });
  },
};
