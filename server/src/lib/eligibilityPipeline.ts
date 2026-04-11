import type Anthropic from '@anthropic-ai/sdk';
import type { Grant, Group, EligibilityVerdict, CriterionResult } from '@scout-grants/shared';
import { anthropicClient as client, CLAUDE_MODEL } from './anthropic';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentResult {
  criterion: string;
  result: 'pass' | 'fail' | 'unclear';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface PipelineResult {
  verdict: EligibilityVerdict;
  criteriaResults: CriterionResult[];
}

interface PipelineCtx {
  grant: {
    name: string;
    funder: string;
    geographicScope: string | null;
    purposes: string[];
    minAward: number | null;
    maxAward: number | null;
    deadline: string | null;
    deadlineKnown: boolean;
    description: string;
  };
  group: {
    name: string;
    postcode: string;
    region: string;
    charityNumber: string | null;
    scoutMembershipNumber: string;
    memberCount: number;
    sections: string[];
    fundingPurposes: string[];
    additionalContext: string;

    // identity
    legalStructure: string | null;
    registeredWithCharityCommission: boolean | null;
    yearEstablished: number | null;
    constitutionInPlace: boolean | null;
    bankAccountInGroupName: boolean | null;

    // location
    imdDecile: number | null;
    localAuthority: string | null;
    parliamentaryConstituency: string | null;
    communityServed: string | null;

    // financial
    annualIncome: number | null;
    annualExpenditure: number | null;
    hasCurrentAccounts: boolean | null;
    currentGrantsHeld: number | null;
    largestSingleFunderPercentage: number | null;

    // governance
    safeguardingPolicyInPlace: boolean | null;
    safeguardingPolicyReviewedWithin12Months: boolean | null;
    equalitiesPolicyInPlace: boolean | null;
    publicLiabilityInsurance: boolean | null;
    numberOfTrustees: number | null;
    trusteesAreUnrelated: boolean | null;
    hasOutstandingMonitoringReports: boolean | null;

    // programme
    volunteerCount: number | null;
    percentageFreeSchoolMeals: number | null;
    percentageDisabledOrSEND: number | null;
    specificProjectDescription: string | null;
    estimatedProjectCost: number | null;
    staffOrPaidWorkers: boolean | null;
  };
}

// ─── Stage 1: Postcode area → region lookup ───────────────────────────────────

// Keyed on the letter-only area code extracted from a UK outward code (e.g. "DE1" → "DE").
// group.region (from postcodeService) is used when available; this is a sync fallback only.
const AREA_REGION: Record<string, string> = {
  // East Midlands
  DE: 'East Midlands',
  NG: 'East Midlands',
  LE: 'East Midlands',
  LN: 'East Midlands',
  NN: 'East Midlands',
  // Yorkshire and The Humber
  BD: 'Yorkshire and The Humber',
  DN: 'Yorkshire and The Humber',
  HD: 'Yorkshire and The Humber',
  HG: 'Yorkshire and The Humber',
  HU: 'Yorkshire and The Humber',
  HX: 'Yorkshire and The Humber',
  LS: 'Yorkshire and The Humber',
  S: 'Yorkshire and The Humber',
  WF: 'Yorkshire and The Humber',
  YO: 'Yorkshire and The Humber',
  // West Midlands
  B: 'West Midlands',
  CV: 'West Midlands',
  DY: 'West Midlands',
  HR: 'West Midlands',
  ST: 'West Midlands',
  TF: 'West Midlands',
  WR: 'West Midlands',
  WS: 'West Midlands',
  WV: 'West Midlands',
  // South West
  BA: 'South West',
  BS: 'South West',
  DT: 'South West',
  EX: 'South West',
  GL: 'South West',
  PL: 'South West',
  SN: 'South West',
  SP: 'South West',
  TA: 'South West',
  TQ: 'South West',
  TR: 'South West',
  // Wales
  CF: 'Wales',
  LD: 'Wales',
  LL: 'Wales',
  NP: 'Wales',
  SA: 'Wales',
  SY: 'Wales',
  // Scotland
  AB: 'Scotland',
  DD: 'Scotland',
  DG: 'Scotland',
  EH: 'Scotland',
  FK: 'Scotland',
  G: 'Scotland',
  HS: 'Scotland',
  IV: 'Scotland',
  KA: 'Scotland',
  KW: 'Scotland',
  KY: 'Scotland',
  ML: 'Scotland',
  PA: 'Scotland',
  PH: 'Scotland',
  TD: 'Scotland',
  ZE: 'Scotland',
  // Northern Ireland
  BT: 'Northern Ireland',
  // London
  BR: 'London',
  CR: 'London',
  E: 'London',
  EC: 'London',
  EN: 'London',
  HA: 'London',
  IG: 'London',
  KT: 'London',
  N: 'London',
  NW: 'London',
  RM: 'London',
  SE: 'London',
  SM: 'London',
  SW: 'London',
  TW: 'London',
  UB: 'London',
  W: 'London',
  WC: 'London',
  WD: 'London',
  // North West
  BL: 'North West',
  CA: 'North West',
  FY: 'North West',
  LA: 'North West',
  M: 'North West',
  OL: 'North West',
  PR: 'North West',
  SK: 'North West',
  WA: 'North West',
  WN: 'North West',
  // North East
  DH: 'North East',
  DL: 'North East',
  NE: 'North East',
  SR: 'North East',
  TS: 'North East',
  // South East
  BH: 'South East',
  BN: 'South East',
  GU: 'South East',
  HP: 'South East',
  ME: 'South East',
  MK: 'South East',
  OX: 'South East',
  PO: 'South East',
  RG: 'South East',
  RH: 'South East',
  SL: 'South East',
  SO: 'South East',
  TN: 'South East',
  // East of England
  CB: 'East of England',
  CM: 'East of England',
  CO: 'East of England',
  IP: 'East of England',
  LU: 'East of England',
  NR: 'East of England',
  PE: 'East of England',
  SG: 'East of England',
  SS: 'East of England',
};

function deriveRegion(postcode: string): string {
  const area =
    postcode
      .replace(/\s+/g, '')
      .toUpperCase()
      .match(/^[A-Z]+/)?.[0] ?? '';
  return AREA_REGION[area] ?? 'England';
}

function buildContext(grant: Grant, group: Group): PipelineCtx {
  return {
    grant: {
      name: grant.name,
      funder: grant.funder,
      geographicScope: grant.geographicScope,
      purposes: [...grant.fundingPurposes],
      minAward: grant.awardMin,
      maxAward: grant.awardMax,
      deadline: grant.deadline,
      deadlineKnown: grant.deadline !== null,
      description: grant.description ?? '',
    },
    group: {
      name: group.name,
      postcode: group.postcode,
      region: group.region ?? deriveRegion(group.postcode),
      charityNumber: group.charityNumber,
      scoutMembershipNumber: group.membershipNumber,
      memberCount: group.membershipCount,
      sections: [...group.sections],
      fundingPurposes: [...group.fundingPurposes],
      additionalContext: group.additionalContext ?? '',

      legalStructure: group.legalStructure,
      registeredWithCharityCommission: group.registeredWithCharityCommission,
      yearEstablished: group.yearEstablished,
      constitutionInPlace: group.constitutionInPlace,
      bankAccountInGroupName: group.bankAccountInGroupName,

      imdDecile: group.imdDecile,
      localAuthority: group.localAuthority,
      parliamentaryConstituency: group.parliamentaryConstituency,
      communityServed: group.communityServed,

      annualIncome: group.annualIncome,
      annualExpenditure: group.annualExpenditure,
      hasCurrentAccounts: group.hasCurrentAccounts,
      currentGrantsHeld: group.currentGrantsHeld,
      largestSingleFunderPercentage: group.largestSingleFunderPercentage,

      safeguardingPolicyInPlace: group.safeguardingPolicyInPlace,
      safeguardingPolicyReviewedWithin12Months: group.safeguardingPolicyReviewedWithin12Months,
      equalitiesPolicyInPlace: group.equalitiesPolicyInPlace,
      publicLiabilityInsurance: group.publicLiabilityInsurance,
      numberOfTrustees: group.numberOfTrustees,
      trusteesAreUnrelated: group.trusteesAreUnrelated,
      hasOutstandingMonitoringReports: group.hasOutstandingMonitoringReports,

      volunteerCount: group.volunteerCount,
      percentageFreeSchoolMeals: group.percentageFreeSchoolMeals,
      percentageDisabledOrSEND: group.percentageDisabledOrSEND,
      specificProjectDescription: group.specificProjectDescription,
      estimatedProjectCost: group.estimatedProjectCost,
      staffOrPaidWorkers: group.staffOrPaidWorkers,
    },
  };
}

// ─── Stage 2: Specialist agents ───────────────────────────────────────────────

function fallbackResult(criterion: string): AgentResult {
  return {
    criterion,
    result: 'unclear',
    confidence: 'low',
    reason: 'Assessment unavailable — verify manually.',
  };
}

function isAgentResult(value: unknown): value is AgentResult {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.criterion === 'string' &&
    typeof o.reason === 'string' &&
    ['pass', 'fail', 'unclear'].includes(o.result as string) &&
    ['high', 'medium', 'low'].includes(o.confidence as string)
  );
}

