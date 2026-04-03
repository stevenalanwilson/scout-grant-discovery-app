import type { Request, Response, NextFunction } from 'express';
import { groupRepository } from '../repositories/groupRepository';
import { agentRunRepository } from '../repositories/agentRunRepository';
import { runForGroup } from '../services/agentService';
import { mapAgentRun } from '../types/mappers';

export const agentController = {
  async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupRepository.findFirst();
      if (!group) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const lastRun = await agentRunRepository.findLatestByGroupId(group.id);

      res.json({
        lastRun: lastRun ? mapAgentRun(lastRun) : null,
        nextRunAt: lastRun?.nextRunAt?.toISOString() ?? null,
      });
    } catch (err) {
      next(err);
    }
  },

  async triggerRun(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupRepository.findFirst();
      if (!group) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      // Fire-and-forget — client polls /status for progress
      runForGroup(group.id).catch((err) => {
        console.error('[agent] Manual run failed:', err);
      });

      res.status(202).json({ message: 'Run started' });
    } catch (err) {
      next(err);
    }
  },
};
