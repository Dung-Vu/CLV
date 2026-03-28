import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeScore } from '@/modules/scoring/scoring.service';
import type { ScoringContext } from '@/modules/scoring/scoring.types';

const baseCtx: ScoringContext = {
  valueUsd: 50,
  riskLevel: 'low',
  eligibleVn: true,
  expiry: null,
  category: 'ai-tool',
  cardRequired: false,
  kycRequired: false,
  frictionLevel: 'low',
};

describe('computeScore', () => {
  it('returns 0 if not eligible for VN', () => {
    const result = computeScore({ ...baseCtx, eligibleVn: false });
    expect(result.score).toBe(0);
  });

  it('returns 0 if already expired', () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    const result = computeScore({ ...baseCtx, expiry: yesterday });
    expect(result.score).toBe(0);
  });

  it('gives higher score for ai-tool than voucher', () => {
    const aiTool = computeScore({ ...baseCtx, category: 'ai-tool' });
    const voucher = computeScore({ ...baseCtx, category: 'voucher' });
    expect(aiTool.score).toBeGreaterThan(voucher.score);
  });

  it('penalizes card required deals', () => {
    const withCard = computeScore({ ...baseCtx, cardRequired: true });
    const noCard = computeScore({ ...baseCtx, cardRequired: false });
    expect(noCard.score).toBeGreaterThan(withCard.score);
  });

  it('penalizes high risk', () => {
    const lowRisk = computeScore({ ...baseCtx, riskLevel: 'low' });
    const highRisk = computeScore({ ...baseCtx, riskLevel: 'high' });
    expect(lowRisk.score).toBeGreaterThan(highRisk.score);
  });

  it('score is clamped between 0 and 100', () => {
    const result = computeScore(baseCtx);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  it('penalizes KYC required', () => {
    const withKyc = computeScore({ ...baseCtx, kycRequired: true });
    const noKyc = computeScore({ ...baseCtx, kycRequired: false });
    expect(noKyc.score).toBeGreaterThan(withKyc.score);
  });

  it('penalizes high friction', () => {
    const highFriction = computeScore({ ...baseCtx, frictionLevel: 'high' });
    const lowFriction = computeScore({ ...baseCtx, frictionLevel: 'low' });
    expect(lowFriction.score).toBeGreaterThan(highFriction.score);
  });

  it('penalizes unknown risk vs low risk', () => {
    const unknown = computeScore({ ...baseCtx, riskLevel: 'unknown' });
    const low = computeScore({ ...baseCtx, riskLevel: 'low' });
    expect(low.score).toBeGreaterThan(unknown.score);
  });

  it('penalizes very imminent expiry (< 3 days)', () => {
    const soon = new Date(Date.now() + 2 * 86_400_000); // 2 days
    const later = new Date(Date.now() + 30 * 86_400_000); // 30 days
    const imminentScore = computeScore({ ...baseCtx, expiry: soon });
    const laterScore = computeScore({ ...baseCtx, expiry: later });
    expect(laterScore.score).toBeGreaterThan(imminentScore.score);
  });

  it('rewards very high value deals (valueUsd >= 200)', () => {
    const highValue = computeScore({ ...baseCtx, valueUsd: 200 });
    const lowValue = computeScore({ ...baseCtx, valueUsd: 10 });
    expect(highValue.score).toBeGreaterThan(lowValue.score);
  });

  it('returns reasons array in result', () => {
    const result = computeScore(baseCtx);
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
