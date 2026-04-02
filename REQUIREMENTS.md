# Scout Grant Finder — Product Requirements

> This file is the authoritative product specification for the Scout Grant Finder app.
> It is intended to be read by Claude Code at the start of any build session to establish
> full context before writing code, creating files, or making architectural decisions.

---

## Product overview

Scout Grant Finder helps Scouting leaders in the UK discover grant funding opportunities
and check whether their group is eligible for each one. It does not handle applications,
expenditure tracking, or reporting — those are explicitly out of scope.

The core value proposition is time saving: a Scout leader should be able to understand
which grants exist for their group and whether they qualify in minutes, not hours.

---

## Scope boundaries

**In scope**

- Group profile setup
- AI agent-driven grant discovery (weekly automated runs)
- Eligibility checking against each discovered grant
- Source transparency (source URL + last-checked date on every grant)

**Explicitly out of scope**

- Submitting or managing grant applications
- Tracking expenditure or milestones against awarded grants
- Generating funder reports
- Multi-leader collaboration or account sharing
- District Commissioner roll-up views

---

## Users

The primary user is a **Scout leader** — a volunteer (not a professional fundraiser) who
runs one or more sections within a Scout group. They are typically time-poor, may be
accessing the app on a mobile device, and are not expected to have prior knowledge of
grant funding. They may have a visual impairment or other accessibility need.

---

## Grant sources

Grant sources are defined in `grant_sources.json` in the project root. The agent reads
this file at runtime. Only entries where `"active": true` are searched.

To add, remove, or disable a source: edit `grant_sources.json` and redeploy. No admin
interface exists or should be built for this.

### Schema

```json
{
  "version": "1.0",
  "last_updated": "YYYY-MM-DD",
  "sources": [
    {
      "id": "unique-kebab-case-id",
      "name": "Human-readable funder name",
      "url": "https://funder.example.com/grants",
      "scope": "national",
      "categories": [
        "equipment",
        "activities",
        "inclusion",
        "facilities",
        "community",
        "wellbeing"
      ],
      "search_strategy": "crawl",
      "active": true
    },
    {
      "id": "local-source-example",
      "name": "Local Authority Grants — Derbyshire",
      "url": "https://www.derbyshire.gov.uk/community/grants/grants.aspx",
      "scope": "local",
      "region": "East Midlands",
      "categories": ["activities", "inclusion", "wellbeing"],
      "search_strategy": "crawl",
      "active": true
    }
  ]
}
```

### Field definitions

| Field             | Required | Description                                                    |
| ----------------- | -------- | -------------------------------------------------------------- |
| `id`              | Yes      | Unique identifier, kebab-case                                  |
| `name`            | Yes      | Display name shown in source attribution                       |
| `url`             | Yes      | Entry point URL the agent crawls                               |
| `scope`           | Yes      | `"national"` or `"local"`                                      |
| `region`          | If local | ONS region name — used to match against group postcode         |
| `categories`      | Yes      | Array of funding purpose categories this source covers         |
| `search_strategy` | Yes      | `"crawl"` for now; `"api"` and `"rss"` reserved for future use |
| `active`          | Yes      | `false` disables the source without removing it                |
| `note`            | No       | Developer note, e.g. "Verify URL before activating"            |

---

## User stories

Stories are grouped by epic. Each story has a unique ID, a MoSCoW priority, and
acceptance criteria. Build must-have stories before should-have, and should-have
before nice-to-have.

Priority key:

- **Must have** — MVP is not shippable without this
- **Should have** — Important; include if at all possible
- **Nice to have** — Desirable but deferrable

---

## Epic 1 — Group profile

_The group profile is the foundation of everything else. Eligibility checking and agent
search queries are both derived from it. It must be set up before any other feature
is usable._

---

### GP-01 — Group details entry

**Priority:** Must have

**Story:**
As a Scout leader, I want to enter my group's details so that the app can use this
to find and assess grants on my behalf.

**Acceptance criteria:**

