import { ScoringInput } from '../scoring/engine';

export type Tier = 'A' | 'B' | 'C';
export type ExecutionPolicy = 'allow' | 'suggest' | 'block';

export interface UserPrefs {
  autoClaimEnabled: boolean;
  autoClaimMinScore: number;
}

/**
 * Phân loại Tier (A, B, C) dựa theo quy chuẩn Cybersecurity Freebies.
 */
export function classifyTier(
  freebie: Pick<ScoringInput, 'eligibleVn' | 'riskLevel' | 'cardRequired' | 'kycRequired' | 'frictionLevel' | 'isDeal'> & { score: number }
): Tier {
  // Tier C (Bất kỳ 1 trong các điều kiện tồi tệ)
  if (
    freebie.isDeal === false ||
    freebie.riskLevel === 'high' || 
    freebie.eligibleVn === false || 
    freebie.score < 30
  ) {
    return 'C';
  }

  // Tier A (Tất cả điều kiện phải hoàn hảo)
  if (
    freebie.eligibleVn === true &&
    freebie.riskLevel === 'low' &&
    freebie.cardRequired === false &&
    freebie.score >= 60
  ) {
    return 'A';
  }

  // Tier B (Tất cả các trường hợp nằm lấp lửng ở giữa)
  // Thực tế sẽ bao gồm: cardRequired=true, kycRequired=true, riskLevel=medium, friction=high, score=30-59
  return 'B';
}

/**
 * Đánh giá chính sách thực thi Auto-Claim.
 */
export function evaluateExecutionPolicy(
  freebie: { tier: Tier; score: number },
  userPrefs: UserPrefs
): ExecutionPolicy {
  // Hard block if global dry run is activated via ENV
  if (process.env.EXECUTION_DRY_RUN === 'true') {
    return 'block';
  }

  if (freebie.tier === 'C') {
    return 'block';
  }

  if (
    freebie.tier === 'A' && 
    userPrefs.autoClaimEnabled && 
    freebie.score >= userPrefs.autoClaimMinScore
  ) {
    return 'allow';
  }

  return 'suggest';
}

/**
 * Xác định xem deal này có tự động đưa vào AutoClaim Runner không.
 */
export function isAutoCandidate(
  freebie: { tier: Tier; score: number },
  userPrefs: UserPrefs
): boolean {
  return evaluateExecutionPolicy(freebie, userPrefs) === 'allow';
}
