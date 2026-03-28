export type FreebieStatus =
  | 'raw'
  | 'analyzed'
  | 'claimed'
  | 'ignored'
  | 'expired'
  | 'analysis_error';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type FrictionLevel = 'low' | 'medium' | 'high' | 'unknown';

export function normalizeRiskLevel(value: string | null | undefined): RiskLevel {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'unknown':
      return value;
    default:
      return 'unknown';
  }
}

export function normalizeFrictionLevel(value: string | null | undefined): FrictionLevel {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'unknown':
      return value;
    default:
      return 'unknown';
  }
}

export type DealTier = 'A' | 'B' | 'C';

export type DealCategory =
  | 'ai-tool'
  | 'saas'
  | 'cloud'
  | 'voucher'
  | 'gaming'
  | 'education'
  | 'devtools'
  | 'food'
  | 'ecommerce'
  | 'other';

export type AppMode = 'clean' | 'grey';

export type SourceKind = 'rss' | 'html' | 'official' | 'reddit' | 'twitter' | 'manual';

export type SourcePriority = 'high' | 'medium' | 'low';

export type SourceTrustLevel = 'high' | 'medium' | 'low';

export function normalizeSourcePriority(value: string | null | undefined): SourcePriority {
  switch (value) {
    case 'high':
    case 'medium':
    case 'low':
      return value;
    default:
      return 'medium';
  }
}

export function normalizeSourceTrustLevel(value: string | null | undefined): SourceTrustLevel {
  switch (value) {
    case 'high':
    case 'medium':
    case 'low':
      return value;
    default:
      return 'medium';
  }
}

export type ActionRecommendation =
  | 'ignore'
  | 'consider_manual'
  | 'strong_suggest'
  | 'auto_candidate';
