import type { ScoringContext, ScoringResult } from './scoring.types';

/**
 * Category score bonuses.
 * Tweak these values based on your personal preference over time.
 */
const CATEGORY_WEIGHTS: Record<string, number> = {
  'ai-tool':   10,
  'cloud':      8,
  'devtools':   8,
  'saas':       5,
  'education':  5,
  'ecommerce':  3,
  'gaming':     3,
  'food':       2,
  'voucher':    2,
  'other':      0,
};

export function computeScore(ctx: ScoringContext): ScoringResult {
  const reasons: string[] = [];

  // Hard gate: must be eligible for Vietnam
  if (!ctx.eligibleVn) {
    return { score: 0, reasons: ['Not eligible for Vietnam'] };
  }

  // Check expiry first — expired deals are worthless
  if (ctx.expiry) {
    const daysLeft = Math.ceil((ctx.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      return { score: 0, reasons: ['Expired'] };
    }
  }

  let score = 40; // base score

  // ── Risk level (major factor) ──────────────────────────────────────────
  if (ctx.riskLevel === 'low') {
    score += 20;
    reasons.push('+20 low risk');
  } else if (ctx.riskLevel === 'medium') {
    score += 5;
    reasons.push('+5 medium risk');
  } else if (ctx.riskLevel === 'high') {
    score -= 25;
    reasons.push('-25 high risk');
  } else {
    score -= 5;
    reasons.push('-5 unknown risk');
  }

  // ── Monetary value ─────────────────────────────────────────────────────
  if (ctx.valueUsd !== null) {
    if (ctx.valueUsd >= 200) {
      score += 20;
      reasons.push('+20 very high value');
    } else if (ctx.valueUsd >= 100) {
      score += 15;
      reasons.push('+15 high value');
    } else if (ctx.valueUsd >= 50) {
      score += 10;
      reasons.push('+10 decent value');
    } else if (ctx.valueUsd >= 20) {
      score += 5;
      reasons.push('+5 moderate value');
    } else if (ctx.valueUsd <= 0) {
      score -= 10;
      reasons.push('-10 zero/negative value');
    }
  } else {
    score -= 5;
    reasons.push('-5 unknown value');
  }

  // ── Expiry (urgency / reliability) ─────────────────────────────────────
  if (ctx.expiry) {
    const daysLeft = Math.ceil((ctx.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 3) {
      score -= 15;
      reasons.push('-15 expires very soon');
    } else if (daysLeft < 7) {
      score -= 5;
      reasons.push('-5 expires this week');
    } else if (daysLeft > 90) {
      score += 5;
      reasons.push('+5 long validity');
    }
  }

  // ── Category preference ────────────────────────────────────────────────
  const categoryBonus = CATEGORY_WEIGHTS[ctx.category] ?? 0;
  if (categoryBonus > 0) {
    score += categoryBonus;
    reasons.push(`+${categoryBonus} category:${ctx.category}`);
  }

  // ── Friction / barriers ────────────────────────────────────────────────
  if (ctx.cardRequired) {
    score -= 20;
    reasons.push('-20 card required');
  }
  if (ctx.kycRequired) {
    score -= 10;
    reasons.push('-10 KYC required');
  }

  if (ctx.frictionLevel === 'high') {
    score -= 10;
    reasons.push('-10 high friction');
  } else if (ctx.frictionLevel === 'low') {
    score += 5;
    reasons.push('+5 low friction');
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}
