import type { DealCategory, FrictionLevel, RiskLevel } from '@/types';

export interface ScoringContext {
  valueUsd: number | null;
  riskLevel: RiskLevel;
  eligibleVn: boolean;
  expiry: Date | null;
  category: DealCategory | string;
  cardRequired: boolean;
  kycRequired: boolean;
  frictionLevel: FrictionLevel;
}

export interface ScoringResult {
  score: number; // 0–100
  reasons: string[];
}
