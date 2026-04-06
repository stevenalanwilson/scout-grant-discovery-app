# Specification: Eligibility Pipeline Dashboard

## Purpose

A developer/operator dashboard giving full visibility into how grant eligibility is assessed —
which agents ran, what each one decided, how confident they were, and how the synthesiser
produced the final verdict. Accessible at `/admin/eligibility`.

## Codebase context

- Pipeline orchestrator: `server/src/lib/eligibilityPipeline.ts` — `runEligibilityPipeline()`
- Five agents: Geographic, Organisation type, Purpose alignment, Award size fit, Deadline viability
- Synthesiser: also in `eligibilityPipeline.ts` — `synthesise()`
- Shared types: `shared/src/types/eligibility.ts` — `EligibilityResult`, `CriterionResult`,
  `EligibilityVerdict`, `CriterionStatus`
- DB table: `EligibilityResult` — stores `verdict`, `criteriaResults` (JSON), `assessedAt`
- Existing API: `GET /api/eligibility/:grantId` → `EligibilityResult | null`

---

## CHECKPOINT 1 — Stop after this section and verify before proceeding

### 1.1 New API endpoint: `GET /api/admin/eligibility/recent`

**File:** `server/src/routes/eligibility.ts` (add route) + new method in
`server/src/controllers/eligibilityController.ts`

**Response shape:**

```ts
interface RecentEligibilityResponse {
  results: EligibilityResultSummary[];
}

interface EligibilityResultSummary {
  id: string;
  grantId: string;
  grantName: string; // joined from Grant table
  funder: string; // joined from Grant table
  verdict: EligibilityVerdict;
  criteriaResults: CriterionResult[];
  assessedAt: string;
}
```

**Repository:** Add `eligibilityRepository.findRecentWithGrant(groupId, limit = 20)` in
`server/src/repositories/eligibilityRepository.ts`. Use Prisma's `include: { grant: true }`
to avoid N+1 queries.

**Verification steps for Checkpoint 1:**

- [ ] `GET /api/admin/eligibility/recent` returns 200 with the above shape
- [ ] Returns up to 20 results, most recent first
- [ ] Each result includes `grantName` and `funder` populated from the joined grant
- [ ] `criteriaResults` is an array of 5 elements (one per specialist agent)
- [ ] `verdict` values are one of: `LIKELY_ELIGIBLE`, `PARTIAL`, `LIKELY_INELIGIBLE`

---

## CHECKPOINT 2 — Stop after this section and verify before proceeding

### 2.1 New API endpoint: `GET /api/admin/eligibility/stats`

**File:** Same route file and controller as Checkpoint 1.

**Response shape:**

```ts
interface EligibilityStatsResponse {
  totalAssessed: number;
  verdictBreakdown: {
    LIKELY_ELIGIBLE: number;
    PARTIAL: number;
    LIKELY_INELIGIBLE: number;
  };
  criterionPassRates: {
    criterionId: string;
    description: string;
    metCount: number;
    notMetCount: number;
    unclearCount: number;
    passRate: number; // metCount / totalAssessed, 0-1, rounded to 2dp
  }[];
}
```

**Implementation:** Query all `EligibilityResult` rows for the group, parse `criteriaResults`
JSON, and aggregate. Compute pass rates server-side so the client receives ready-to-display
numbers.

**Verification steps for Checkpoint 2:**

- [ ] `GET /api/admin/eligibility/stats` returns 200 with the above shape
- [ ] `verdictBreakdown` counts sum to `totalAssessed`
- [ ] `criterionPassRates` has exactly 5 entries (one per agent criterion)
- [ ] `passRate` values are between 0 and 1 inclusive

---

## CHECKPOINT 3 — Stop after this section and verify before proceeding

### 3.1 Dashboard page component

**File:** `client/src/features/admin/EligibilityDashboard.tsx`

**Route:** Add `/admin/eligibility` to `client/src/App.tsx`.

**Layout — four sections stacked vertically:**

#### Section A: Summary metric row

Four metric cards in a horizontal row:

| Card              | Value source                               |
| ----------------- | ------------------------------------------ |
| Total assessed    | `stats.totalAssessed`                      |
| Likely eligible   | `stats.verdictBreakdown.LIKELY_ELIGIBLE`   |
| Requires review   | `stats.verdictBreakdown.PARTIAL`           |
| Likely ineligible | `stats.verdictBreakdown.LIKELY_INELIGIBLE` |

Colour the last three cards semantically: green for eligible, amber for review, red for ineligible.
Use CSS custom properties (`var(--color-success)` etc.) — no hardcoded hex values.

#### Section B: Agent performance table

Renders `stats.criterionPassRates` as a table with one row per agent:

| Column    | Value                                                   |
| --------- | ------------------------------------------------------- |
| Agent     | `description`                                           |
| Met       | `metCount`                                              |
| Not met   | `notMetCount`                                           |
| Unclear   | `unclearCount`                                          |
| Pass rate | `(passRate * 100).toFixed(0)%` with a thin progress bar |

