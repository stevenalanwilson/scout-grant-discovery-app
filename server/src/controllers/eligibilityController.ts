import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { assessEligibility, getEligibilityResult } from '../services/eligibilityService';
import { eligibilityRepository } from '../repositories/eligibilityRepository';
import { groupRepository } from '../repositories/groupRepository';
import type {
  EligibilityResultSummary,
  RecentEligibilityResponse,
  CriterionResult,
  EligibilityVerdict,
  CriterionPassRate,
  EligibilityStatsResponse,
} from '@scout-grants/shared';

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

  async getRecentAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupRepository.findFirst();
      if (!group) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const rows = await eligibilityRepository.findRecentWithGrant(group.id);
      const results: EligibilityResultSummary[] = rows.map((row) => ({
        id: row.id,
        grantId: row.grantId,
        grantName: row.grant.name,
        funder: row.grant.funder,
        verdict: row.verdict as EligibilityVerdict,
        criteriaResults: row.criteriaResults as unknown as CriterionResult[],
        assessedAt: row.assessedAt.toISOString(),
      }));

      const response: RecentEligibilityResponse = { results };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },

  async getStatsAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupRepository.findFirst();
      if (!group) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const rows = await eligibilityRepository.findAllByGroupId(group.id);
      const totalAssessed = rows.length;

      const verdictBreakdown = { LIKELY_ELIGIBLE: 0, PARTIAL: 0, LIKELY_INELIGIBLE: 0 };
      const criterionMap = new Map<string, { description: string; met: number; notMet: number; unclear: number }>();

      for (const row of rows) {
        const verdict = row.verdict as EligibilityVerdict;
        verdictBreakdown[verdict]++;

        const criteria = row.criteriaResults as unknown as CriterionResult[];
        for (const c of criteria) {
          const entry = criterionMap.get(c.criterionId) ?? { description: c.description, met: 0, notMet: 0, unclear: 0 };
          if (c.status === 'MET') entry.met++;
          else if (c.status === 'NOT_MET') entry.notMet++;
          else entry.unclear++;
          criterionMap.set(c.criterionId, entry);
        }
      }

      const criterionPassRates: CriterionPassRate[] = Array.from(criterionMap.entries()).map(
        ([criterionId, { description, met, notMet, unclear }]) => ({
          criterionId,
          description,
          metCount: met,
          notMetCount: notMet,
          unclearCount: unclear,
          passRate: totalAssessed > 0 ? Math.round((met / totalAssessed) * 100) / 100 : 0,
        }),
      );

      const response: EligibilityStatsResponse = { totalAssessed, verdictBreakdown, criterionPassRates };
      res.json(response);
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
