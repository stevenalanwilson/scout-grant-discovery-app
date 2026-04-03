import { useState, useMemo } from 'react';
import type { Grant, FundingPurpose } from '@scout-grants/shared';
import { daysUntilDeadline } from '../../utils/formatting';

export type SortOption = 'deadline' | 'award-high' | 'award-low' | 'date-added';

export interface GrantFilters {
  purposes: FundingPurpose[];
  minAward: string;
  maxAward: string;
  deadlineDays: string;
}

const EMPTY_FILTERS: GrantFilters = {
  purposes: [],
  minAward: '',
  maxAward: '',
  deadlineDays: '',
};

function applyFilters(grants: Grant[], filters: GrantFilters, showExpired: boolean): Grant[] {
  return grants.filter((grant) => {
    const expired = grant.deadline ? daysUntilDeadline(grant.deadline) < 0 : false;
    if (!showExpired && expired) return false;

    if (filters.purposes.length > 0) {
      const hasMatch = filters.purposes.some((p) => grant.fundingPurposes.includes(p));
      if (!hasMatch) return false;
    }

    if (filters.minAward !== '') {
      const min = parseInt(filters.minAward, 10);
      if (!isNaN(min) && (grant.awardMax ?? 0) < min) return false;
    }

    if (filters.maxAward !== '') {
      const max = parseInt(filters.maxAward, 10);
      if (!isNaN(max) && grant.awardMin !== null && grant.awardMin > max) return false;
    }

    if (filters.deadlineDays !== '') {
      const days = parseInt(filters.deadlineDays, 10);
      if (!isNaN(days) && grant.deadline) {
        if (daysUntilDeadline(grant.deadline) > days) return false;
      }
    }

    return true;
  });
}

function applySort(grants: Grant[], sort: SortOption): Grant[] {
  const sorted = [...grants];
  switch (sort) {
    case 'deadline':
      return sorted.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    case 'award-high':
      return sorted.sort((a, b) => (b.awardMax ?? 0) - (a.awardMax ?? 0));
    case 'award-low':
      return sorted.sort((a, b) => (a.awardMin ?? 0) - (b.awardMin ?? 0));
    case 'date-added':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

interface UseGrantFiltersResult {
  filters: GrantFilters;
  sort: SortOption;
  showExpired: boolean;
  filteredGrants: Grant[];
  expiredCount: number;
  activeFilterCount: number;
  setFilter: <K extends keyof GrantFilters>(key: K, value: GrantFilters[K]) => void;
  setSort: (sort: SortOption) => void;
  setShowExpired: (show: boolean) => void;
  clearFilters: () => void;
}

export function useGrantFilters(grants: Grant[]): UseGrantFiltersResult {
  const [filters, setFilters] = useState<GrantFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>('deadline');
  const [showExpired, setShowExpired] = useState(true);

  const expiredCount = useMemo(
    () => grants.filter((g) => g.deadline && daysUntilDeadline(g.deadline) < 0).length,
    [grants],
  );

  const filteredGrants = useMemo(() => {
    const filtered = applyFilters(grants, filters, showExpired);
    return applySort(filtered, sort);
  }, [grants, filters, sort, showExpired]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.purposes.length > 0) count++;
    if (filters.minAward !== '') count++;
    if (filters.maxAward !== '') count++;
    if (filters.deadlineDays !== '') count++;
    return count;
  }, [filters]);

  function setFilter<K extends keyof GrantFilters>(key: K, value: GrantFilters[K]): void {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters(): void {
    setFilters(EMPTY_FILTERS);
  }

  return {
    filters,
    sort,
    showExpired,
    filteredGrants,
    expiredCount,
    activeFilterCount,
    setFilter,
    setSort,
    setShowExpired,
    clearFilters,
  };
}
