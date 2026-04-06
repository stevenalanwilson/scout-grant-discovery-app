import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useProfile } from './hooks/useProfile';

const SetupPage = lazy(() => import('./features/profile/SetupPage'));
const EditPage = lazy(() => import('./features/profile/EditPage'));
const GrantsPage = lazy(() => import('./features/grants/GrantsPage'));
const GrantDetailPage = lazy(() => import('./features/grants/GrantDetailPage'));
const ShortlistPage = lazy(() => import('./features/shortlist/ShortlistPage'));
const ScrapingDashboard = lazy(() => import('./features/admin/ScrapingDashboard'));
const EligibilityDashboard = lazy(() => import('./features/admin/EligibilityDashboard'));

function ProfileRedirect(): React.ReactElement {
  const { profile, isLoading } = useProfile();

  if (isLoading) return <p className="loading">Loading…</p>;
  if (!profile) return <Navigate to="/setup" replace />;
  return <Navigate to="/grants" replace />;
}

export default function App(): React.ReactElement {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav className="app-nav" aria-label="Main navigation">
        <a href="/" className="app-nav-title">
          Scout Grant Finder
        </a>
        <NavLink to="/grants" className="app-nav-link">
          Grants
        </NavLink>
        <NavLink to="/shortlist" className="app-nav-link">
          Shortlist
        </NavLink>
        <NavLink to="/profile" className="app-nav-link">
          My Group
        </NavLink>
        <NavLink to="/admin/scraping" className="app-nav-link">
          Scraping
        </NavLink>
        <NavLink to="/admin/eligibility" className="app-nav-link">
          Eligibility
        </NavLink>
      </nav>
      <main id="main-content" className="app-main">
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <Routes>
            <Route path="/" element={<ProfileRedirect />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/profile" element={<EditPage />} />
            <Route path="/grants" element={<GrantsPage />} />
            <Route path="/grants/:id" element={<GrantDetailPage />} />
            <Route path="/shortlist" element={<ShortlistPage />} />
            <Route path="/admin/scraping" element={<ScrapingDashboard />} />
            <Route path="/admin/eligibility" element={<EligibilityDashboard />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
