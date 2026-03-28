import { describe, expect, it } from 'vitest';
import { scoreFreebie } from '@/modules/scoring/engine';

describe('scoreFreebie', () => {
  it('returns the hard-filter response when the input is not a deal', () => {
    const result = scoreFreebie({
      eligibleVn: true,
      riskLevel: 'low',
      cardRequired: false,
      kycRequired: false,
      frictionLevel: 'low',
      valueUsd: 100,
      expiry: null,
      category: 'ai-tool',
      isDeal: false,
    });

    expect(result).toEqual({
      score: 0,
      breakdown: { isDeal: -100 },
      explanation: ['Not a deal — content only'],
    });
  });
});