async function runAgent(
  criterion: string,
  systemPrompt: string,
  userContent: string,
): Promise<AgentResult> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed: unknown = JSON.parse(text);
  if (!isAgentResult(parsed)) throw new Error(`Malformed response from ${criterion} agent`);
  return parsed;
}

const GEO_SYSTEM =
  `You assess geographic eligibility for grant applications. Given a grant's geographic scope and ` +
  `a Scout group's region and postcode, decide: "pass" if the group's location clearly falls ` +
  `within the scope (e.g. "UK-wide" or matching region); "fail" if it clearly falls outside ` +
  `(e.g. "Wales only" and group is in England); "unclear" only when genuinely ambiguous. ` +
  `Be decisive. Respond ONLY with valid JSON: ` +
  `{"criterion":"Geographic eligibility","result":"pass"|"fail"|"unclear","confidence":"high"|"medium"|"low","reason":"<one sentence>"}`;

const ORG_TYPE_SYSTEM = `You assess organisation type eligibility for grant applications.

Group profile data is provided as JSON. Use these fields:
- legalStructure: the group's legal form
- registeredWithCharityCommission: whether formally registered
- charityNumber: charity registration number if held
- constitutionInPlace: whether a governing document exists
- bankAccountInGroupName: whether a group bank account exists
- numberOfTrustees: number of governance members
- trusteesAreUnrelated: whether trustees are unrelated individuals
- yearEstablished: how long the group has been operating

Common grant requirements you should check against:
- Registered charity or constituted voluntary group required
- Minimum 3 unrelated trustees/committee members
- Governing document (constitution) must be in place
- Bank account in group name required
- Some grants exclude CICs; some require registered charities specifically
- Some funders require at least 1 year of operation

"pass" = group clearly meets typical org-type requirements
"fail" = group clearly fails a hard requirement (e.g. no constitution, only 1 trustee)
"unclear" = insufficient data to determine

Respond ONLY with valid JSON:
{"criterion":"Organisation type","result":"pass"|"fail"|"unclear","confidence":"high"|"medium"|"low","reason":"<one sentence>"}`;

