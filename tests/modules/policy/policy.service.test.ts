import { describe, it, expect } from 'vitest';
import { classifyTier, evaluateExecutionPolicy } from '@/modules/policy/policy.service';
import type { PolicyInput } from '@/modules/policy/policy.types';

const tierAInput: PolicyInput = {
  score: 80,
  riskLevel: 'low',
  eligibleVn: true,
  cardRequired: false,
  kycRequired: false,
  frictionLevel: 'low',
};

describe('classifyTier', () => {
  it('returns A for ideal deal', () => {
    expect(classifyTier(tierAInput)).toBe('A');
  });

  it('returns C for non-eligible VN', () => {
    expect(classifyTier({ ...tierAInput, eligibleVn: false })).toBe('C');
  });

  it('returns C for high risk', () => {
    expect(classifyTier({ ...tierAInput, riskLevel: 'high' })).toBe('C');
  });

  it('returns C for very low score', () => {
    expect(classifyTier({ ...tierAInput, score: 20 })).toBe('C');
  });

  it('returns B for card-required deal', () => {
    expect(classifyTier({ ...tierAInput, cardRequired: true })).toBe('B');
  });
});

describe('evaluateExecutionPolicy', () => {
  it('Tier A + score >= 70 should be strong_suggest', () => {
    const result = evaluateExecutionPolicy(tierAInput, 'clean');
    expect(result.recommendation).toBe('strong_suggest');
    expect(result.isAutoCandidate).toBe(true);
  });

  it('Tier C never auto candidate', () => {
    const result = evaluateExecutionPolicy({ ...tierAInput, riskLevel: 'high' }, 'clean');
    expect(result.recommendation).toBe('ignore');
    expect(result.isAutoCandidate).toBe(false);
  });

  it('Tier B is consider_manual, not auto', () => {
    const result = evaluateExecutionPolicy({ ...tierAInput, cardRequired: true }, 'clean');
    expect(result.recommendation).toBe('consider_manual');
    expect(result.isAutoCandidate).toBe(false);
  });
});
