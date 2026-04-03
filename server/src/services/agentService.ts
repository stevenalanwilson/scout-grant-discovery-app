import fs from 'fs';
import path from 'path';
import type { Group } from '@scout-grants/shared';
import type { GrantSourcesFile, GrantSource } from '../types/grantSources';
import { groupRepository } from '../repositories/groupRepository';
import { agentRunRepository } from '../repositories/agentRunRepository';
import { grantRepository } from '../repositories/grantRepository';
import { crawlUrl } from './crawlerService';
import { extractGrantsFromPage } from './extractionService';
import { diffGrants } from './diffService';
import { mapGroup, mapGrant } from '../types/mappers';

function loadGrantSources(): GrantSourcesFile {
  const sourcesPath =
    process.env.GRANT_SOURCES_PATH ?? path.resolve(process.cwd(), '../grant_sources.json');
  const raw = fs.readFileSync(sourcesPath, 'utf-8');
  return JSON.parse(raw) as GrantSourcesFile;
}

function getActiveSources(file: GrantSourcesFile, group: Group): GrantSource[] {
  return file.sources.filter((source) => {
    if (!source.active) return false;
    if (source.scope === 'local' && source.region && group.region) {
      return source.region === group.region;
    }
    return source.scope === 'national';
  });
}

function nextRunAt(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  d.setUTCHours(3, 0, 0, 0);
  return d;
}

export async function runForGroup(groupId: string): Promise<void> {
  const prismaGroup = await groupRepository.findFirst();
  if (!prismaGroup || prismaGroup.id !== groupId) {
    throw new Error(`Group ${groupId} not found`);
  }

  const group = mapGroup(prismaGroup);
  const run = await agentRunRepository.create(groupId);

  try {
    const sourcesFile = loadGrantSources();
    const sources = getActiveSources(sourcesFile, group);
    const existingGrants = (await grantRepository.findAllByGroupId(groupId)).map(mapGrant);

    const allFreshGrants = [];
    let sourceSuccessCount = 0;
    const sourceErrors: string[] = [];

    for (const source of sources) {
      try {
        const crawlResult = await crawlUrl(source.url);
        if (!crawlResult.ok || !crawlResult.text) {
          const reason = crawlResult.error ?? 'empty page';
          console.warn(`[agent] Crawl failed for ${source.id}: ${reason}`);
          sourceErrors.push(`${source.id}: ${reason}`);
          continue;
        }

        const extracted = await extractGrantsFromPage(crawlResult.text, source, group);
        // Tag each grant with its source ID
        allFreshGrants.push(...extracted.map((g) => ({ ...g, sourceId: source.id })));
        sourceSuccessCount++;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(`[agent] Source ${source.id} failed:`, err);
        sourceErrors.push(`${source.id}: ${reason}`);
      }
    }

    if (sourceSuccessCount === 0 && sources.length > 0) {
      throw new Error(`All ${sources.length} sources failed. Errors: ${sourceErrors.join('; ')}`);
    }

    if (sourceErrors.length > 0) {
      console.warn(
        `[agent] ${sourceErrors.length}/${sources.length} sources failed for group ${groupId}: ${sourceErrors.join('; ')}`,
      );
    }

    // Reset only after a successful crawl — preserves badges if all sources fail
    await grantRepository.resetNewAndUpdatedToActive(groupId);

    const diff = diffGrants(existingGrants, allFreshGrants);

    // Persist new grants
    for (const grant of diff.toCreate) {
      await grantRepository.create({
        groupId,
        sourceId: (grant as typeof grant & { sourceId: string }).sourceId,
        name: grant.name,
        funder: grant.funder,
        description: grant.description,
        fundingPurposes: [...grant.fundingPurposes],
        awardMin: grant.awardMin,
        awardMax: grant.awardMax,
        awardTypical: grant.awardTypical,
        eligibilityCriteria: grant.eligibilityCriteria
          ? JSON.parse(JSON.stringify(grant.eligibilityCriteria))
          : null,
        geographicScope: grant.geographicScope,
        deadline: grant.deadline ? new Date(grant.deadline) : null,
        sourceUrl: grant.sourceUrl,
        retrievedAt: new Date(),
        status: 'NEW',
        detailsIncomplete: grant.detailsIncomplete,
      });
    }

    // Update changed grants
    for (const { id, changes, status } of diff.toUpdate) {
      await grantRepository.update(id, {
        ...changes,
        fundingPurposes: changes.fundingPurposes ? [...changes.fundingPurposes] : undefined,
        eligibilityCriteria: changes.eligibilityCriteria
          ? JSON.parse(JSON.stringify(changes.eligibilityCriteria))
          : undefined,
        deadline:
          changes.deadline !== undefined
            ? changes.deadline
              ? new Date(changes.deadline)
              : null
            : undefined,
        retrievedAt: new Date(),
        status,
      });
    }

    // Mark missing grants as may_have_closed
    if (diff.toMarkClosed.length > 0) {
      await grantRepository.updateStatusBulk([...diff.toMarkClosed], 'MAY_HAVE_CLOSED');
    }

    const grantsFoundCount = allFreshGrants.length;
    const grantsNewCount = diff.toCreate.length;

    await agentRunRepository.complete(run.id, grantsFoundCount, grantsNewCount, nextRunAt());

    console.log(
      `[agent] Run complete for group ${groupId}: ${grantsFoundCount} found, ${grantsNewCount} new`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await agentRunRepository.fail(run.id, message, nextRunAt());
    console.error(`[agent] Run failed for group ${groupId}:`, err);
    throw err;
  }
}

export async function canRunManually(groupId: string): Promise<boolean> {
  const lastRun = await agentRunRepository.findLatestByGroupId(groupId);
  if (!lastRun) return true;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return lastRun.startedAt < oneDayAgo;
}
