export type FreebieStatus =
  | 'raw'
  | 'analyzed'
  | 'claimed'
  | 'ignored'
  | 'expired'
  | 'analysis_error';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type FrictionLevel = 'low' | 'medium' | 'high' | 'unknown';

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

export type ActionRecommendation =
  | 'ignore'
  | 'consider_manual'
  | 'strong_suggest'
  | 'auto_candidate';
