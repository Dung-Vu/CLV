import type { DealCategory, DealTier, FrictionLevel, FreebieStatus, RiskLevel } from '@/types';

export interface FreebieFilters {
  status?: FreebieStatus | FreebieStatus[];
  minScore?: number;
  category?: DealCategory | string;
  tier?: DealTier;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FreebieListResult {
  items: FreebieRow[];
  total: number;
  page: number;
  pageSize: number;
}

/** Subset of Freebie model fields safe to expose in API responses */
export interface FreebieRow {
  id: string;
  title: string;
  source: string;
  url: string;
  status: string;
  category: string;
  valueUsd: number | null;
  score: number;
  tier: string | null;
  riskLevel: string;
  eligibleVn: boolean;
  cardRequired: boolean;
  kycRequired: boolean;
  frictionLevel: string;
  expiry: Date | null;
  summaryVi: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRawFreebieInput {
  title: string;
  source: string;
  url: string;
  description?: string;
}

export interface UpdateAnalysisInput {
  valueUsd?: number | null;
  expiry?: Date | null;
  eligibleVn?: boolean;
  riskLevel?: RiskLevel;
  category?: DealCategory | string;
  score?: number;
  tier?: DealTier;
  summaryVi?: string;
  stepsJson?: string;
  cardRequired?: boolean;
  kycRequired?: boolean;
  frictionLevel?: FrictionLevel;
  analysisVersion?: string;
  status?: FreebieStatus;
}
