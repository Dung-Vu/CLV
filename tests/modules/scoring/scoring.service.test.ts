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
});
