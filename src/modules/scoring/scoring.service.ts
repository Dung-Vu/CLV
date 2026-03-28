import { scoreFreebie } from './engine';
import type { ScoringInput } from './engine';
import type { ScoringContext, ScoringResult } from './scoring.types';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
}

function toScoringInput(ctx: ScoringContext): ScoringInput {
  return {
    eligibleVn: ctx.eligibleVn,
    riskLevel: ctx.riskLevel,
    cardRequired: ctx.cardRequired,
    kycRequired: ctx.kycRequired,
    frictionLevel: ctx.frictionLevel,
    valueUsd: ctx.valueUsd,
    expiry: toDateOnlyString(ctx.expiry),
    category: ctx.category,
    isDeal: true,
  };
}

export function computeScore(ctx: ScoringContext): ScoringResult {
  if (!ctx.eligibleVn) {
    return { score: 0, reasons: ['Not eligible for Vietnam'] };
  }

  if (ctx.expiry) {
    const daysLeft = Math.ceil((ctx.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      return { score: 0, reasons: ['Expired'] };
    }
  }

  const result = scoreFreebie(toScoringInput(ctx));

  return {
    score: result.score,
    reasons: result.explanation,
  };
}
