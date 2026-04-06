import fs from 'fs';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import type {
  ScrapeRunSummary,
  ScrapeHistoryResponse,
  SourceStatus,
  SourcesResponse,
  AgentProgress,
} from '@scout-grants/shared';
import { groupRepository } from '../repositories/groupRepository';
import { agentRunRepository } from '../repositories/agentRunRepository';
import type { GrantSourcesFile } from '../types/grantSources';

function loadGrantSources(): GrantSourcesFile {
  const sourcesPath =
    process.env.GRANT_SOURCES_PATH ?? path.resolve(process.cwd(), '../grant_sources.json');
  const raw = fs.readFileSync(sourcesPath, 'utf-8');
  return JSON.parse(raw) as GrantSourcesFile;
}

function toProgress(raw: unknown): AgentProgress | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as AgentProgress;
}

function toScrapeRunSummary(run: {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: string;
  grantsFoundCount: number;
  grantsNewCount: number;
  errorMessage: string | null;
  progressLog: unknown;
}): ScrapeRunSummary {
  return {
    id: run.id,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
    status: run.status as ScrapeRunSummary['status'],
    grantsFoundCount: run.grantsFoundCount,
    grantsNewCount: run.grantsNewCount,
    errorMessage: run.errorMessage,
    progress: toProgress(run.progressLog),
  };
}

export const adminController = {
  async getScrapeHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupRepository.findFirst();
      if (!group) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const runs = await agentRunRepository.findRecentByGroupId(group.id);
      const response: ScrapeHistoryResponse = { runs: runs.map(toScrapeRunSummary) };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },

  async getScrapeSourceStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await groupRepository.findFirst();
      const latestRun = group ? await agentRunRepository.findLatestByGroupId(group.id) : null;

      const sourcesFile = loadGrantSources();

      const sources: SourceStatus[] = sourcesFile.sources.map((source) => {
        if (!source.active) {
          return {
            id: source.id,
            name: source.name,
            url: source.url,
            scope: source.scope,
            active: false,
            lastRunStatus: 'skipped',
            grantsExtracted: null,
          };
        }

        let lastRunStatus: SourceStatus['lastRunStatus'] = 'unknown';
        if (latestRun) {
          if (latestRun.status === 'SUCCESS') lastRunStatus = 'success';
          else if (latestRun.status === 'FAILED') lastRunStatus = 'unknown';
        }

        return {
          id: source.id,
          name: source.name,
          url: source.url,
          scope: source.scope,
          active: true,
          lastRunStatus,
          grantsExtracted: null,
        };
      });

      const response: SourcesResponse = { sources };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
};
