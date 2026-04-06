# Specification: Scraping Pipeline Dashboard

## Purpose

A developer/operator dashboard that gives full visibility into the grant scraping pipeline —
what sources were crawled, whether extraction succeeded, how many grants came back, and
what happened during the diff/store phase. Accessible at `/admin/scraping`.

## Codebase context

- Agent orchestration: `server/src/services/agentService.ts` — `runForGroup()`
- Crawling: `server/src/services/crawlerService.ts` — `crawlUrl()`
- AI extraction: `server/src/services/extractionService.ts` — `extractGrantsFromPage()`
- Diff logic: `server/src/services/diffService.ts` — `diffGrants()`
- DB: `AgentRun.progressLog` (JSON) + `AgentRun.status` + `AgentRun.grantsFoundCount`
- Shared types: `shared/src/types/agentRun.ts` — `AgentRun`, `AgentProgress`, `AgentRunStatus`
- Existing API: `GET /api/agent/status` → `{ lastRun: AgentRun | null, nextRunAt: string | null }`
- Existing trigger: `POST /api/agent/run`

---

## CHECKPOINT 1 — Stop after this section and verify before proceeding

### 1.1 New API endpoint: `GET /api/admin/scraping/history`

**File:** `server/src/routes/agent.ts` (add route) + new controller method in
`server/src/controllers/agentController.ts`

**Response shape:**

```ts
interface ScrapeHistoryResponse {
  runs: ScrapeRunSummary[];
}

interface ScrapeRunSummary {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  grantsFoundCount: number;
  grantsNewCount: number;
  errorMessage: string | null;
  progress: AgentProgress | null; // from AgentRun.progressLog cast to AgentProgress
}
```

**Repository:** Add `agentRunRepository.findRecentByGroupId(groupId, limit = 10)` in
`server/src/repositories/agentRunRepository.ts`.

**Verification steps for Checkpoint 1:**

- [ ] `GET /api/admin/scraping/history` returns 200 with the above shape
- [ ] `runs` array contains the most recent 10 runs, newest first
- [ ] Each run has `progress` populated when `status === 'RUNNING'`
- [ ] `AgentRunStatus` values match the Prisma enum exactly

---

## CHECKPOINT 2 — Stop after this section and verify before proceeding

### 2.1 New API endpoint: `GET /api/admin/scraping/sources`

**File:** `server/src/routes/agent.ts` + `server/src/controllers/agentController.ts`

Reads `grant_sources.json` from disk (same logic as `agentService.loadGrantSources()`) and
returns all sources with their metadata. Cross-references the latest successful `AgentRun` to
report per-source outcomes from `progress.currentSource` and counts.

**Response shape:**

```ts
interface SourcesResponse {
  sources: SourceStatus[];
}

interface SourceStatus {
  id: string;
  name: string;
  url: string;
  scope: 'national' | 'local';
  active: boolean;
  lastRunStatus: 'success' | 'failed' | 'skipped' | 'unknown';
  grantsExtracted: number | null; // null = not yet run or unknown
}
```

**Implementation note:** Per-source extraction counts are not currently stored individually —
implement as best-effort from `progressLog` data. If unavailable, set `grantsExtracted: null`.

**Verification steps for Checkpoint 2:**

- [ ] `GET /api/admin/scraping/sources` returns 200 with the above shape
- [ ] All sources from `grant_sources.json` appear in the response
- [ ] `active: false` sources are included but flagged correctly
- [ ] `lastRunStatus` reflects the most recent run's outcome where determinable

---

## CHECKPOINT 3 — Stop after this section and verify before proceeding

### 3.1 Dashboard page component

**File:** `client/src/features/admin/ScrapingDashboard.tsx`

**Route:** Add `/admin/scraping` to `client/src/App.tsx` router (no auth required — this
is a local dev/operator tool).

**Layout — four sections stacked vertically:**

#### Section A: Summary metric row

Four metric cards in a horizontal row:
| Card | Value source |
|---|---|
| Sources active | Count of `sources` where `active === true` |
| Grants found (last run) | `lastRun.grantsFoundCount` |
| New this run | `lastRun.grantsNewCount` |
| Run status | `lastRun.status` displayed as a coloured badge |

