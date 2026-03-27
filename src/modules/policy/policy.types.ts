import type { ActionRecommendation, AppMode, DealTier, FrictionLevel, RiskLevel } from '@/types';

export interface PolicyInput {
  score: number;
  riskLevel: RiskLevel;
  eligibleVn: boolean;
  cardRequired: boolean;
  kycRequired: boolean;
  frictionLevel: FrictionLevel;
  tier?: DealTier; // pre-computed if available
}

export interface PolicyResult {
  tier: DealTier;
  recommendation: ActionRecommendation;
  isAutoCandidate: boolean;
  mode: AppMode;
}