const PURPOSE_SYSTEM = `You assess purpose alignment for grant applications.

Group profile data is provided as JSON. Use:
- specificProjectDescription: the structured project description
- fundingPurposes: category tags (EQUIPMENT, ACTIVITIES, INCLUSION, etc.)
- additionalContext: any supplementary context

Grant data includes description and purposes.

"pass" = strong alignment between project description and grant purposes
"unclear" = partial match or insufficient description
"fail" = clear mismatch

Respond ONLY with valid JSON:
{"criterion":"Purpose alignment","result":"pass"|"fail"|"unclear","confidence":"high"|"medium"|"low","reason":"<one sentence>"}`;

const AWARD_SIZE_SYSTEM = `You assess award size fit for grant applications.

Group profile data is provided as JSON. Use these fields:
- annualIncome: group's annual income in GBP
- estimatedProjectCost: cost of the specific project being funded
- specificProjectDescription: what the money is for
- currentGrantsHeld: number of active grants

Grant data includes minAward and maxAward in GBP.

Rules to apply:
1. If estimatedProjectCost is known: check it falls within the grant's award range.
2. If annualIncome is known: many funders cap grants at ~30% of annual income. Check
   whether maxAward exceeds 30% of annualIncome — if so, note as a risk.
3. If neither cost nor income is known: return "unclear" with "low" confidence.

"pass" = project cost fits the award range and income ratio is reasonable
"fail" = project cost clearly outside award range (e.g. needs £30k but max is £500)
"unclear" = insufficient data

Respond ONLY with valid JSON:
{"criterion":"Award size fit","result":"pass"|"fail"|"unclear","confidence":"high"|"medium"|"low","reason":"<one sentence>"}`;