Use the existing CSS pattern from `GrantCard.tsx` for card styling. No new CSS classes.

#### Section B: Source grid

Render one card per source from `GET /api/admin/scraping/sources`. Each card shows:

- Source name (bold)
- Scope badge (`national` / `local`)
- Active/inactive indicator
- Last run status indicator (success = green dot, failed = red dot, unknown = grey dot)
- Grants extracted count (or "—" if null)
- Link to source URL (opens in new tab)

Cards use `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`.

#### Section C: Live pipeline progress

Visible **only** when `lastRun.status === 'RUNNING'`. Renders the two-phase pipeline as a
vertical step list using `lastRun.progress`:

**Phase 1 — Searching** (active when `progress.phase === 'searching'`):

- Progress bar: `sourcesSearched / sourcesTotal`
- Current source name: `progress.currentSource` (if not null)
- Running tally: `grantsFound` grants found so far

**Phase 2 — Validating** (active when `progress.phase === 'validating'`):

- Progress bar: `grantsValidated / grantsTotal`
- Three sub-counts: Verified `grantsVerified`, Ruled out `grantsRuledOut`,
  Remaining `grantsTotal - grantsValidated`

Polling: reuse `useAgentStatus` hook — it already polls every 5 seconds when a run is active.
The dashboard reads `status.lastRun.progress` from that hook's data.

#### Section D: Run history table

Renders the last 10 runs from `GET /api/admin/scraping/history`:

| Column   | Value                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| Started  | `startedAt` formatted as relative time                                         |
| Duration | `completedAt - startedAt` in minutes/seconds, or "In progress"                 |
| Status   | Badge (SUCCESS=green, FAILED=red, RUNNING=amber, RETRYING=amber)               |
| Found    | `grantsFoundCount`                                                             |
| New      | `grantsNewCount`                                                               |
| Error    | `errorMessage` truncated to 80 chars, full text on hover via `title` attribute |

**Verification steps for Checkpoint 3:**

- [ ] `/admin/scraping` renders without errors
- [ ] Metric cards display correct values from live API data
- [ ] Source grid shows all sources with correct status dots
- [ ] Progress section is hidden when no run is active
- [ ] Progress section shows correct phase and bar values during a live run
      (trigger a run via "Search now" and navigate to the dashboard to verify)
- [ ] Run history table shows up to 10 rows, newest first
- [ ] Duration column shows "In progress" for running rows

---

## CHECKPOINT 4 — Stop here. Final wiring and polish

### 4.1 Navigation link

Add a link to `/admin/scraping` in the existing nav bar (`client/src/App.tsx` or wherever
the main nav is rendered). Label: "Scraping". Place it after the existing nav items.
Only visible in development (`import.meta.env.DEV`) to keep it out of production builds.

### 4.2 Data hooks

Create `client/src/hooks/useScrapingDashboard.ts`:

- Fetches `GET /api/admin/scraping/history` and `GET /api/admin/scraping/sources` on mount
- Re-fetches history every 10 seconds when a run is active (reuse `isRunning` from `useAgentStatus`)
- Returns `{ history, sources, isLoading, error }`

### 4.3 Error states

- If either API call fails, show an inline error message within the relevant section
- Do not crash the whole page on a single section error

### 4.4 TypeScript

- Add `ScrapeRunSummary`, `ScrapeHistoryResponse`, `SourceStatus`, `SourcesResponse` to
  `shared/src/types/agentRun.ts` and rebuild shared (`npm run build` in `shared/`)
- Import these types in both server controllers and client hooks

**Verification steps for Checkpoint 4:**

- [ ] Nav link appears in dev mode and links correctly
- [ ] `npm run typecheck` passes in both `server/` and `client/`
- [ ] No ESLint errors (`npm run lint`)
- [ ] Page re-fetches data automatically during a live run without manual refresh
- [ ] Error states display correctly when API is unavailable (test by stopping server)

---

## Do NOT change

- `crawlerService.ts`, `extractionService.ts`, `agentService.ts` — scraping logic untouched
- `AgentStatusBar.tsx` and `useAgentStatus.ts` — existing component untouched
- Any existing routes, controllers, or repositories beyond the additions specified above
- The Prisma schema
