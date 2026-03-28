import { z } from 'zod';

export interface AnalyzerInput {
  id: string;
  title: string;
  source: string;
  url: string;
  description?: string;
}

export const analyzerRiskLevelSchema = z.enum(['low', 'medium', 'high', 'unknown']);
export type AnalyzerRiskLevel = z.infer<typeof analyzerRiskLevelSchema>;

export const analyzerCategorySchema = z.enum([
  'ai-tool',
  'saas',
  'cloud',
  'voucher',
  'gaming',
  'education',
  'devtools',
  'food',
  'ecommerce',
  'other',
]);

export const analyzerFrictionLevelSchema = z.enum(['low', 'medium', 'high', 'unknown']);
export type AnalyzerFrictionLevel = z.infer<typeof analyzerFrictionLevelSchema>;

export const analyzerOutputSchema = z.object({
  value_usd: z.number().nullable(),
  expiry: z.string().nullable(), // YYYY-MM-DD
  eligible_vn: z.boolean(),
  risk_level: analyzerRiskLevelSchema,
  category: analyzerCategorySchema,
  score: z.number().int().min(0).max(100),
  summary_vi: z.string(),
  steps: z.array(z.string()),
  card_required: z.boolean(),
  kyc_required: z.boolean(),
  friction_level: analyzerFrictionLevelSchema,
  tier_hint: z.enum(['A', 'B', 'C']),
  is_deal: z.boolean(),
  deal_evidence: z.string(),
});

export type AnalyzerOutput = z.infer<typeof analyzerOutputSchema>;
