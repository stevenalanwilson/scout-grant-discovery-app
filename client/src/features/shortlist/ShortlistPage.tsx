import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Grant } from '@scout-grants/shared';
import { shortlistApi } from '../../services/shortlistApi';
import { GrantCard } from '../../components/GrantCard';

export default function ShortlistPage(): React.ReactElement {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    shortlistApi
      .list()
      .then(setGrants)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load shortlist'),
      )
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRemove(grantId: string): Promise<void> {
    await shortlistApi.remove(grantId);
    setGrants((prev) => prev.filter((g) => g.id !== grantId));
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Shortlist</h1>
        <p className="page-subtitle">
          Grants you have saved for closer review.{' '}
          <Link to="/grants" className="inline-link">
            Back to all grants
          </Link>
        </p>
      </header>

      {isLoading && <p className="loading">Loading shortlist…</p>}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && grants.length === 0 && (
        <div className="grants-empty">
          <p>Your shortlist is empty.</p>
          <p className="grants-empty__hint">
            Use the bookmark button on any grant card to add it here.
          </p>
          <p className="grants-empty__hint">
            Save grants you want to apply for and track them in one place.
          </p>
          <Link
            to="/grants"
            className="btn btn-primary"
            style={{ marginTop: '1rem', display: 'inline-flex' }}
          >
            Browse grants
          </Link>
        </div>
      )}

      {!isLoading && grants.length > 0 && (
        <ul className="grant-list" aria-label="Shortlisted grants">
          {grants.map((grant) => (
            <li key={grant.id} className="grant-list__item">
              <GrantCard grant={grant} />
              <button
                className="btn btn-ghost shortlist-remove"
                onClick={() => void handleRemove(grant.id)}
                aria-label={`Remove ${grant.name} from shortlist`}
              >
                Remove from shortlist
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
