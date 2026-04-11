import { z } from 'zod';
import { LEGAL_STRUCTURES } from '@scout-grants/shared';

const SECTIONS = ['SQUIRRELS', 'BEAVERS', 'CUBS', 'SCOUTS', 'EXPLORERS', 'NETWORK'] as const;
const FUNDING_PURPOSES = [
  'EQUIPMENT',
  'ACTIVITIES',
  'INCLUSION',
  'FACILITIES',
  'COMMUNITY',
  'WELLBEING',
] as const;

export { LEGAL_STRUCTURES };

export const createGroupSchema = z.object({
  // Existing required fields
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

  // Category 1: Identity & registration
  legalStructure: z.enum(LEGAL_STRUCTURES).nullable().optional(),
  registeredWithCharityCommission: z.boolean().nullable().optional(),
  yearEstablished: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .nullable()
    .optional(),
  constitutionInPlace: z.boolean().nullable().optional(),
  bankAccountInGroupName: z.boolean().nullable().optional(),

  // Category 2: Location (postcodes.io fields not in schema — set server-side)
  communityServed: z.string().max(200).nullable().optional(),

  // Category 3: Financial profile
  annualIncome: z.number().int().min(0).nullable().optional(),
  annualExpenditure: z.number().int().min(0).nullable().optional(),
  financialYearEnd: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  hasCurrentAccounts: z.boolean().nullable().optional(),
  currentGrantsHeld: z.number().int().min(0).nullable().optional(),
  largestSingleFunderPercentage: z.number().int().min(0).max(100).nullable().optional(),

  // Category 4: Governance & compliance
  safeguardingPolicyInPlace: z.boolean().nullable().optional(),
  safeguardingPolicyReviewedWithin12Months: z.boolean().nullable().optional(),
  equalitiesPolicyInPlace: z.boolean().nullable().optional(),
  publicLiabilityInsurance: z.boolean().nullable().optional(),
  numberOfTrustees: z.number().int().min(0).nullable().optional(),
  trusteesAreUnrelated: z.boolean().nullable().optional(),
  hasOutstandingMonitoringReports: z.boolean().nullable().optional(),

  // Category 5: Programme & beneficiary
  volunteerCount: z.number().int().min(0).nullable().optional(),
  percentageFreeSchoolMeals: z.number().int().min(0).max(100).nullable().optional(),
  percentageDisabledOrSEND: z.number().int().min(0).max(100).nullable().optional(),
  specificProjectDescription: z.string().max(500).nullable().optional(),
  estimatedProjectCost: z.number().int().min(0).nullable().optional(),
  staffOrPaidWorkers: z.boolean().nullable().optional(),
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
