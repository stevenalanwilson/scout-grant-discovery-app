import type { Request, Response, NextFunction } from 'express';
import { shortlistRepository } from '../repositories/shortlistRepository';
import { groupRepository } from '../repositories/groupRepository';
import { mapGrant } from '../types/mappers';
import type { AppError } from '../middleware/errorHandler';

async function requireGroup(): Promise<{ id: string }> {
  const group = await groupRepository.findFirst();
  if (!group) {
    const err: AppError = new Error('Profile not found');
    err.status = 404;
    throw err;
  }
  return group;
}

export const shortlistController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await requireGroup();
      const items = await shortlistRepository.findAllByGroupId(group.id);
      res.json(items.map((item) => mapGrant(item.grant)));
    } catch (err) {
      next(err);
    }
  },

  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await requireGroup();
      const { grantId } = req.params;

      const existing = await shortlistRepository.findOne(group.id, grantId);
      if (existing) {
        res.status(409).json({ error: 'Grant already on shortlist' });
        return;
      }

      await shortlistRepository.add(group.id, grantId);
      res.status(201).json({ message: 'Added to shortlist' });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await requireGroup();
      const { grantId } = req.params;

      const existing = await shortlistRepository.findOne(group.id, grantId);
      if (!existing) {
        res.status(404).json({ error: 'Grant not on shortlist' });
        return;
      }

      await shortlistRepository.remove(group.id, grantId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