- Fields: group name, Scout Association membership number, charity number (optional),
  postcode, sections run (Squirrels, Beavers, Cubs, Scouts, Explorers, Network),
  approximate membership count
- Charity number validated against the Charity Commission register for England & Wales;
  flagged as optional for Scottish and Northern Irish groups
- Profile saved and editable at any time
- Profile data used automatically in all eligibility checks — user is never asked to
  re-enter it

---

### GP-02 — Funding purposes

**Priority:** Must have

**Story:**
As a Scout leader, I want to describe what my group needs funding for so that the app
can match me to relevant grants.

**Acceptance criteria:**

- User selects one or more categories from: equipment, activities, inclusion,
  facilities, community, wellbeing
- Free-text field for additional context (max 300 characters)
- Funding purposes saved to profile and used to filter grant results
- User can update purposes without losing other profile data

---

### GP-03 — Deprivation and rurality signals

**Priority:** Should have

**Story:**
As a Scout leader, I want to indicate whether my group is in a deprived or rural area
so that grants targeting those areas are surfaced for me.

**Acceptance criteria:**

- Deprivation indicator derived automatically from postcode using Index of Multiple
  Deprivation (IMD) data
- Rural/urban classification derived from postcode using ONS Rural Urban Classification
- User can manually override either derived value with a reason
- These signals are used as soft filters — they surface relevant grants, not exclude others

---

## Epic 2 — Agent behaviour

_These stories describe background system behaviour. The agent runs invisibly to the user
but determines the quality of all discovery results. Build these before the results
presentation stories._

---

### AG-01 — Weekly automated run

**Priority:** Must have

**Story:**
As the system, I need the agent to run automatically every week for each active group
profile so that grant results stay current without any action from the leader.

**Acceptance criteria:**

- Agent run scheduled every 7 days from the date the profile was first saved
- Runs triggered at off-peak hours (02:00–05:00 UTC) to minimise API costs
- Each run scoped to a single group profile — runs are independent per group
- Failed runs logged with reason; retried once within 24 hours before surfacing an
  error state to the user
- Run history stored: timestamp, grants found, grants new since last run, duration

---

### AG-02 — Profile-driven search brief

**Priority:** Must have

**Story:**
As the system, I need the agent to use the group profile as its search brief so that
it only searches for grants relevant to that specific group.

**Acceptance criteria:**

- Agent prompt constructed from: funding purposes, sections run, postcode/region,
  membership size, charitable status, deprivation/rural flags
- Search queries generated dynamically from the profile — not a fixed keyword list
- Agent searches only sources listed in `grant_sources.json` where `"active": true`
- Local sources (`"scope": "local"`) only searched when the group's region matches
  the source's `"region"` field
- Agent performs multiple targeted searches per run rather than a single broad query

---

### AG-03 — Structured data extraction

**Priority:** Must have

**Story:**
As the system, I need the agent to extract structured grant data from each source it
finds so that results can be displayed consistently and used for eligibility checking.

**Acceptance criteria:**

- Fields extracted per grant: name, funder, description, funding purposes, award range
  (min/max), eligibility criteria, geographic scope, application deadline, source URL,
  date retrieved
- Where a field is not found, it is stored as `null` — not guessed or inferred
- Extraction uses the full source page content, not just search snippet text
- Grants where key fields (deadline, award amount) could not be extracted are flagged
  for user awareness with a "details incomplete" indicator

---

### AG-04 — Weekly diff against previous results

**Priority:** Must have

**Story:**
As the system, I need the agent to diff each weekly run against the previous results
so that users are only notified of grants that are genuinely new or materially changed.

**Acceptance criteria:**

- New grants (not seen in previous run) flagged as `"new"`
- Changed grants (deadline, award amount, or eligibility criteria updated) flagged
  as `"updated"`
- Grants no longer found at source flagged as `"may_have_closed"` — not silently removed
- Unchanged grants carry forward without re-alerting the user
- Primary deduplication key: source URL. Secondary key: grant name + funder name
  (catches URL changes on the same grant)

