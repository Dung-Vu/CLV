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

  it('returns A for medium friction (allowed in Tier A)', () => {
    expect(classifyTier({ ...tierAInput, frictionLevel: 'medium' })).toBe('A');
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

  it('returns C at score boundary — score 29', () => {
    expect(classifyTier({ ...tierAInput, score: 29 })).toBe('C');
  });

  it('does NOT return C at score 30 (boundary is exclusive)', () => {
    expect(classifyTier({ ...tierAInput, score: 30 })).toBe('A');
  });

  it('returns B for card-required deal', () => {
    expect(classifyTier({ ...tierAInput, cardRequired: true })).toBe('B');
  });

  it('returns B for kyc-required deal', () => {
    expect(classifyTier({ ...tierAInput, kycRequired: true })).toBe('B');
  });

  it('returns B for high friction', () => {
    expect(classifyTier({ ...tierAInput, frictionLevel: 'high' })).toBe('B');
  });

  it('returns B for unknown friction (cannot confirm low/medium)', () => {
    expect(classifyTier({ ...tierAInput, frictionLevel: 'unknown' })).toBe('B');
  });

  it('returns B for medium risk', () => {
    expect(classifyTier({ ...tierAInput, riskLevel: 'medium' })).toBe('B');
  });

  it('returns B for unknown risk (cannot confirm low)', () => {
    expect(classifyTier({ ...tierAInput, riskLevel: 'unknown' })).toBe('B');
  });

  it('Tier C gate wins over Tier B trigger (non-eligible overrides card=false)', () => {
    // eligible=false should produce C even if no other B trigger
    expect(classifyTier({ ...tierAInput, eligibleVn: false, cardRequired: true })).toBe('C');
  });
});

describe('evaluateExecutionPolicy', () => {
  it('Tier A + autoClaimEnabled=true → auto_candidate and isAutoCandidate', () => {
    const result = evaluateExecutionPolicy(tierAInput, 'clean', true);
    expect(result.tier).toBe('A');
    expect(result.recommendation).toBe('auto_candidate');
    expect(result.isAutoCandidate).toBe(true);
  });

  it('Tier A + autoClaimEnabled=false → strong_suggest, NOT auto candidate', () => {
    const result = evaluateExecutionPolicy(tierAInput, 'clean', false);
    expect(result.tier).toBe('A');
    expect(result.recommendation).toBe('strong_suggest');
    expect(result.isAutoCandidate).toBe(false);
  });

  it('Tier A + grey mode + autoClaimEnabled=true → auto_candidate (grey supports Tier A)', () => {
    const result = evaluateExecutionPolicy(tierAInput, 'grey', true);
    expect(result.tier).toBe('A');
    expect(result.isAutoCandidate).toBe(true);
  });

  it('Tier C → ignore, never auto candidate', () => {
    const result = evaluateExecutionPolicy({ ...tierAInput, riskLevel: 'high' }, 'clean', true);
    expect(result.tier).toBe('C');
    expect(result.recommendation).toBe('ignore');
    expect(result.isAutoCandidate).toBe(false);
  });

  it('Tier B → consider_manual, not auto', () => {
    const result = evaluateExecutionPolicy({ ...tierAInput, cardRequired: true }, 'clean', true);
    expect(result.tier).toBe('B');
    expect(result.recommendation).toBe('consider_manual');
    expect(result.isAutoCandidate).toBe(false);
  });

  it('kyc=true → Tier B → not auto candidate even when autoClaimEnabled=true', () => {
    const result = evaluateExecutionPolicy({ ...tierAInput, kycRequired: true }, 'clean', true);
    expect(result.tier).toBe('B');
    expect(result.isAutoCandidate).toBe(false);
  });

  it('unknown friction → Tier B → consider_manual', () => {
    const result = evaluateExecutionPolicy({ ...tierAInput, frictionLevel: 'unknown' }, 'clean', true);
    expect(result.tier).toBe('B');
    expect(result.recommendation).toBe('consider_manual');
  });

  it('mode is preserved in result', () => {
    const clean = evaluateExecutionPolicy(tierAInput, 'clean', true);
    const grey = evaluateExecutionPolicy(tierAInput, 'grey', true);
    expect(clean.mode).toBe('clean');
    expect(grey.mode).toBe('grey');
  });
});
