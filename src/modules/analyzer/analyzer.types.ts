import { z } from 'zod';

export interface AnalyzerInput {
  id: string;
  title: string;
  source: string;
  url: string;
  description?: string;
}

export const analyzerOutputSchema = z.object({
  value_usd: z.number().nullable(),
  expiry: z.string().nullable(), // YYYY-MM-DD
  eligible_vn: z.boolean(),
  risk_level: z.enum(['low', 'medium', 'high', 'unknown']),
  category: z.enum(['ai-tool', 'saas', 'cloud', 'voucher', 'gaming', 'education', 'devtools', 'food', 'ecommerce', 'other']),
  score: z.number().int().min(0).max(100),
  summary_vi: z.string(),
  steps: z.array(z.string()),
  card_required: z.boolean(),
  kyc_required: z.boolean(),
  friction_level: z.enum(['low', 'medium', 'high', 'unknown']),
  tier_hint: z.enum(['A', 'B', 'C']),
  is_deal: z.boolean(),
});

export type AnalyzerOutput = z.infer<typeof analyzerOutputSchema>;
