import { z } from 'zod';

const SECTIONS = ['SQUIRRELS', 'BEAVERS', 'CUBS', 'SCOUTS', 'EXPLORERS', 'NETWORK'] as const;
const FUNDING_PURPOSES = [
  'EQUIPMENT',
  'ACTIVITIES',
  'INCLUSION',
  'FACILITIES',
  'COMMUNITY',
  'WELLBEING',
] as const;

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(200),
  membershipNumber: z.string().min(1, 'Membership number is required').max(50),
  charityNumber: z.string().max(20).nullable().optional(),
  postcode: z.string().min(1, 'Postcode is required').max(10),
  sections: z.array(z.enum(SECTIONS)).min(1, 'At least one section is required'),
  membershipCount: z.number().int().min(1, 'Membership count must be at least 1'),
  fundingPurposes: z
    .array(z.enum(FUNDING_PURPOSES))
    .min(1, 'At least one funding purpose is required'),
  additionalContext: z.string().max(300).nullable().optional(),
});

export const updateGroupSchema = createGroupSchema
  .extend({
    deprivationOverride: z.boolean().nullable().optional(),
    deprivationOverrideReason: z.string().max(500).nullable().optional(),
    ruralOverride: z.boolean().nullable().optional(),
    ruralOverrideReason: z.string().max(500).nullable().optional(),
  })
  .partial();

export type CreateGroupBody = z.infer<typeof createGroupSchema>;
export type UpdateGroupBody = z.infer<typeof updateGroupSchema>;
