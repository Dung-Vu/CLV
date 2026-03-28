import type { AppMode, DealTier } from '@/types';
import type { PolicyInput, PolicyResult } from './policy.types';

/**
 * Classifies a deal into Tier A / B / C based on risk & eligibility signals.
 * Follows the canonical definition in docs/tier-policy.md.
 *
 * Evaluation order: C (hard gates) → B (caution triggers) → A (fallback when fully clean).
 */
export function classifyTier(input: PolicyInput): DealTier {
  const { eligibleVn, riskLevel, cardRequired, kycRequired, frictionLevel, score } = input;

  // Tier C: hard gates — any one match → hidden by default, no auto
  if (!eligibleVn || riskLevel === 'high' || score < 30) {
    return 'C';
  }

  // Tier B: any caution trigger — display with warning, no auto
  if (
    cardRequired ||
    kycRequired ||
    frictionLevel === 'high' ||
    frictionLevel === 'unknown' || // cannot confirm low/medium
    riskLevel === 'medium' ||
    riskLevel === 'unknown' // cannot confirm low
  ) {
    return 'B';
  }

  // Tier A: eligible VN + low risk + no card/KYC + low|medium friction
  return 'A';
}

/**
 * Evaluates the full execution policy for a deal.
 * Returns tier, recommendation, and whether it's an auto-claim candidate.
 *
 * `isAutoCandidate` is true ONLY when tier === 'A' AND autoClaimEnabled === true.
 * `recommendation` is 'auto_candidate' only when isAutoCandidate is true.
 */
export function evaluateExecutionPolicy(
  input: PolicyInput,
  mode: AppMode,
  autoClaimEnabled: boolean,
): PolicyResult {
  const tier = input.tier ?? classifyTier(input);
  const isAutoCandidate = tier === 'A' && autoClaimEnabled;

  let recommendation: PolicyResult['recommendation'];

  if (tier === 'C') {
    recommendation = 'ignore';
  } else if (isAutoCandidate) {
    recommendation = 'auto_candidate';
  } else if (tier === 'A') {
    recommendation = 'strong_suggest';
  } else {
    // Tier B
    recommendation = 'consider_manual';
  }

  return { tier, recommendation, isAutoCandidate, mode };
}

export function isExecutionAllowed(result: PolicyResult): boolean {
  // isAutoCandidate already encodes: tier === 'A' && autoClaimEnabled
  return result.isAutoCandidate;
}
