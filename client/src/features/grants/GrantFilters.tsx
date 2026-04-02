import type { FundingPurpose } from '@scout-grants/shared';
import type { GrantFilters, SortOption } from './useGrantFilters';

const ALL_PURPOSES: { value: FundingPurpose; label: string }[] = [
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'ACTIVITIES', label: 'Activities' },
  { value: 'INCLUSION', label: 'Inclusion' },
  { value: 'FACILITIES', label: 'Facilities' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'WELLBEING', label: 'Wellbeing' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'deadline', label: 'Soonest deadline' },
  { value: 'award-high', label: 'Award: high to low' },
  { value: 'award-low', label: 'Award: low to high' },
  { value: 'date-added', label: 'Recently added' },
];

interface GrantFiltersProps {
  filters: GrantFilters;
  sort: SortOption;
  activeFilterCount: number;
  showExpired: boolean;
  expiredCount: number;
  onFilterChange: <K extends keyof GrantFilters>(key: K, value: GrantFilters[K]) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  onToggleExpired: (show: boolean) => void;
}

export function GrantFiltersPanel({
  filters,
  sort,
  activeFilterCount,
  showExpired,
  expiredCount,
  onFilterChange,
  onSortChange,
  onClearFilters,
  onToggleExpired,
}: GrantFiltersProps): React.ReactElement {
  function togglePurpose(purpose: FundingPurpose): void {
    const updated = filters.purposes.includes(purpose)
      ? filters.purposes.filter((p) => p !== purpose)
      : [...filters.purposes, purpose];
    onFilterChange('purposes', updated);
  }

  return (
    <section className="grant-filters" aria-label="Filter and sort grants">
      <div className="grant-filters__row">
        <div className="grant-filters__sort">
          <label htmlFor="grant-sort" className="grant-filters__label">
            Sort by
          </label>
          <select
            id="grant-sort"
            className="input grant-filters__select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grant-filters__actions">
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost grant-filters__clear" onClick={onClearFilters}>
              Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <div className="grant-filters__purposes">
        <span className="grant-filters__label" id="purposes-label">
          Funding purpose
        </span>
        <div className="grant-filters__chips" role="group" aria-labelledby="purposes-label">
          {ALL_PURPOSES.map(({ value, label }) => {
            const active = filters.purposes.includes(value);
            return (
              <button
                key={value}
                className={`filter-chip ${active ? 'filter-chip--active' : ''}`}
                onClick={() => togglePurpose(value)}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grant-filters__row grant-filters__row--wrap">
        <div className="grant-filters__field">
          <label htmlFor="min-award" className="grant-filters__label">
            Min award (£)
          </label>
          <input
            id="min-award"
            type="number"
            min="0"
            className="input input-sm"
            value={filters.minAward}
            onChange={(e) => onFilterChange('minAward', e.target.value)}
            placeholder="e.g. 500"
          />
        </div>

        <div className="grant-filters__field">
          <label htmlFor="max-award" className="grant-filters__label">
            Max award (£)
          </label>
          <input
            id="max-award"
            type="number"
            min="0"
            className="input input-sm"
            value={filters.maxAward}
            onChange={(e) => onFilterChange('maxAward', e.target.value)}
            placeholder="e.g. 5000"
          />
        </div>

        <div className="grant-filters__field">
          <label htmlFor="deadline-days" className="grant-filters__label">
            Closes within (days)
          </label>
          <input
            id="deadline-days"
            type="number"
            min="1"
            className="input input-sm"
            value={filters.deadlineDays}
            onChange={(e) => onFilterChange('deadlineDays', e.target.value)}
            placeholder="e.g. 30"
          />
        </div>

        {expiredCount > 0 && (
          <div className="grant-filters__expired">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => onToggleExpired(e.target.checked)}
              />
              Show {expiredCount} expired
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