---

### AG-05 — Manual re-run trigger

**Priority:** Should have

**Story:**
As a Scout leader, I want to trigger a manual re-run of the agent so that I can refresh
results when I know a new funding round has opened.

**Acceptance criteria:**

- Manual re-run available from the grant results page
- User shown a progress indicator while the run is in progress
- Manual run resets the 7-day schedule (next automatic run = 7 days from manual run)
- Maximum one manual run per 24-hour period per group

---

### AG-06 — Run status visibility

**Priority:** Should have

**Story:**
As a Scout leader, I want to see when the agent last ran and whether it found anything
new so that I know how fresh my results are.

**Acceptance criteria:**

- Last run timestamp shown on the grant results page in plain language
  (e.g. "Last searched 3 days ago")
- Count of new or updated grants since last run shown as a badge
- Next scheduled run date shown
- If the last run failed, a non-alarming message is shown explaining results may be
  older than expected; user is not shown a technical error

---

### AG-07 — Automatic search broadening

**Priority:** Nice to have

**Story:**
As a Scout leader, I want the agent to broaden its search if it consistently finds
few results so that I am not stuck with a thin list due to an overly narrow search.

**Acceptance criteria:**

- If two consecutive runs return fewer than 3 new grants, the agent widens search terms
- Widening strategy: loosen geographic restriction first, then broaden funding purpose
  categories
- User notified when broadening occurs with a plain-language message
- User can revert to original search scope from profile settings

---

## Epic 3 — Grant results and presentation

_How discovered grants are shown to the leader. Depends on Epic 2 (agent) being built first._

---

### GD-01 — Grant results list

**Priority:** Must have

**Story:**
As a Scout leader, I want to see all grants the agent has found for my group in a clear
list sorted by deadline so that I can see what needs attention first.

**Acceptance criteria:**

- Default sort: soonest deadline first
- Each card shows: grant name, funder, award range, deadline (colour-coded),
  eligibility verdict, "New" or "Updated" badge where applicable
- Deadline colour coding: red = closes within 14 days, amber = 15–30 days,
  green = 31+ days
- Grants flagged `"may_have_closed"` shown with a warning indicator
- Expired grants hidden by default; accessible via "Show closed" toggle
- Empty state explains the agent schedule and shows the next run date

---

### GD-02 — Filtering and sorting

**Priority:** Should have

**Story:**
As a Scout leader, I want to filter and sort my grant results by award size, deadline,
and funding purpose so that I can focus on what's most relevant at any given time.

**Acceptance criteria:**

- Filter options: funding purpose category, minimum award amount, maximum award amount,
  deadline range, eligibility verdict
- Sort options: deadline (default), award amount high to low, award amount low to high,
  date added by agent
- Active filters shown with a one-tap clear option
- Filter state persists within the session

---

### GD-03 — Shortlist

**Priority:** Should have

**Story:**
As a Scout leader, I want to save grants to a shortlist so that I can compare a handful
of strong candidates without losing them in the full results list.

**Acceptance criteria:**

- Shortlist accessible from main navigation
- Shortlist persists across sessions
- Shortlisted grants continue to reflect the latest agent data (updated deadlines,
  eligibility status)
- User can remove grants from the shortlist at any time

---

### GD-04 — Weekly email digest

**Priority:** Nice to have

**Story:**
As a Scout leader, I want to receive a weekly email digest of new and updated grants
so that I stay informed without having to open the app.

**Acceptance criteria:**

- Digest sent within 2 hours of the weekly agent run completing
- Email lists new and updated grants only — not the full results
- Each entry includes: grant name, funder, deadline, award range, deep link into the app
- Digest only sent if there is at least one new or updated grant to report
- Digest frequency configurable; can be disabled independently of the agent run

---

## Epic 4 — Source transparency and trust

