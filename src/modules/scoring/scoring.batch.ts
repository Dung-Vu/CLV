import { logger } from '@/lib/logger';
import { freebiesRepository } from '@/modules/freebies/freebies.repository';
import { computeScore } from './scoring.service';

/**
 * Re-runs the scoring engine over all 'analyzed' freebies and persists
 * the updated score + tier back to the DB.
 *
 * This is safe to run repeatedly — it only touches the score field on
 * analyzed records so it doesn't interfere with other status transitions.
 */
export async function rescoreAnalyzedFreebies(limit = 50): Promise<{ updated: number }> {
  logger.info('rescoreAnalyzedFreebies started', { limit });

  const freebies = await freebiesRepository.findForRescore(limit);

  let updated = 0;

  for (const f of freebies) {
    const result = computeScore({
      valueUsd: f.valueUsd,
      riskLevel: f.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
      eligibleVn: f.eligibleVn,
      expiry: f.expiry,
      category: f.category,
      cardRequired: f.cardRequired,
      kycRequired: f.kycRequired,
      frictionLevel: f.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
    });

    await freebiesRepository.updateScore(f.id, result.score);

    updated++;
  }

  logger.info('rescoreAnalyzedFreebies finished', { updated });
  return { updated };
}
