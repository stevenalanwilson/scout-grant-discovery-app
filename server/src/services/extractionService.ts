import type Anthropic from '@anthropic-ai/sdk';
import type { Group } from '@scout-grants/shared';
import type { ExtractedGrant } from '../types/extractedGrant';
import type { GrantSource } from '../types/grantSources';
import { anthropicClient as client, CLAUDE_MODEL } from '../lib/anthropic';

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_grants',
  description: 'Extract all grant and funding opportunities found on this web page.',
  input_schema: {
    type: 'object' as const,
    properties: {
      grants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Full name of the grant or funding programme' },
            funder: { type: 'string', description: 'Name of the organisation offering the grant' },
            description: { type: ['string', 'null'], description: 'Brief description of what the grant funds' },
            funding_purposes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['EQUIPMENT', 'ACTIVITIES', 'INCLUSION', 'FACILITIES', 'COMMUNITY', 'WELLBEING'],
              },
              description: 'Which funding categories this grant covers',
            },
            award_min: { type: ['number', 'null'], description: 'Minimum award amount in GBP (integer), or null if unknown' },
            award_max: { type: ['number', 'null'], description: 'Maximum award amount in GBP (integer), or null if unknown' },
            award_typical: { type: ['number', 'null'], description: 'Typical or average award in GBP (integer), or null if unknown' },
            eligibility_criteria: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Short kebab-case identifier, e.g. registered-charity' },
                  description: { type: 'string', description: 'Human-readable criterion name' },
                  requirement: { type: 'string', description: "The funder's exact requirement text" },
                },
                required: ['id', 'description', 'requirement'],
              },
            },
            geographic_scope: { type: ['string', 'null'], description: 'Geographic restriction, e.g. "England only" or "East Midlands"' },
            deadline: { type: ['string', 'null'], description: 'Application deadline as YYYY-MM-DD, or null if not found or rolling' },
            source_url: { type: 'string', description: 'The URL where this grant was found' },
            details_incomplete: {
              type: 'boolean',
              description: 'true if key fields (deadline, award amounts) could not be found on the page',
            },
          },
          required: ['name', 'funder', 'source_url', 'details_incomplete'],
        },
      },
    },
    required: ['grants'],
  },
};

const SYSTEM_PROMPT = `You are a grant research assistant helping UK Scout groups find funding.
Extract all grant and funding opportunities from the provided web page content.

Rules:
- Extract exact information only — never guess or infer field values not present in the text.
- Set fields to null when the information cannot be found.
- Set details_incomplete to true when deadline or award amounts are missing.
- Map purposes to the nearest enum values; omit if no clear match.
- Award amounts must be GBP integers (e.g. 5000 for £5,000).
- Deadlines must be ISO 8601 dates (YYYY-MM-DD); use null for rolling or unknown deadlines.
- If no grants are found, return an empty grants array.`;

function buildUserMessage(pageText: string, source: GrantSource, group: Group): string {
  return `Grant source: ${source.name} (${source.url})

Group profile context:
- Sections: ${group.sections.join(', ')}
- Region: ${group.region ?? 'Unknown'}
- Funding needs: ${group.fundingPurposes.join(', ')}

Web page content:
${pageText}`;
}

interface ExtractionToolResult {
  grants: Array<{
    name: string;
    funder: string;
    description?: string | null;
    funding_purposes?: string[];
    award_min?: number | null;
    award_max?: number | null;
    award_typical?: number | null;
    eligibility_criteria?: Array<{ id: string; description: string; requirement: string }> | null;
    geographic_scope?: string | null;
    deadline?: string | null;
    source_url: string;
    details_incomplete: boolean;
  }>;
}

export async function extractGrantsFromPage(
  pageText: string,
  source: GrantSource,
  group: Group,
): Promise<ExtractedGrant[]> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'extract_grants' },
    messages: [
      {
        role: 'user',
        content: buildUserMessage(pageText, source, group),
      },
    ],
  });

  const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
  if (!toolUse) return [];

  const result = toolUse.input as ExtractionToolResult;

  return result.grants.map((g) => ({
    name: g.name,
    funder: g.funder,
    description: g.description ?? null,
    fundingPurposes: g.funding_purposes ?? [],
    awardMin: g.award_min ?? null,
    awardMax: g.award_max ?? null,
    awardTypical: g.award_typical ?? null,
    eligibilityCriteria: g.eligibility_criteria ?? null,
    geographicScope: g.geographic_scope ?? null,
    deadline: g.deadline ?? null,
    sourceUrl: g.source_url,
    detailsIncomplete: g.details_incomplete,
  }));
}
