import type { Grant } from '@scout-grants/shared';
import type { ExtractedGrant } from '../types/extractedGrant';

export type FreshGrant = ExtractedGrant & { readonly sourceId: string };

export interface GrantToCreate extends FreshGrant {
  readonly status: 'NEW';
}

export interface GrantToUpdate {
  readonly id: string;
  readonly changes: Partial<ExtractedGrant>;
  readonly status: 'UPDATED' | 'ACTIVE';
}

export interface DiffResult {
  readonly toCreate: readonly GrantToCreate[];
  readonly toUpdate: readonly GrantToUpdate[];
  readonly toMarkClosed: readonly string[];
}

function normalise(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function toDateOnly(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10); // 'YYYY-MM-DD'
}

function hasKeyFieldChanged(existing: Grant, fresh: ExtractedGrant): boolean {
  const deadlineChanged = toDateOnly(existing.deadline) !== toDateOnly(fresh.deadline);
  const minChanged = existing.awardMin !== fresh.awardMin;
  const maxChanged = existing.awardMax !== fresh.awardMax;
  return deadlineChanged || minChanged || maxChanged;
}

function findMatch(fresh: FreshGrant, existing: readonly Grant[]): Grant | undefined {
  // Primary key: exact source URL match
  const byUrl = existing.find((g) => g.sourceUrl === fresh.sourceUrl);
  if (byUrl) return byUrl;

  // Secondary key: same sourceId + normalised name (scoped to source; avoids cross-source
  // false matches and is robust to Claude extracting funder name inconsistently)
  return existing.find(
    (g) => g.sourceId === fresh.sourceId && normalise(g.name) === normalise(fresh.name),
  );
}

export function diffGrants(existing: readonly Grant[], fresh: readonly FreshGrant[]): DiffResult {
  const matchedExistingIds = new Set<string>();
  const seenFreshUrls = new Set<string>();
  const toCreate: GrantToCreate[] = [];
  const toUpdate: GrantToUpdate[] = [];

  for (const freshGrant of fresh) {
    // Skip duplicates that would violate the (groupId, sourceUrl) unique constraint.
    // The same URL can appear across multiple sources or be extracted twice from one page.
    if (seenFreshUrls.has(freshGrant.sourceUrl)) continue;
    seenFreshUrls.add(freshGrant.sourceUrl);

    const match = findMatch(freshGrant, existing);

    if (!match) {
      toCreate.push({ ...freshGrant, status: 'NEW' });
      continue;
    }

    matchedExistingIds.add(match.id);

    const changed = hasKeyFieldChanged(match, freshGrant);
    const changes: Partial<ExtractedGrant> = {
      description: freshGrant.description,
      awardMin: freshGrant.awardMin,
      awardMax: freshGrant.awardMax,
      awardTypical: freshGrant.awardTypical,
      deadline: freshGrant.deadline,
      eligibilityCriteria: freshGrant.eligibilityCriteria,
      detailsIncomplete: freshGrant.detailsIncomplete,
      geographicScope: freshGrant.geographicScope,
      sourceUrl: freshGrant.sourceUrl,
    };

    toUpdate.push({ id: match.id, changes, status: changed ? 'UPDATED' : 'ACTIVE' });
  }

  // Existing grants not found in fresh results
  const toMarkClosed = existing
    .filter((g) => !matchedExistingIds.has(g.id) && g.status !== 'MAY_HAVE_CLOSED')
    .map((g) => g.id);

  return { toCreate, toUpdate, toMarkClosed };
}
