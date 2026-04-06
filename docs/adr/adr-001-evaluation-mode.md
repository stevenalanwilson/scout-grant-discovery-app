# ADR-001: Evaluation Mode for Grant Agent Quality Review

## Status

Active

## Context

The AI agent that discovers and filters grant opportunities uses Claude to extract grant data from web pages and to assess eligibility against the group's profile. Before relying on this pipeline in production, we need a way to manually evaluate the quality of the agent's output — specifically:

1. Whether the grants it finds are genuinely relevant
2. Whether the eligibility assessments it produces are accurate

Without a dedicated evaluation period, the app's default UX (hiding expired grants, throttling manual searches, showing no eligibility status on the list view) obscures the raw output of the agent and makes systematic review impractical.

## Decision

For the evaluation period we make the following temporary changes:

### 1. Remove the 24-hour manual search throttle

The `canRunManually()` guard in `agentController.triggerRun` is removed so that the "Search now" button can be triggered at any time without waiting for a cooldown period. This allows the evaluator to re-run searches on demand as grant sources or the agent prompt are adjusted.

**File affected:** `server/src/controllers/agentController.ts`

### 2. Show all grants — including expired ones — by default

`showExpired` defaults to `true` in `useGrantFilters`. The evaluator needs to see every grant the agent surfaced, not just the ones that happen to still be open. Hiding expired grants during evaluation would give a misleading picture of the agent's raw output volume and accuracy.

**File affected:** `client/src/features/grants/useGrantFilters.ts`

### 3. Surface cached eligibility verdicts on grant cards

The `/grants` list endpoint now joins the latest `EligibilityResult` for each grant (one extra DB query via Prisma `include`). The shared `Grant` type gains a `latestEligibility` field (`verdict`, `notMetCount`, `unclearCount`).

Grant cards in the list view render a colour-coded badge:

- **Green — "Likely eligible"** — LIKELY_ELIGIBLE verdict
- **Amber — "Partial match"** — PARTIAL verdict, with count of unmet criteria
- **Red — "Likely ineligible"** — LIKELY_INELIGIBLE verdict, dimmed to 50% opacity (restored on hover/focus)

This surfaces AI assessments at a glance without requiring the evaluator to open each grant individually.

**Files affected:**

- `shared/src/types/grant.ts` — new `GrantEligibilitySummary` interface and `latestEligibility` field on `Grant`
- `server/src/repositories/grantRepository.ts` — `findAllByGroupIdForList` includes eligibility
- `server/src/types/mappers.ts` — `mapGrant` maps eligibility results
- `client/src/components/GrantCard.tsx` — eligibility badge rendering
- `client/src/styles/global.css` — badge and dimmed-card styles

## Consequences

### Positive

- Evaluators can run searches freely and immediately see the full, unfiltered result set with eligibility verdicts inline — reducing the review cycle from minutes (clicking into each card) to seconds (scanning the list).
- The eligibility verdict on the card is a lazy read — it shows whatever is already in the DB from previous `Check eligibility` clicks, with zero additional AI calls.
- The `latestEligibility` field on `Grant` is a natural long-term addition; it can be kept after the evaluation period to provide persistent eligibility status in the production UI.

### Negative / Risks

- **Removing the throttle** means a misconfigured or looping client could trigger many consecutive agent runs, consuming Anthropic API credits. Restore the throttle once evaluation is complete (see rollback below).
- **Expired grants** remaining visible after the evaluation period could confuse end users. Revert `showExpired` default to `false` post-evaluation.
- The `latestEligibility` join adds a small overhead to every `/grants` list request. For the current data scale (tens of grants per group) this is negligible, but should be profiled if grant counts grow significantly.

## Rollback / Post-Evaluation Steps

When the evaluation period ends:

1. Restore the 24-hour throttle in `agentController.triggerRun` (re-add the `canRunManually` check).
2. Revert `showExpired` default back to `false` in `useGrantFilters`.
3. Decide whether to keep `latestEligibility` in the list response for the production UI (recommended: keep, but only show the badge for eligible/partial verdicts, not dim ineligible cards).
