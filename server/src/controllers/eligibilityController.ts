import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { assessEligibility, getEligibilityResult } from '../services/eligibilityService';

const supplementaryAnswersSchema = z.record(z.string(), z.string()).optional();

export const eligibilityController = {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getEligibilityResult(req.params.grantId);
      if (!result) {
        res.status(404).json({ error: 'No eligibility result found for this grant' });
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async assess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplementaryAnswers = supplementaryAnswersSchema.parse(req.body.supplementaryAnswers);
      const result = await assessEligibility(req.params.grantId, supplementaryAnswers);
      res.json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Invalid supplementary answers' });
      } else {
        next(err);
      }
    }
  },
};
