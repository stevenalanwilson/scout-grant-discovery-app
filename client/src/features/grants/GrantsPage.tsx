import { Link } from 'react-router-dom';
import { useGrants } from '../../hooks/useGrants';
import { useAgentStatus } from '../../hooks/useAgentStatus';
import { useGrantFilters } from './useGrantFilters';
import { GrantCard } from '../../components/GrantCard';
import { AgentStatusBar } from '../../components/AgentStatusBar';
import { SearchProgressNotice } from '../../components/SearchProgressNotice';
import { AiDisclaimer } from '../../components/AiDisclaimer';
import { GrantFiltersPanel } from './GrantFilters';
import { useShortlist } from '../../hooks/useShortlist';

export default function GrantsPage(): React.ReactElement {
  const { grants, isLoading, error, reload } = useGrants();
  const { status, isRunning, triggerRun, error: triggerError } = useAgentStatus(reload);
  const { shortlistedIds, toggle: toggleShortlist } = useShortlist();
  const {
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
  } = useGrantFilters(grants);

  const newOrUpdatedCount = grants.filter(
    (g) => g.status === 'NEW' || g.status === 'UPDATED',
  ).length;

  return (
    <div className="page">
      <header className="page-header grants-page-header">
        <div>
          <h1>
            Grants
            {newOrUpdatedCount > 0 && (
              <span
                className="page-header__badge"
                aria-label={`${newOrUpdatedCount} new or updated`}
              >
                {newOrUpdatedCount}
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            Funding opportunities found for your group.{' '}
            <Link to="/profile" className="inline-link">
              Edit profile
            </Link>
          </p>
        </div>
      </header>

      <AgentStatusBar
        status={status}
        isRunning={isRunning}
        newGrantsCount={newOrUpdatedCount}
        onTriggerRun={triggerRun}
        triggerError={triggerError}
      />

      {isRunning && <SearchProgressNotice progress={status?.lastRun?.progress ?? null} />}

      <AiDisclaimer />

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && grants.length > 0 && (
        <GrantFiltersPanel
          filters={filters}
          sort={sort}
          activeFilterCount={activeFilterCount}
          showExpired={showExpired}
          expiredCount={expiredCount}
          onFilterChange={setFilter}
          onSortChange={setSort}
          onClearFilters={clearFilters}
          onToggleExpired={setShowExpired}
        />
      )}

      {isLoading && <p className="loading">Loading grants…</p>}

      {!isLoading && !error && filteredGrants.length === 0 && !isRunning && (
        <div className="grants-empty">
          {grants.length === 0 ? (
            <>
              <p>No grants found yet.</p>
              <p className="grants-empty__hint">
                {status?.nextRunAt
                  ? 'The next automatic search is scheduled. You can also search now using the button above.'
                  : 'Use the Search now button above to find grants for your group.'}
              </p>
            </>
          ) : (
            <>
              <p>No grants match your current filters.</p>
              {activeFilterCount > 0 && (
                <button className="btn btn-ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </>
          )}
        </div>
      )}

      {!isLoading && !error && filteredGrants.length > 0 && (
        <ul className="grant-list" aria-label={`Grant results (${filteredGrants.length})`}>
          {filteredGrants.map((grant) => (
            <li key={grant.id} className="grant-list__item">
              <GrantCard
                grant={grant}
                isShortlisted={shortlistedIds.has(grant.id)}
                onShortlistToggle={toggleShortlist}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
