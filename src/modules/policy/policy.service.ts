import type { AppMode, DealTier } from '@/types';
import type { PolicyInput, PolicyResult } from './policy.types';

/**
 * Classifies a deal into Tier A / B / C based on risk & eligibility signals.
 * Follows the canonical definition in docs/tier-policy.md.
 */
export function classifyTier(input: PolicyInput): DealTier {
  const { eligibleVn, riskLevel, cardRequired, kycRequired, frictionLevel, score } = input;

  // Tier C: high risk, not eligible, or very low score
  if (
    !eligibleVn ||
    riskLevel === 'high' ||
    score < 30
  ) {
    return 'C';
  }

  // Tier A: low-risk, no card, low/medium friction, eligible VN
  if (
    eligibleVn &&
    riskLevel === 'low' &&
    !cardRequired &&
    !kycRequired &&
    (frictionLevel === 'low' || frictionLevel === 'medium')
  ) {
    return 'A';
  }

  // Tier B: everything else that isn't C
  return 'B';
}

/**
 * Evaluates the full execution policy for a deal.
 * Returns tier, recommendation, and whether it's an auto-claim candidate.
 */
export function evaluateExecutionPolicy(input: PolicyInput, mode: AppMode): PolicyResult {
  const tier = input.tier ?? classifyTier(input);

  let recommendation: PolicyResult['recommendation'];

  if (tier === 'C' || !input.eligibleVn) {
    recommendation = 'ignore';
  } else if (tier === 'A' && input.score >= 70) {
    recommendation = 'strong_suggest';
  } else if (tier === 'A') {
    recommendation = 'consider_manual';
  } else {
    // Tier B
    recommendation = 'consider_manual';
  }

  // Auto-candidate: Tier A, good score, no card/KYC required
  const isAutoCandidate =
    tier === 'A' &&
    input.score >= 70 &&
    !input.cardRequired &&
    !input.kycRequired;

  return { tier, recommendation, isAutoCandidate, mode };
}

export function isExecutionAllowed(result: PolicyResult): boolean {
  // Tier C is never executable regardless of mode
  if (result.tier === 'C') return false;
  // Tier B is never auto, only manual
  if (result.tier === 'B') return false;
  // Tier A + auto candidate
  return result.isAutoCandidate;
}