_Because results are AI-generated rather than curated, users need clear signals about
provenance and freshness. These stories protect user trust and are non-negotiable._

---

### TR-01 — Source link and last-checked date

**Priority:** Must have

**Story:**
As a Scout leader, I want to see a source link and a "last checked" date on every grant
so that I can verify the information myself and know how current it is.

**Acceptance criteria:**

- Source URL displayed on every grant detail page as a visible, tappable link
- Last checked date shown in plain language (e.g. "Checked 4 days ago")
- Source URL opens in the user's browser — not within the app
- Where the agent retrieved data from multiple pages, the primary funder homepage is
  shown as the source
- Grants where the source URL is no longer reachable are flagged:
  "Source page unavailable — details may be out of date"

---

### TR-02 — AI-generated content disclaimer

**Priority:** Should have

**Story:**
As a Scout leader, I want a clear disclaimer on each result explaining that information
was gathered by an AI agent and may not be fully accurate so that I know to verify
critical details before committing time to an application.

**Acceptance criteria:**

- Disclaimer shown prominently on first visit to results
- Persistent small-format note on each grant card thereafter
- Disclaimer text is plain English, non-alarming, and tells the user what to verify
  (deadline, eligibility, award amount) and where (source link)
- Disclaimer cannot be permanently dismissed

---

## Epic 5 — Eligibility checking

_The highest-value feature. Eligibility checking uses the group profile plus a small
number of grant-specific questions to give the leader an instant verdict._

---

### EL-01 — Eligibility summary

**Priority:** Must have

**Story:**
As a Scout leader, I want to see a clear eligibility summary for each grant showing
which criteria my group meets, which it does not, and which are unclear so that I can
quickly decide whether a grant is worth pursuing.

**Acceptance criteria:**

- Eligibility presented as a checklist: met (green), not met (red),
  unclear/needs checking (amber)
- Each criterion shows the grant's requirement and how the group's profile compares
- Overall verdict shown prominently: "Likely eligible", "Likely ineligible",
  or "Partial — review needed"
- Verdict is advisory only — user is not prevented from shortlisting any grant

---

### EL-02 — Automated profile-based checks

**Priority:** Must have

**Story:**
As a Scout leader, I want eligibility checked automatically against my profile so that
I do not have to read the full grant guidelines myself.

**Acceptance criteria:**

- Criteria automatically checked: registered charity requirement, geographic restriction,
  beneficiary age range vs sections run, minimum/maximum membership size,
  Scouting-specific eligibility (e.g. "youth organisations" vs "registered charities")
- Checks use profile data without asking the user to re-enter anything
- Where a criterion cannot be determined from the profile, it is flagged as "unclear"
  with guidance on how to verify
- Eligibility logic is transparent — user can see why each criterion passed or failed

---

### EL-03 — Supplementary eligibility questions

**Priority:** Must have

**Story:**
As a Scout leader, I want to answer a small number of additional questions when my
profile is insufficient so that I get an accurate eligibility result without filling
out a full application.

**Acceptance criteria:**

- Additional questions only shown when a criterion cannot be resolved from the profile
- Maximum 5 additional questions per grant
- Questions are plain English — no grant jargon
- Answers saved against the grant record for the current session

---

### EL-04 — Plain-English explanation of failed criteria

**Priority:** Should have

**Story:**
As a Scout leader, I want a plain-English explanation of any criteria I do not meet
so that I understand whether there is flexibility or whether I should move on.

**Acceptance criteria:**

- Explanation written at a reading age accessible to a non-specialist volunteer
- Where a criterion is a hard blocker, this is stated clearly
- Where a criterion might be interpreted flexibly, that nuance is noted
- Link to the original grant guidelines provided for the user to verify

---

### EL-05 — Award range display

**Priority:** Should have

**Story:**
As a Scout leader, I want to see the award range for each opportunity so that I can
judge whether it is worth investigating further before checking eligibility in detail.

**Acceptance criteria:**

