import Anthropic from '@anthropic-ai/sdk';

export const CLAUDE_MODEL = 'claude-sonnet-4-6' as const;

export const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
