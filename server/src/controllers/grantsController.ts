import type { Request, Response, NextFunction } from 'express';
import { grantRepository } from '../repositories/grantRepository';
import { groupRepository } from '../repositories/groupRepository';
import { mapGrant } from '../types/mappers';

export const grantsController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupRepository.findFirst();
      if (!group) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const grants = await grantRepository.findAllByGroupIdForList(group.id);
      res.json(grants.map(mapGrant));
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grant = await grantRepository.findById(req.params.id);
      if (!grant) {
        res.status(404).json({ error: 'Grant not found' });
        return;
      }
      res.json(mapGrant(grant));
    } catch (err) {
      next(err);
    }
  },
};