- Minimum and maximum award amounts shown on the grant card and detail page
- Where a typical or average award is known, this is shown alongside the range
- All amounts shown in GBP (£)
- Where award amount is not published, this is stated clearly rather than left blank

---

### EL-06 — Similar grant suggestions

**Priority:** Nice to have

**Story:**
As a Scout leader, I want to see similar grants to one I am viewing so that I can
discover alternatives if this one is not a strong fit.

**Acceptance criteria:**

- Similar grants based on: shared funding purpose categories, overlapping geographic
  eligibility, comparable award range
- Maximum 3 suggestions shown
- Each suggestion shows its own eligibility verdict for the user's group

---

## Epic 6 — Non-functional requirements

---

### NF-01 — Mobile usability

**Priority:** Must have

**Story:**
As a Scout leader, I want the app to work well on my phone so that I can check grants
whenever I have a spare moment.

**Acceptance criteria:**

- Responsive layout functional at 375px viewport width and above
- Core journeys (set up profile, view results, check eligibility) completable on mobile
- All tap targets minimum 44×44px
- No horizontal scrolling on any screen

---

### NF-02 — Security and data handling

**Priority:** Must have

**Story:**
As a Scout leader, I want to trust that my group's information is handled securely so
that I feel confident entering it into the app.

**Acceptance criteria:**

- All data encrypted in transit (TLS 1.2 minimum) and at rest
- Authentication required to access profile and eligibility data
- GDPR-compliant privacy notice presented at sign-up
- No group data shared with grant bodies or third parties without explicit user consent
- User can delete their account and all associated data

---

### NF-03 — Accessibility

**Priority:** Should have

**Story:**
As a Scout leader with accessibility needs, I want the app to meet WCAG 2.1 AA standards
so that I can use it regardless of any visual or motor impairment.

**Acceptance criteria:**

- Colour contrast ratio minimum 4.5:1 for all body text
- All interactive elements keyboard navigable
- All images and icons have descriptive alt text
- Eligibility verdicts conveyed by text and icon — not colour alone
- Screen reader tested against NVDA (Windows) and VoiceOver (iOS)

---

### NF-04 — Performance on slow connections

**Priority:** Should have

**Story:**
As a Scout leader in a rural area, I want the app to load quickly on a poor connection
so that I can use it at the scout hut or on site.

**Acceptance criteria:**

- Core pages load under 3 seconds on a simulated 3G connection
- Grant list page functional with JavaScript disabled (progressive enhancement)
- Images lazy-loaded and compressed
- No single page resource exceeds 500KB uncompressed

---

## Data model summary

The following entities are implied by the stories above. Use this as a guide when
designing the database schema.

### Group

- id, name, membership_number, charity_number, postcode, region, sections[],
  membership_count, funding_purposes[], deprivation_flag, rural_flag,
  created_at, updated_at

### AgentRun

- id, group_id, started_at, completed_at, status (success/failed/retrying),
  grants_found_count, grants_new_count, error_message

### Grant

- id, group_id, source_id, name, funder, description, funding_purposes[],
  award_min, award_max, award_typical, eligibility_criteria[], geographic_scope,
  deadline, source_url, retrieved_at, status (new/updated/active/may_have_closed/expired)

### EligibilityResult

- id, grant_id, group_id, verdict (likely_eligible/partial/likely_ineligible),
  criteria_results[], supplementary_answers[], assessed_at

---

## Key constraints and decisions

- **Grant sources are hard-coded** in `grant_sources.json`. No admin interface should
  be built for managing them.
- **Eligibility verdicts are advisory.** The app must never block a user from
  shortlisting or viewing a grant based on eligibility.
- **AI-generated content must always be attributed.** Every grant result must carry
  its source URL and last-checked date. Do not display grant data without these fields.
- **The agent runs per group, not globally.** Each group's search is independent and
  scoped to that group's profile.
- **No application functionality.** If a future session introduces application-related
  features, treat this file as the source of truth that they are out of scope unless
  this document is explicitly updated.