const DEADLINE_SYSTEM =
  `You assess deadline viability for grant applications. Today's date is in the user message. ` +
  `Rules: unknown deadline → result="unclear", confidence="low"; ` +
  `14 or more days remaining → result="pass", confidence="high"; ` +
  `fewer than 14 days remaining → result="fail", confidence="high". ` +
  `Respond ONLY with valid JSON: ` +
  `{"criterion":"Deadline viability","result":"pass"|"fail"|"unclear","confidence":"high"|"medium"|"low","reason":"<one sentence>"}`;

const GOVERNANCE_SYSTEM = `You assess governance and compliance eligibility for grant applications.

Group profile data is provided as JSON. Check these fields:
- safeguardingPolicyInPlace: must be true for virtually all grants involving young people
- safeguardingPolicyReviewedWithin12Months: many funders require annual review
- equalitiesPolicyInPlace: increasingly required by funders
- publicLiabilityInsurance: required for activities-based grants
- constitutionInPlace: governing document required by most funders
- bankAccountInGroupName: universal requirement
- numberOfTrustees: most funders require ≥3
- trusteesAreUnrelated: trustees must be unrelated individuals
- hasOutstandingMonitoringReports: some funders bar applicants with outstanding reports

"pass" = all known governance requirements are met
"fail" = a hard requirement is clearly not met (safeguarding missing, <3 trustees, etc.)
"unclear" = key fields are null/unknown — cannot assess

Respond ONLY with valid JSON:
{"criterion":"Governance compliance","result":"pass"|"fail"|"unclear","confidence":"high"|"medium"|"low","reason":"<one sentence>"}`;

const FINANCIAL_SYSTEM = `You assess financial eligibility for grant applications.

Group profile data is provided as JSON. Check:
- annualIncome: many grants have income thresholds (min £5k, max £1m common)
- hasCurrentAccounts: funders typically require at least one set of accounts
- yearEstablished: new orgs without accounts may need to provide forecasts
- currentGrantsHeld: some funders cap concurrent grants at 1–2
- largestSingleFunderPercentage: financial sustainability risk if >50%

Grant data includes minAward and maxAward.

Common funder rules:
- Income < £5,000: often ineligible for larger grants
- Income > £1,000,000: ineligible for small community grants
- No accounts: ineligible unless org is <1 year old with a forecast
- Max grant typically capped at 30% of annual income

"pass" = financial profile clearly meets typical funder requirements
"fail" = income outside grant's likely threshold, or no accounts when required
"unclear" = annualIncome or hasCurrentAccounts is null

Respond ONLY with valid JSON:
{"criterion":"Financial health","result":"pass"|"fail"|"unclear","confidence":"high"|"medium"|"low","reason":"<one sentence>"}`;

