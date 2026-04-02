import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { profileService } from '../services/profileService';
import { createGroupSchema, updateGroupSchema } from '../types/schemas';
import type { AppError } from '../middleware/errorHandler';

function makeValidationError(_err: ZodError): AppError {
  const error: AppError = new Error('Validation failed');
  error.status = 400;
  return error;
}

export const profileController = {
  async get(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await profileService.getProfile();
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      res.json(profile);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createGroupSchema.parse(req.body);
      const profile = await profileService.createProfile(body);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof ZodError) {
        next(makeValidationError(err));
      } else {
        next(err);
      }
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = updateGroupSchema.parse(req.body);
      const profile = await profileService.updateProfile(body);
      res.json(profile);
    } catch (err) {
      if (err instanceof ZodError) {
        next(makeValidationError(err));
      } else {
        next(err);
      }
    }
  },
};
