import Anthropic from '@anthropic-ai/sdk';
import type { Group, EligibilityVerdict, CriterionResult, EligibilityResult } from '@scout-grants/shared';
import type { Grant } from '@scout-grants/shared';
import { eligibilityRepository } from '../repositories/eligibilityRepository';
import { grantRepository } from '../repositories/grantRepository';
import { groupRepository } from '../repositories/groupRepository';
import { mapGrant, mapGroup } from '../types/mappers';
import type { AppError } from '../middleware/errorHandler';

const ELIGIBILITY_TOOL: Anthropic.Tool = {
  name: 'assess_eligibility',
  description: 'Assess whether a Scout group is eligible for a grant.',
  input_schema: {
    type: 'object' as const,
    properties: {
      verdict: {
        type: 'string',
        enum: ['LIKELY_ELIGIBLE', 'PARTIAL', 'LIKELY_INELIGIBLE'],
        description:
          'Overall eligibility verdict. LIKELY_ELIGIBLE = most/all criteria met. PARTIAL = some met, some unclear or not met. LIKELY_INELIGIBLE = key criteria not met.',
      },
      criteria_results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            criterionId: { type: 'string' },
            description: { type: 'string' },
            requirement: { type: 'string', description: "The funder's requirement" },
            groupValue: { type: 'string', description: "The group's relevant value or characteristic" },
            status: {
              type: 'string',
              enum: ['MET', 'NOT_MET', 'UNCLEAR'],
            },
            explanation: {
              type: 'string',
              description: 'Plain English explanation of why this criterion passed, failed, or is unclear',
            },
          },
          required: ['criterionId', 'description', 'requirement', 'groupValue', 'status', 'explanation'],
        },
      },
      supplementary_questions: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            question: { type: 'string', description: 'Plain English question to ask the leader' },
            hint: { type: ['string', 'null'], description: 'Optional hint to help the leader answer' },
          },
          required: ['id', 'question'],
        },
        description: 'Up to 5 questions for criteria that cannot be resolved from the profile alone. Null if no questions needed.',
      },
    },
    required: ['verdict', 'criteria_results'],
  },
};

const SYSTEM_PROMPT = `You are an expert in UK grant eligibility for voluntary youth organisations,
specifically Scout groups registered with The Scout Association.

Assess whether the given Scout group meets each eligibility criterion for the grant.
Be specific and transparent — show your reasoning for each criterion.

Rules:
- Base all checks on the group profile provided. Never ask for information already in the profile.
- Mark a criterion MET only when the profile clearly satisfies it.
- Mark a criterion NOT_MET only when the profile clearly fails it.
- Mark a criterion UNCLEAR when insufficient information is available — list these as supplementary questions.
- Maximum 5 supplementary questions. Prioritise questions that are most likely to change the verdict.
- Write explanations at reading age 14 — no jargon, no grant-speak.
- The verdict must reflect the criteria results: if all MET → LIKELY_ELIGIBLE; if any NOT_MET key criteria → LIKELY_INELIGIBLE; otherwise → PARTIAL.`;

function buildUserMessage(grant: Grant, group: Group, supplementaryAnswers?: Record<string, string>): string {
  const answersText =
    supplementaryAnswers && Object.keys(supplementaryAnswers).length > 0
      ? `\nSupplementary answers provided by the leader:\n${Object.entries(supplementaryAnswers)
          .map(([q, a]) => `- ${q}: ${a}`)
          .join('\n')}`
      : '';

  const criteria =
    grant.eligibilityCriteria && grant.eligibilityCriteria.length > 0
      ? grant.eligibilityCriteria
          .map((c) => `- ${c.description}: ${c.requirement}`)
          .join('\n')
      : 'No specific criteria extracted — use general grant eligibility principles for UK youth charities.';

  return `Grant: ${grant.name}
Funder: ${grant.funder}
Description: ${grant.description ?? 'Not available'}
Geographic scope: ${grant.geographicScope ?? 'Not specified'}
Award range: ${grant.awardMin != null ? `£${grant.awardMin}` : 'unknown'} – ${grant.awardMax != null ? `£${grant.awardMax}` : 'unknown'}

Eligibility criteria:
${criteria}

Group profile:
- Name: ${group.name}
- Membership number: ${group.membershipNumber}
- Charity number: ${group.charityNumber ?? 'Not registered (or not provided)'}
- Postcode: ${group.postcode}
- Region: ${group.region ?? 'Unknown'}
- Sections: ${group.sections.join(', ')}
- Membership count: ${group.membershipCount}
- Funding purposes: ${group.fundingPurposes.join(', ')}
- Deprived area: ${group.deprivationFlag != null ? (group.deprivationFlag ? 'Yes' : 'No') : 'Unknown'}
- Rural area: ${group.ruralFlag != null ? (group.ruralFlag ? 'Yes' : 'No') : 'Unknown'}
${answersText}`;
}