// Deterministic pre-check: skip LLM call when all governance fields are clearly passing.
function checkGovernanceDeterministically(ctx: PipelineCtx): AgentResult | null {
  const g = ctx.group;
  const allPresent =
    g.safeguardingPolicyInPlace !== null &&
    g.safeguardingPolicyReviewedWithin12Months !== null &&
    g.equalitiesPolicyInPlace !== null &&
    g.publicLiabilityInsurance !== null &&
    g.constitutionInPlace !== null &&
    g.bankAccountInGroupName !== null &&
    g.numberOfTrustees !== null &&
    g.trusteesAreUnrelated !== null &&
    g.hasOutstandingMonitoringReports !== null;

  if (!allPresent) return null;

  const passing =
    g.safeguardingPolicyInPlace === true &&
    g.safeguardingPolicyReviewedWithin12Months === true &&
    g.equalitiesPolicyInPlace === true &&
    g.publicLiabilityInsurance === true &&
    g.constitutionInPlace === true &&
    g.bankAccountInGroupName === true &&
    (g.numberOfTrustees ?? 0) >= 3 &&
    g.trusteesAreUnrelated === true &&
    g.hasOutstandingMonitoringReports === false;

  if (passing) {
    console.log('[eligibility] Governance: deterministic pass — skipping LLM call');
    return {
      criterion: 'Governance compliance',
      result: 'pass',
      confidence: 'high',
      reason: 'All governance requirements confirmed: safeguarding, policies, insurance, trustees.',
    };
  }

  return null;
}

async function runGovernanceAgent(ctx: PipelineCtx): Promise<AgentResult> {
  const deterministic = checkGovernanceDeterministically(ctx);
  if (deterministic) return deterministic;
  return runAgent('Governance compliance', GOVERNANCE_SYSTEM, JSON.stringify(ctx));
}

// ─── Stage 3: Verdict synthesiser ────────────────────────────────────────────

const SYNTHESISER_SYSTEM =
  `You receive seven eligibility assessments for a grant application. Apply these rules in order: ` +
  `1. If ANY criterion has result="fail" AND confidence="high", verdict MUST be "LIKELY_INELIGIBLE". ` +
  `   This includes governance compliance and financial health failures. ` +
  `2. If ALL criteria are result="pass" or result="unclear" with confidence="low", verdict is "LIKELY_ELIGIBLE". ` +
  `3. Otherwise verdict is "PARTIAL". ` +
  `Write a 2-sentence summary in plain English for a Scout group leader. ` +
  `Respond ONLY with valid JSON: {"verdict":"LIKELY_ELIGIBLE"|"PARTIAL"|"LIKELY_INELIGIBLE","summary":"<two sentences>"}`;

interface SynthesiserOutput {
  verdict: EligibilityVerdict;
  summary: string;
}

function isSynthesiserOutput(value: unknown): value is SynthesiserOutput {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.summary === 'string' &&
    ['LIKELY_ELIGIBLE', 'PARTIAL', 'LIKELY_INELIGIBLE'].includes(o.verdict as string)
  );
}

// Rule-based fallback used when the synthesiser LLM call fails.
function deriveVerdictFromResults(results: AgentResult[]): EligibilityVerdict {
  if (results.some((r) => r.result === 'fail' && r.confidence === 'high')) {
    return 'LIKELY_INELIGIBLE';
  }
  if (results.every((r) => r.result === 'pass' || r.result === 'unclear')) {
    return 'LIKELY_ELIGIBLE';
  }
  return 'PARTIAL';
}

async function synthesise(ctx: PipelineCtx, results: AgentResult[]): Promise<SynthesiserOutput> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    system: SYNTHESISER_SYSTEM,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          criteria: results,
          grant: ctx.grant.name,
          group: ctx.group.name,
        }),
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed: unknown = JSON.parse(text);
  if (!isSynthesiserOutput(parsed)) throw new Error('Malformed synthesiser response');
  return parsed;
}

// ─── Stage 4: Map AgentResult[] → CriterionResult[] ──────────────────────────