The progress bar for each row uses the same width as `passRate * 100%`. Bar colour:

- ≥ 70% → `var(--color-success-border)` (green)
- 40–69% → `var(--color-warning-border)` (amber)
- < 40% → `var(--color-danger-border)` (red)

This section gives immediate visibility into which agents are the most common blockers.

#### Section C: Recent assessments list

Renders results from `GET /api/admin/eligibility/recent` as an expandable list.
Each item shows collapsed by default:

**Collapsed view:**

- Grant name + funder
- Verdict badge (`LIKELY_ELIGIBLE` = green, `PARTIAL` = amber, `LIKELY_INELIGIBLE` = red)
- Assessed timestamp (relative)
- Expand button (chevron icon using CSS, not an icon library)

**Expanded view** (toggled by clicking the row):
Renders the five agent criterion results as a mini pipeline view:

For each `CriterionResult`:

- Criterion name (`description`)
- Status icon: ✓ for MET, ✗ for NOT_MET, ? for UNCLEAR
- Requirement vs group value (two-column layout)
- Explanation text (full `explanation` string)

The expanded view must clearly show how each agent's output contributed to the final verdict.
Highlight any `NOT_MET` criteria with a red left border to draw the eye to blockers.

**Interaction:** Only one item can be expanded at a time. Clicking an expanded item collapses it.
Manage this with a single `expandedId: string | null` state variable.

#### Section D: Verdict distribution mini-chart

A horizontal stacked bar showing the verdict breakdown as proportions of `totalAssessed`.
Three segments: green (eligible) / amber (partial) / red (ineligible).
Labelled with percentages inside each segment if the segment is wide enough (> 10%), otherwise label outside.
Implemented as plain CSS `flexbox` — no chart library required.

**Verification steps for Checkpoint 3:**

- [ ] `/admin/eligibility` renders without errors
- [ ] Metric cards show correct counts from the stats API
- [ ] Agent performance table has exactly 5 rows
- [ ] Pass rate bars are correctly coloured based on thresholds
- [ ] Recent assessments list renders up to 20 rows, newest first
- [ ] Clicking a row expands it and shows all 5 criterion results
- [ ] Clicking an already-expanded row collapses it
- [ ] Clicking a different row collapses the previous one
- [ ] `NOT_MET` criteria have a visible red left border
- [ ] Verdict distribution bar renders with correct proportional widths

---

## CHECKPOINT 4 — Stop here. Final wiring and polish

### 4.1 Navigation link

Add a link to `/admin/eligibility` in the main nav bar. Label: "Eligibility". Only visible in
development (`import.meta.env.DEV`). Place it adjacent to the Scraping nav link from the
scraping dashboard spec.

### 4.2 Data hook

Create `client/src/hooks/useEligibilityDashboard.ts`:

- Fetches `GET /api/admin/eligibility/recent` and `GET /api/admin/eligibility/stats` on mount
- No polling required (eligibility results are written synchronously on demand)
- Re-fetches when the window regains focus (`window.addEventListener('focus', ...)`)
- Returns `{ recentResults, stats, isLoading, error }`

### 4.3 Pipeline trace view (stretch goal — implement if time allows)

When a row is expanded in Section C, add a "Trace pipeline" button below the criterion results.
Clicking it renders a vertical timeline showing:

1. Orchestrator — context normalisation (group + grant fields used)
2. Five agents — shown in parallel columns with their result badges
3. Synthesiser — rule applied (which hard-block rule fired, or "all-pass" path)
4. Final verdict

Use only CSS for layout — no SVG, no canvas. The data for this view comes entirely from
the `CriterionResult[]` already loaded — no additional API call required.

**Verification steps for Checkpoint 4:**

- [ ] Nav link appears in dev mode and links correctly
- [ ] `npm run typecheck` passes in both `server/` and `client/`
- [ ] No ESLint errors (`npm run lint`)
- [ ] Page re-fetches automatically on window focus
- [ ] If stretch goal implemented: pipeline trace renders and shows correct rule logic

### 4.4 TypeScript

- Add `EligibilityResultSummary`, `RecentEligibilityResponse`, `EligibilityStatsResponse`,
  and `CriterionPassRate` to `shared/src/types/eligibility.ts`
- Rebuild shared (`npm run build` in `shared/`)
- Both server controllers and client hooks import from `@scout-grants/shared`

---

## Do NOT change

- `eligibilityPipeline.ts` — agent logic and prompts untouched
- `eligibilityService.ts` — existing `assessEligibility()` and `getEligibilityResult()` untouched
- `eligibilityRepository.ts` — only add the new `findRecentWithGrant` method; do not modify existing methods
- Any existing eligibility UI components in `client/src/features/eligibility/`
- The Prisma schema