interface AssessToolResult {
  verdict: EligibilityVerdict;
  criteria_results: Array<{
    criterionId: string;
    description: string;
    requirement: string;
    groupValue: string;
    status: 'MET' | 'NOT_MET' | 'UNCLEAR';
    explanation: string;
  }>;
  supplementary_questions?: Array<{ id: string; question: string; hint?: string | null }> | null;
}

function makeEligibilityResult(
  id: string,
  grantId: string,
  groupId: string,
  assessed: AssessToolResult,
  supplementaryAnswers: Record<string, string> | null,
  assessedAt: string,
): EligibilityResult {
  return {
    id,
    grantId,
    groupId,
    verdict: assessed.verdict,
    criteriaResults: assessed.criteria_results.map(
      (c): CriterionResult => ({
        criterionId: c.criterionId,
        description: c.description,
        requirement: c.requirement,
        groupValue: c.groupValue,
        status: c.status,
        explanation: c.explanation,
      }),
    ),
    supplementaryAnswers: supplementaryAnswers,
    assessedAt,
    createdAt: assessedAt,
    updatedAt: assessedAt,
  };
}

export interface AssessEligibilityResult {
  eligibilityResult: EligibilityResult | null;
  supplementaryQuestions: Array<{ id: string; question: string; hint: string | null }>;
}

export async function assessEligibility(
  grantId: string,
  supplementaryAnswers?: Record<string, string>,
): Promise<AssessEligibilityResult> {
  const prismaGrant = await grantRepository.findById(grantId);
  if (!prismaGrant) {
    const err: AppError = new Error('Grant not found');
    err.status = 404;
    throw err;
  }

  const prismaGroup = await groupRepository.findFirst();
  if (!prismaGroup) {
    const err: AppError = new Error('Profile not found');
    err.status = 404;
    throw err;
  }

  const grant = mapGrant(prismaGrant);
  const group = mapGroup(prismaGroup);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [ELIGIBILITY_TOOL],
    tool_choice: { type: 'tool', name: 'assess_eligibility' },
    messages: [
      {
        role: 'user',
        content: buildUserMessage(grant, group, supplementaryAnswers),
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) throw new Error('No eligibility assessment returned');

  const result = toolUse.input as AssessToolResult;

  // If there are UNCLEAR criteria and no supplementary answers yet, return questions
  const pendingQuestions = (result.supplementary_questions ?? []).filter(
    (q) => !supplementaryAnswers?.[q.id],
  );

  if (pendingQuestions.length > 0 && !supplementaryAnswers) {
    return {
      eligibilityResult: null,
      supplementaryQuestions: pendingQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        hint: q.hint ?? null,
      })),
    };
  }

  // Persist result
  const now = new Date().toISOString();
  const persisted = await eligibilityRepository.create(
    grantId,
    group.id,
    result.verdict,
    result.criteria_results,
    supplementaryAnswers ?? null,
  );

  return {
    eligibilityResult: makeEligibilityResult(
      persisted.id,
      grantId,
      group.id,
      result,
      supplementaryAnswers ?? null,
      now,
    ),
    supplementaryQuestions: [],
  };
}

export async function getEligibilityResult(grantId: string): Promise<EligibilityResult | null> {
  const prismaGroup = await groupRepository.findFirst();
  if (!prismaGroup) return null;

  const result = await eligibilityRepository.findByGrantAndGroup(grantId, prismaGroup.id);
  if (!result) return null;

  const now = result.assessedAt.toISOString();
  return {
    id: result.id,
    grantId: result.grantId,
    groupId: result.groupId,
    verdict: result.verdict as EligibilityVerdict,
    criteriaResults: result.criteriaResults as unknown as CriterionResult[],
    supplementaryAnswers: result.supplementaryAnswers as Record<string, string> | null,
    assessedAt: now,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}