function toCriterionResults(results: AgentResult[], ctx: PipelineCtx): CriterionResult[] {
  const projectValue = ctx.group.specificProjectDescription
    ? ctx.group.specificProjectDescription.slice(0, 120)
    : ctx.group.additionalContext || 'No specific need stated';

  const meta: Record<string, { id: string; requirement: string; groupValue: string }> = {
    'Geographic eligibility': {
      id: 'geo',
      requirement: ctx.grant.geographicScope ?? 'Not specified',
      groupValue: `${ctx.group.region} (${ctx.group.postcode})`,
    },
    'Organisation type': {
      id: 'org-type',
      requirement: 'Eligible voluntary youth organisation',
      groupValue: ctx.group.charityNumber
        ? `Registered charity: ${ctx.group.charityNumber}`
        : ctx.group.legalStructure ?? 'No charity number on file',
    },
    'Purpose alignment': {
      id: 'purpose',
      requirement:
        ctx.grant.purposes.length > 0 ? ctx.grant.purposes.join(', ') : 'As described by funder',
      groupValue:
        ctx.group.fundingPurposes.length > 0
          ? ctx.group.fundingPurposes.join(', ')
          : 'Not specified',
    },
    'Award size fit': {
      id: 'award-size',
      requirement:
        ctx.grant.minAward !== null && ctx.grant.maxAward !== null
          ? `£${ctx.grant.minAward.toLocaleString('en-GB')}–£${ctx.grant.maxAward.toLocaleString('en-GB')}`
          : ctx.grant.maxAward !== null
            ? `Up to £${ctx.grant.maxAward.toLocaleString('en-GB')}`
            : 'Not specified',
      groupValue: ctx.group.estimatedProjectCost
        ? `£${ctx.group.estimatedProjectCost.toLocaleString('en-GB')} estimated`
        : projectValue,
    },
    'Deadline viability': {
      id: 'deadline',
      requirement: ctx.grant.deadline
        ? `Close by ${ctx.grant.deadline.slice(0, 10)}`
        : 'Deadline unknown',
      groupValue: 'Application in preparation',
    },
    'Governance compliance': {
      id: 'governance',
      requirement: 'Safeguarding, constitution, bank account, ≥3 trustees',
      groupValue: ctx.group.safeguardingPolicyInPlace === true ? 'Safeguarding confirmed' : 'Unknown',
    },
    'Financial health': {
      id: 'financial',
      requirement: 'Accounts available, income within funder thresholds',
      groupValue: ctx.group.annualIncome
        ? `Annual income: £${ctx.group.annualIncome.toLocaleString('en-GB')}`
        : 'Income not provided',
    },
  };

  return results.map((r): CriterionResult => {
    const m = meta[r.criterion] ?? {
      id: r.criterion.toLowerCase().replace(/\s+/g, '-'),
      requirement: '',
      groupValue: '',
    };
    return {
      criterionId: m.id,
      description: r.criterion,
      requirement: m.requirement,
      groupValue: m.groupValue,
      status: r.result === 'pass' ? 'MET' : r.result === 'fail' ? 'NOT_MET' : 'UNCLEAR',
      explanation: r.reason,
    };
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runEligibilityPipeline(grant: Grant, group: Group): Promise<PipelineResult> {
  const ctx = buildContext(grant, group);
  const ctxJson = JSON.stringify(ctx);
  const today = new Date().toISOString().slice(0, 10);

  const [geo, orgType, purpose, awardSize, deadline, governance, financial] = await Promise.all([
    runAgent('Geographic eligibility', GEO_SYSTEM, ctxJson).catch(() =>
      fallbackResult('Geographic eligibility'),
    ),
    runAgent('Organisation type', ORG_TYPE_SYSTEM, ctxJson).catch(() =>
      fallbackResult('Organisation type'),
    ),
    runAgent('Purpose alignment', PURPOSE_SYSTEM, ctxJson).catch(() =>
      fallbackResult('Purpose alignment'),
    ),
    runAgent('Award size fit', AWARD_SIZE_SYSTEM, ctxJson).catch(() =>
      fallbackResult('Award size fit'),
    ),
    runAgent('Deadline viability', DEADLINE_SYSTEM, JSON.stringify({ ...ctx, today })).catch(() =>
      fallbackResult('Deadline viability'),
    ),
    runGovernanceAgent(ctx).catch(() => fallbackResult('Governance compliance')),
    runAgent('Financial health', FINANCIAL_SYSTEM, ctxJson).catch(() =>
      fallbackResult('Financial health'),
    ),
  ]);

  const agentResults = [geo, orgType, purpose, awardSize, deadline, governance, financial];

  let verdict: EligibilityVerdict;
  try {
    const synthesised = await synthesise(ctx, agentResults);
    verdict = synthesised.verdict;
  } catch {
    // Synthesiser failed — derive verdict deterministically from agent results
    verdict = deriveVerdictFromResults(agentResults);
  }

  return { verdict, criteriaResults: toCriterionResults(agentResults, ctx) };
}
